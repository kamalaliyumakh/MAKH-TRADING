using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using MAKH.Application.Broker;

namespace MAKH.Application.Orders;

public sealed class PaperOmsService(IPaperOmsStore store, IPaperBrokerAdapter broker, Func<DateTimeOffset> clock) : IDisposable
{
    private readonly SemaphoreSlim submitGate = new(1, 1);

    public PaperOrderProposal CreateProposal(
        Guid proposalId, Guid accountId, Guid securityId, Guid riskDecisionId,
        CanonicalOrderSide side, long quantity, decimal limitPrice, CanonicalTimeInForce timeInForce,
        bool riskApprovedForPaperProposal, DateTimeOffset expiresAt, string correlationId)
    {
        if (!riskApprovedForPaperProposal) throw new InvalidOperationException("Risk approval for a paper proposal is required.");
        if (proposalId == Guid.Empty || accountId == Guid.Empty || securityId == Guid.Empty || riskDecisionId == Guid.Empty)
            throw new ArgumentException("Proposal, account, security and risk decision IDs are required.");
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(limitPrice);
        if (!Enum.IsDefined(side)) throw new ArgumentOutOfRangeException(nameof(side));
        if (!Enum.IsDefined(timeInForce)) throw new ArgumentOutOfRangeException(nameof(timeInForce));
        var now = clock();
        if (expiresAt <= now) throw new ArgumentException("Proposal expiry must be in the future.", nameof(expiresAt));
        var digest = Hash(Canonical(proposalId, accountId, securityId, riskDecisionId, side, quantity,
            limitPrice, timeInForce, expiresAt.ToUniversalTime()));
        var proposal = new PaperOrderProposal(proposalId, accountId, securityId, riskDecisionId, side, quantity,
            limitPrice, timeInForce, now, expiresAt, PaperProposalState.Approved, digest, Required(correlationId));
        return store.Execute(state =>
        {
            if (state.Proposals.TryGetValue(proposalId, out var existing))
                return existing == proposal ? existing : throw new InvalidOperationException("Proposal ID conflict.");
            state.Proposals.Add(proposalId, proposal);
            return proposal;
        });
    }

    public async Task<OmsCommandResult> SubmitAsync(Guid proposalId, string proposalDigest, string idempotencyKey, CancellationToken cancellationToken = default)
    {
        await submitGate.WaitAsync(cancellationToken);
        try
        {
            return await SubmitSerializedAsync(proposalId, proposalDigest, idempotencyKey, cancellationToken);
        }
        finally
        {
            submitGate.Release();
        }
    }

    private async Task<OmsCommandResult> SubmitSerializedAsync(Guid proposalId, string proposalDigest, string idempotencyKey, CancellationToken cancellationToken)
    {
        var proposal = store.Execute(state => state.Proposals.TryGetValue(proposalId, out var found)
            ? found : throw new KeyNotFoundException("Proposal was not found."));
        var commandHash = Hash($"submit|{proposalId}|{proposalDigest}");
        var replay = Replay(idempotencyKey, commandHash);
        if (replay is not null) return replay;
        if (proposal.State != PaperProposalState.Approved) throw new InvalidOperationException("Proposal is not available for submission.");
        if (proposal.ExpiresAt <= clock()) throw new InvalidOperationException("Proposal has expired.");
        if (!string.Equals(proposal.Digest, proposalDigest, StringComparison.Ordinal)) throw new InvalidOperationException("Proposal digest mismatch.");

        var request = new PaperOrderRequest(proposal.AccountId, proposal.SecurityId, proposal.RiskDecisionId,
            proposal.ProposalId.ToString("N"), proposal.Side, proposal.Quantity, proposal.LimitPrice,
            proposal.TimeInForce, true, proposal.CorrelationId);
        var submitted = await broker.SubmitAsync(request, cancellationToken);
        ValidateBrokerOrder(proposal, submitted.Order);
        var order = FromBroker(Guid.NewGuid(), proposal, submitted.Order, 1);
        return store.Execute(state =>
        {
            if (state.Commands.TryGetValue(idempotencyKey, out var concurrent)) return Same(concurrent, commandHash);
            state.Proposals[proposalId] = proposal with { State = PaperProposalState.Consumed };
            state.Orders.Add(order.OrderId, order);
            var result = new OmsCommandResult(order, false);
            state.Commands.Add(Required(idempotencyKey), (commandHash, result));
            return result;
        });
    }

    public OmsCommandResult RequestCancel(Guid orderId, int expectedVersion, string idempotencyKey, string reason)
    {
        var hash = Hash($"cancel|{orderId}|{expectedVersion}|{Required(reason)}");
        var replay = Replay(idempotencyKey, hash);
        if (replay is not null) return replay;
        return Mutate(orderId, expectedVersion, idempotencyKey, hash, order =>
        {
            EnsureMutable(order);
            if (order.RemainingQuantity == 0) throw new InvalidOperationException("No remaining quantity can be cancelled.");
            return order with { State = CanonicalOrderState.PendingCancel, Version = order.Version + 1, UpdatedAt = clock(), Reason = reason.Trim() };
        });
    }

    public OmsCommandResult RequestReplace(Guid orderId, int expectedVersion, long quantity, decimal limitPrice, string idempotencyKey, string reason)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(limitPrice);
        var hash = Hash($"replace|{orderId}|{expectedVersion}|{quantity}|{limitPrice.ToString(CultureInfo.InvariantCulture)}|{Required(reason)}");
        var replay = Replay(idempotencyKey, hash);
        if (replay is not null) return replay;
        return Mutate(orderId, expectedVersion, idempotencyKey, hash, order =>
        {
            EnsureMutable(order);
            if (quantity < order.FilledQuantity) throw new InvalidOperationException("Replacement quantity cannot be below cumulative fills.");
            return order with { Quantity = quantity, LimitPrice = limitPrice, State = CanonicalOrderState.PendingReplace, Version = order.Version + 1, UpdatedAt = clock(), Reason = reason.Trim() };
        });
    }

    public PaperManagedOrder Reconcile(Guid orderId, CanonicalBrokerOrder brokerOrder)
    {
        ArgumentNullException.ThrowIfNull(brokerOrder);
        return store.Execute(state =>
        {
            var current = Get(state, orderId);
            if (!string.Equals(broker.ProviderName, brokerOrder.Provider, StringComparison.Ordinal) ||
                !string.Equals(current.ProviderOrderId, brokerOrder.ProviderOrderId, StringComparison.Ordinal) ||
                !string.Equals(current.ClientOrderId, brokerOrder.ClientOrderId, StringComparison.Ordinal) ||
                current.AccountId != brokerOrder.AccountId ||
                current.SecurityId != brokerOrder.SecurityId)
                throw new InvalidOperationException("Broker order provider, identity or account scope does not match.");
            if (current.Side != brokerOrder.Side || current.TimeInForce != brokerOrder.TimeInForce)
                throw new InvalidOperationException("Broker order execution terms contradict the managed order.");
            if (!Enum.IsDefined(brokerOrder.Side) || !Enum.IsDefined(brokerOrder.TimeInForce) ||
                !Enum.IsDefined(brokerOrder.State) || brokerOrder.Quantity <= 0 || brokerOrder.LimitPrice <= 0 ||
                brokerOrder.FilledQuantity < 0 || brokerOrder.FilledQuantity > brokerOrder.Quantity)
                throw new InvalidOperationException("Broker order quantity, fill or price is invalid.");
            if (brokerOrder.UpdatedAt < current.UpdatedAt) return current;
            if (brokerOrder.UpdatedAt == current.UpdatedAt && !SameSnapshot(current, brokerOrder))
                throw new InvalidOperationException("A conflicting broker snapshot reused the current observation time.");
            if (brokerOrder.FilledQuantity < current.FilledQuantity) return current;
            if ((brokerOrder.Quantity != current.Quantity || brokerOrder.LimitPrice != current.LimitPrice) &&
                current.State != CanonicalOrderState.PendingReplace)
                throw new InvalidOperationException("Broker order terms changed without a pending replacement.");
            if (current.State == CanonicalOrderState.Filled) return current;
            if (current.State is CanonicalOrderState.Cancelled or CanonicalOrderState.Rejected)
            {
                if (current.State != CanonicalOrderState.Cancelled || brokerOrder.State != CanonicalOrderState.Filled ||
                    brokerOrder.FilledQuantity != brokerOrder.Quantity)
                    return current;
            }
            if (current.State == CanonicalOrderState.PartiallyFilled &&
                brokerOrder.State == CanonicalOrderState.Accepted) return current;
            if (SameSnapshot(current, brokerOrder)) return current;
            var updated = current with
            {
                Quantity = brokerOrder.Quantity,
                FilledQuantity = brokerOrder.FilledQuantity,
                LimitPrice = brokerOrder.LimitPrice,
                State = brokerOrder.State,
                Version = current.Version + 1,
                UpdatedAt = brokerOrder.UpdatedAt,
                Reason = brokerOrder.Reason,
                RequiresReconciliation = brokerOrder.RequiresReconciliation,
                ProviderOrderId = brokerOrder.ProviderOrderId
            };
            state.Orders[orderId] = updated;
            return updated;
        });
    }

    public PaperManagedOrder Get(Guid orderId) => store.Execute(state => Get(state, orderId));

    private OmsCommandResult Mutate(Guid orderId, int expectedVersion, string key, string hash, Func<PaperManagedOrder, PaperManagedOrder> mutate) =>
        store.Execute(state =>
        {
            if (state.Commands.TryGetValue(key, out var replay)) return Same(replay, hash);
            var current = Get(state, orderId);
            if (current.Version != expectedVersion) throw new InvalidOperationException("Order version conflict.");
            var updated = mutate(current);
            state.Orders[orderId] = updated;
            var result = new OmsCommandResult(updated, false);
            state.Commands.Add(Required(key), (hash, result));
            return result;
        });

    private OmsCommandResult? Replay(string key, string hash) => store.Execute(state =>
        state.Commands.TryGetValue(Required(key), out var found) ? Same(found, hash) with { WasReplay = true } : null);

    private static OmsCommandResult Same((string Hash, OmsCommandResult Result) found, string hash) =>
        string.Equals(found.Hash, hash, StringComparison.Ordinal) ? found.Result : throw new InvalidOperationException("Idempotency key conflict.");

    private static void EnsureMutable(PaperManagedOrder order)
    {
        if (order.RequiresReconciliation || order.State == CanonicalOrderState.Unknown)
            throw new InvalidOperationException("Unknown broker state requires reconciliation before mutation.");
        if (order.State is CanonicalOrderState.Filled or CanonicalOrderState.Cancelled or CanonicalOrderState.Rejected)
            throw new InvalidOperationException("Terminal order cannot be mutated.");
        if (order.State is CanonicalOrderState.PendingCancel or CanonicalOrderState.PendingReplace)
            throw new InvalidOperationException("Another order mutation is pending.");
    }

    private static PaperManagedOrder Get(PaperOmsState state, Guid id) => state.Orders.TryGetValue(id, out var order)
        ? order : throw new KeyNotFoundException("Order was not found.");
    private static PaperManagedOrder FromBroker(Guid id, PaperOrderProposal proposal, CanonicalBrokerOrder order, int version) =>
        new(id, proposal.ProposalId, order.AccountId, order.SecurityId, order.ClientOrderId, order.Side,
            order.Quantity, order.FilledQuantity, order.LimitPrice, order.TimeInForce, order.State, version,
            order.UpdatedAt, order.Reason, order.RequiresReconciliation, order.ProviderOrderId, order.CorrelationId);
    private void ValidateBrokerOrder(PaperOrderProposal proposal, CanonicalBrokerOrder? order)
    {
        ArgumentNullException.ThrowIfNull(order);
        if (!string.Equals(broker.ProviderName, order.Provider, StringComparison.Ordinal) ||
            string.IsNullOrWhiteSpace(order.ProviderOrderId) ||
            !string.Equals(proposal.ProposalId.ToString("N"), order.ClientOrderId, StringComparison.Ordinal) ||
            proposal.AccountId != order.AccountId || proposal.SecurityId != order.SecurityId ||
            proposal.Side != order.Side || proposal.Quantity != order.Quantity ||
            proposal.LimitPrice != order.LimitPrice || proposal.TimeInForce != order.TimeInForce ||
            !string.Equals(proposal.CorrelationId, order.CorrelationId, StringComparison.Ordinal))
            throw new InvalidOperationException("Broker submission response contradicts the approved proposal.");
        if (!Enum.IsDefined(order.Side) || !Enum.IsDefined(order.TimeInForce) || !Enum.IsDefined(order.State) ||
            order.FilledQuantity < 0 || order.FilledQuantity > order.Quantity ||
            (order.State == CanonicalOrderState.Unknown) != order.RequiresReconciliation)
            throw new InvalidOperationException("Broker submission response has an invalid state or fill shape.");
    }
    private static bool SameSnapshot(PaperManagedOrder current, CanonicalBrokerOrder brokerOrder) =>
        current.Quantity == brokerOrder.Quantity &&
        current.FilledQuantity == brokerOrder.FilledQuantity &&
        current.LimitPrice == brokerOrder.LimitPrice &&
        current.State == brokerOrder.State &&
        current.UpdatedAt == brokerOrder.UpdatedAt &&
        string.Equals(current.Reason, brokerOrder.Reason, StringComparison.Ordinal) &&
        current.RequiresReconciliation == brokerOrder.RequiresReconciliation &&
        string.Equals(current.ProviderOrderId, brokerOrder.ProviderOrderId, StringComparison.Ordinal);
    private static string Required(string value) => string.IsNullOrWhiteSpace(value) ? throw new ArgumentException("Value is required.") : value.Trim();
    private static string Canonical(params object[] values)
    {
        var identity = new StringBuilder();
        foreach (var value in values)
        {
            var text = value is IFormattable formattable
                ? formattable.ToString(null, CultureInfo.InvariantCulture)
                : value.ToString() ?? string.Empty;
            identity.Append(text.Length.ToString(CultureInfo.InvariantCulture)).Append(':').Append(text);
        }
        return identity.ToString();
    }
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value))).ToLowerInvariant();
    public void Dispose() => submitGate.Dispose();
}
