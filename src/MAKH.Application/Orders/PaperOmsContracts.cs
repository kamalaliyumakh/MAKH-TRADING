using MAKH.Application.Broker;

namespace MAKH.Application.Orders;

public enum PaperProposalState { Approved, Expired, Consumed }

public sealed record PaperOrderProposal(
    Guid ProposalId,
    Guid AccountId,
    Guid SecurityId,
    Guid RiskDecisionId,
    CanonicalOrderSide Side,
    long Quantity,
    decimal LimitPrice,
    CanonicalTimeInForce TimeInForce,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt,
    PaperProposalState State,
    string Digest,
    string CorrelationId)
{
    public bool CreatesLiveAuthority => State == (PaperProposalState)(-1);
}

public sealed record PaperManagedOrder(
    Guid OrderId,
    Guid ProposalId,
    Guid AccountId,
    Guid SecurityId,
    string ClientOrderId,
    CanonicalOrderSide Side,
    long Quantity,
    long FilledQuantity,
    decimal LimitPrice,
    CanonicalTimeInForce TimeInForce,
    CanonicalOrderState State,
    int Version,
    DateTimeOffset UpdatedAt,
    string Reason,
    bool RequiresReconciliation,
    string? ProviderOrderId,
    string CorrelationId)
{
    public long RemainingQuantity => Math.Max(0, Quantity - FilledQuantity);
    public bool CreatesLiveAuthority => Version < 0;
}

public sealed record OmsCommandResult(PaperManagedOrder Order, bool WasReplay);

public interface IPaperOmsStore
{
    T Execute<T>(Func<PaperOmsState, T> operation);
}

public sealed class PaperOmsState
{
    public Dictionary<Guid, PaperOrderProposal> Proposals { get; } = [];
    public Dictionary<Guid, PaperManagedOrder> Orders { get; } = [];
    public Dictionary<string, (string Hash, OmsCommandResult Result)> Commands { get; } = new(StringComparer.Ordinal);
}
