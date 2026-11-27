using MAKH.Application.Broker;

namespace MAKH.Application.Positions;

public enum ExecutionFactKind { Fill, Correction, Bust }
public enum ProtectionState { NotRequired, Pending, Protected, UnderProtected, OverProtected, Unknown }

public sealed record ExecutionFact
{
    public ExecutionFact(
        string provider, string providerAccountReference, string providerExecutionId,
        Guid accountId, Guid securityId, Guid orderId, CanonicalOrderSide side,
        long quantity, decimal price, decimal fee, DateTimeOffset executedAt,
        ExecutionFactKind kind = ExecutionFactKind.Fill, string? correctsExecutionId = null)
    {
        Provider = Required(provider, nameof(provider));
        ProviderAccountReference = Required(providerAccountReference, nameof(providerAccountReference));
        ProviderExecutionId = Required(providerExecutionId, nameof(providerExecutionId));
        if (accountId == Guid.Empty || securityId == Guid.Empty || orderId == Guid.Empty)
            throw new ArgumentException("Account, security and order IDs are required.");
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(price);
        ArgumentOutOfRangeException.ThrowIfNegative(fee);
        if (!Enum.IsDefined(side)) throw new ArgumentOutOfRangeException(nameof(side));
        if (!Enum.IsDefined(kind)) throw new ArgumentOutOfRangeException(nameof(kind));
        if (executedAt == default || executedAt.Offset != TimeSpan.Zero)
            throw new ArgumentException("Execution time must be a non-default UTC timestamp.", nameof(executedAt));
        if (kind == ExecutionFactKind.Fill && !string.IsNullOrWhiteSpace(correctsExecutionId))
            throw new ArgumentException("An ordinary fill cannot correct another execution.", nameof(correctsExecutionId));
        if (kind != ExecutionFactKind.Fill && string.IsNullOrWhiteSpace(correctsExecutionId))
            throw new ArgumentException("Correction and bust facts require a corrected execution ID.", nameof(correctsExecutionId));
        AccountId = accountId;
        SecurityId = securityId;
        OrderId = orderId;
        Side = side;
        Quantity = quantity;
        Price = price;
        Fee = fee;
        ExecutedAt = executedAt;
        Kind = kind;
        CorrectsExecutionId = string.IsNullOrWhiteSpace(correctsExecutionId) ? null : correctsExecutionId.Trim();
    }

    public string Provider { get; }
    public string ProviderAccountReference { get; }
    public string ProviderExecutionId { get; }
    public Guid AccountId { get; }
    public Guid SecurityId { get; }
    public Guid OrderId { get; }
    public CanonicalOrderSide Side { get; }
    public long Quantity { get; }
    public decimal Price { get; }
    public decimal Fee { get; }
    public DateTimeOffset ExecutedAt { get; }
    public ExecutionFactKind Kind { get; }
    public string? CorrectsExecutionId { get; }

    private static string Required(string value, string name) => string.IsNullOrWhiteSpace(value)
        ? throw new ArgumentException("Value is required.", name) : value.Trim();
}

public sealed record PositionProtection(
    long DesiredQuantity,
    long BrokerConfirmedQuantity,
    decimal? StopPrice,
    DateTimeOffset AsOf,
    bool BrokerStateKnown)
{
    public ProtectionState State(long positionQuantity)
    {
        if (positionQuantity == 0) return ProtectionState.NotRequired;
        if (!BrokerStateKnown) return ProtectionState.Unknown;
        if (DesiredQuantity <= 0 || StopPrice is null || StopPrice <= 0m) return ProtectionState.Pending;
        if (DesiredQuantity < positionQuantity || BrokerConfirmedQuantity < positionQuantity) return ProtectionState.UnderProtected;
        if (DesiredQuantity > positionQuantity || BrokerConfirmedQuantity > positionQuantity) return ProtectionState.OverProtected;
        return ProtectionState.Protected;
    }
}

public sealed record PositionSnapshot(
    Guid PositionId,
    Guid AccountId,
    Guid SecurityId,
    long Quantity,
    decimal AverageCost,
    decimal CostBasis,
    decimal RealizedPnl,
    decimal Fees,
    decimal? MarkPrice,
    DateTimeOffset? MarkAsOf,
    decimal? UnrealizedPnl,
    DateTimeOffset? LastExecutionAt,
    int Version,
    PositionProtection Protection,
    ProtectionState ProtectionState,
    bool ReconciliationRequired,
    IReadOnlyList<string> AppliedExecutionIds)
{
    public bool IsBrokerAuthoritative => Version < 0;
    public bool CreatesLiveAuthority => Version < 0;
}

public interface IPositionLedgerStore
{
    T Execute<T>(Func<PositionLedgerState, T> operation);
}

public sealed class PositionLedgerState
{
    public Dictionary<(Guid AccountId, Guid SecurityId), PositionSnapshot> Positions { get; } = [];
    public Dictionary<(string Provider, string Account, string ExecutionId), ExecutionFact> Executions { get; } = [];
}
