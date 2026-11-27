using MAKH.Application.Broker;

namespace MAKH.Infrastructure.Broker;

public enum SyntheticSubmitBehavior
{
    Accept,
    Reject,
    TimeoutAfterPossibleSubmission,
}

public sealed record SyntheticBrokerOrderSnapshot(
    string ProviderOrderId,
    string ClientOrderId,
    string ProviderState,
    long Quantity,
    long FilledQuantity,
    decimal LimitPrice,
    DateTimeOffset UpdatedAt,
    string Reason);

public sealed class SyntheticPaperBrokerAdapter : IPaperBrokerAdapter
{
    private readonly object sync = new();
    private readonly Dictionary<string, (string Payload, CanonicalBrokerOrder Order)> orders = new(StringComparer.Ordinal);
    private readonly Func<DateTimeOffset> clock;
    private long providerSequence;

    public SyntheticPaperBrokerAdapter(BrokerAccountIdentity account, Func<DateTimeOffset> clock, SyntheticSubmitBehavior behavior = SyntheticSubmitBehavior.Accept)
    {
        Account = account ?? throw new ArgumentNullException(nameof(account));
        this.clock = clock ?? throw new ArgumentNullException(nameof(clock));
        Behavior = behavior;
        if (account.Environment != BrokerEnvironment.Paper)
            throw new InvalidOperationException("Synthetic paper adapter requires a PAPER account identity.");
        if (!string.Equals(account.Provider, ProviderName, StringComparison.Ordinal))
            throw new InvalidOperationException("Synthetic paper adapter requires its canonical provider identity.");
        if (!Enum.IsDefined(behavior))
            throw new ArgumentOutOfRangeException(nameof(behavior));
    }

    public string ProviderName => "synthetic-paper";
    public BrokerAccountIdentity Account { get; }
    public SyntheticSubmitBehavior Behavior { get; set; }
    public int ProviderSubmitCount { get; private set; }
    public int ProviderCancelCount { get; private set; }

    public Task<BrokerSubmitResult> SubmitAsync(PaperOrderRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);
        cancellationToken.ThrowIfCancellationRequested();
        if (!request.RiskApprovedForPaperProposal)
            throw new InvalidOperationException("A paper-proposal risk approval is required.");

        lock (sync)
        {
            if (orders.TryGetValue(request.ClientOrderId, out var existing))
            {
                if (!string.Equals(existing.Payload, request.PayloadIdentity, StringComparison.Ordinal))
                    throw new InvalidOperationException("Client order ID is already bound to a different payload.");
                return Task.FromResult(new BrokerSubmitResult(existing.Order, true));
            }

            ProviderSubmitCount++;
            var providerOrderId = $"paper-{++providerSequence:D8}";
            var state = Behavior switch
            {
                SyntheticSubmitBehavior.Accept => CanonicalOrderState.Accepted,
                SyntheticSubmitBehavior.Reject => CanonicalOrderState.Rejected,
                SyntheticSubmitBehavior.TimeoutAfterPossibleSubmission => CanonicalOrderState.Unknown,
                _ => CanonicalOrderState.Unknown,
            };
            var order = new CanonicalBrokerOrder(
                ProviderName, providerOrderId, request.ClientOrderId, request.AccountId, request.SecurityId,
                request.Side, request.Quantity, 0, request.LimitPrice, request.TimeInForce, state, clock(),
                Behavior == SyntheticSubmitBehavior.TimeoutAfterPossibleSubmission
                    ? "Transport outcome is unknown; query and reconcile before retry."
                    : Behavior == SyntheticSubmitBehavior.Reject ? "Synthetic broker rejection." : "Synthetic paper order accepted.",
                state == CanonicalOrderState.Unknown, request.CorrelationId);
            orders.Add(request.ClientOrderId, (request.PayloadIdentity, order));
            return Task.FromResult(new BrokerSubmitResult(order, false));
        }
    }

    public Task<CanonicalBrokerOrder?> FindByClientOrderIdAsync(string clientOrderId, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var key = string.IsNullOrWhiteSpace(clientOrderId)
            ? throw new ArgumentException("Client order ID is required.", nameof(clientOrderId))
            : clientOrderId.Trim();
        lock (sync)
            return Task.FromResult(orders.TryGetValue(key, out var order) ? order.Order : null);
    }

    public Task<BrokerCancelResult> CancelAsync(
        string clientOrderId,
        string correlationId,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var key = Required(clientOrderId, nameof(clientOrderId));
        var correlation = Required(correlationId, nameof(correlationId));

        lock (sync)
        {
            if (!orders.TryGetValue(key, out var existing))
                throw new InvalidOperationException("Order must exist before cancellation.");

            if (existing.Order.State == CanonicalOrderState.Cancelled)
                return Task.FromResult(new BrokerCancelResult(existing.Order, true));

            if (existing.Order.State is CanonicalOrderState.Unknown or CanonicalOrderState.Filled or CanonicalOrderState.Rejected)
                throw new InvalidOperationException("An unknown, filled or rejected order cannot be cancelled.");

            ProviderCancelCount++;
            var cancelled = existing.Order with
            {
                State = CanonicalOrderState.Cancelled,
                UpdatedAt = clock(),
                Reason = "Synthetic paper order cancelled.",
                RequiresReconciliation = false,
                CorrelationId = correlation,
            };
            orders[key] = (existing.Payload, cancelled);
            return Task.FromResult(new BrokerCancelResult(cancelled, false));
        }
    }

    public CanonicalBrokerOrder ApplySnapshot(PaperOrderRequest request, SyntheticBrokerOrderSnapshot snapshot)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentNullException.ThrowIfNull(snapshot);
        if (!string.Equals(request.ClientOrderId, snapshot.ClientOrderId, StringComparison.Ordinal))
            throw new InvalidOperationException("Snapshot client order identity does not match.");
        if (snapshot.Quantity != request.Quantity || snapshot.LimitPrice != request.LimitPrice)
            throw new InvalidOperationException("Snapshot order terms contradict the client intent.");
        if (snapshot.FilledQuantity < 0 || snapshot.FilledQuantity > snapshot.Quantity)
            throw new InvalidOperationException("Snapshot fill quantity is invalid.");

        lock (sync)
        {
            if (!orders.TryGetValue(request.ClientOrderId, out var existing))
                throw new InvalidOperationException("Order must be submitted before applying a snapshot.");
            if (!string.Equals(existing.Order.ProviderOrderId, snapshot.ProviderOrderId, StringComparison.Ordinal))
                throw new InvalidOperationException("Provider order identity changed.");
            var mapped = MapState(snapshot.ProviderState, snapshot.FilledQuantity, snapshot.Quantity);
            var reason = string.IsNullOrWhiteSpace(snapshot.Reason) ? "Provider supplied no reason." : snapshot.Reason.Trim();
            if (snapshot.UpdatedAt < existing.Order.UpdatedAt)
                return existing.Order;
            if (snapshot.UpdatedAt == existing.Order.UpdatedAt)
            {
                if (existing.Order.FilledQuantity == snapshot.FilledQuantity &&
                    existing.Order.State == mapped &&
                    string.Equals(existing.Order.Reason, reason, StringComparison.Ordinal))
                    return existing.Order;
                throw new InvalidOperationException("A conflicting provider snapshot reused the current observation time.");
            }
            if (!CanAdvance(existing.Order.State, mapped)) return existing.Order;
            var updated = existing.Order with
            {
                FilledQuantity = snapshot.FilledQuantity,
                State = mapped,
                UpdatedAt = snapshot.UpdatedAt,
                Reason = reason,
                RequiresReconciliation = mapped == CanonicalOrderState.Unknown,
            };
            orders[request.ClientOrderId] = (existing.Payload, updated);
            return updated;
        }
    }

    public static CanonicalOrderState MapState(string providerState, long filledQuantity, long quantity)
    {
        if (string.IsNullOrWhiteSpace(providerState))
            throw new ArgumentException("Provider state is required.", nameof(providerState));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        if (filledQuantity < 0 || filledQuantity > quantity)
            throw new ArgumentOutOfRangeException(nameof(filledQuantity));
        if (filledQuantity == quantity && quantity > 0) return CanonicalOrderState.Filled;
        if (filledQuantity > 0 && filledQuantity < quantity) return CanonicalOrderState.PartiallyFilled;
        return providerState.Trim().ToUpperInvariant() switch
        {
            "NEW" or "ACCEPTED" => CanonicalOrderState.Accepted,
            "PENDING_CANCEL" => CanonicalOrderState.PendingCancel,
            "CANCELLED" or "CANCELED" => CanonicalOrderState.Cancelled,
            "REJECTED" => CanonicalOrderState.Rejected,
            _ => CanonicalOrderState.Unknown,
        };
    }

    private static bool CanAdvance(CanonicalOrderState current, CanonicalOrderState next)
    {
        if (next == CanonicalOrderState.Filled) return true;
        if (current is CanonicalOrderState.Filled or CanonicalOrderState.Cancelled or CanonicalOrderState.Rejected)
            return current == next;
        if (current == CanonicalOrderState.PartiallyFilled && next == CanonicalOrderState.Accepted) return false;
        return true;
    }

    private static string Required(string value, string name) => string.IsNullOrWhiteSpace(value)
        ? throw new ArgumentException("Value is required.", name)
        : value.Trim();
}
