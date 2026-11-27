using MAKH.Application.Broker;

namespace MAKH.Application.Reconciliation;

public enum ReconciliationOutcome { Matched, Mismatch, Unknown }
public enum ReconciliationEntityType { Order, Position, Cash, Snapshot }

public sealed record ReconciliationOrder
{
    public ReconciliationOrder(string clientOrderId, string state, long quantity, long filledQuantity)
    {
        if (string.IsNullOrWhiteSpace(clientOrderId) || string.IsNullOrWhiteSpace(state)) throw new ArgumentException("Order identity and state are required.");
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        ArgumentOutOfRangeException.ThrowIfNegative(filledQuantity);
        if (filledQuantity > quantity) throw new ArgumentException("Filled quantity cannot exceed order quantity.");
        if (!Enum.TryParse<CanonicalOrderState>(state.Trim(), false, out var parsedState) ||
            !Enum.IsDefined(parsedState) ||
            !string.Equals(parsedState.ToString(), state.Trim(), StringComparison.Ordinal))
            throw new ArgumentException("Order state must be canonical.", nameof(state));
        ClientOrderId = clientOrderId.Trim();
        State = state.Trim();
        Quantity = quantity;
        FilledQuantity = filledQuantity;
    }
    public string ClientOrderId { get; }
    public string State { get; }
    public long Quantity { get; }
    public long FilledQuantity { get; }
}

public sealed record ReconciliationPosition
{
    public ReconciliationPosition(Guid securityId, long quantity)
    {
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.");
        ArgumentOutOfRangeException.ThrowIfNegative(quantity);
        SecurityId = securityId;
        Quantity = quantity;
    }
    public Guid SecurityId { get; }
    public long Quantity { get; }
}

public sealed record AccountReconciliationSnapshot
{
    public AccountReconciliationSnapshot(Guid accountId, DateTimeOffset asOf, bool stateKnown, decimal cash, decimal buyingPower,
        IReadOnlyList<ReconciliationOrder> orders, IReadOnlyList<ReconciliationPosition> positions, string sourceChecksum)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.");
        ArgumentNullException.ThrowIfNull(orders);
        ArgumentNullException.ThrowIfNull(positions);
        if (asOf == default || asOf.Offset != TimeSpan.Zero)
            throw new ArgumentException("Snapshot time must be a non-default UTC timestamp.", nameof(asOf));
        if (orders.Count > 10_000 || positions.Count > 10_000)
            throw new ArgumentException("Snapshot collections cannot exceed 10,000 items.");
        if (string.IsNullOrWhiteSpace(sourceChecksum)) throw new ArgumentException("Source checksum is required.");
        if (sourceChecksum.Length > 128 || sourceChecksum.Any(char.IsControl))
            throw new ArgumentException("Source checksum is invalid.", nameof(sourceChecksum));
        if (orders.GroupBy(item => item.ClientOrderId, StringComparer.Ordinal).Any(group => group.Count() > 1))
            throw new ArgumentException("Order identities must be unique.");
        if (positions.GroupBy(item => item.SecurityId).Any(group => group.Count() > 1))
            throw new ArgumentException("Position securities must be unique.");
        AccountId = accountId;
        AsOf = asOf;
        StateKnown = stateKnown;
        Cash = cash;
        BuyingPower = buyingPower;
        Orders = orders.ToArray();
        Positions = positions.ToArray();
        SourceChecksum = sourceChecksum.Trim();
    }
    public Guid AccountId { get; }
    public DateTimeOffset AsOf { get; }
    public bool StateKnown { get; }
    public decimal Cash { get; }
    public decimal BuyingPower { get; }
    public IReadOnlyList<ReconciliationOrder> Orders { get; }
    public IReadOnlyList<ReconciliationPosition> Positions { get; }
    public string SourceChecksum { get; }
}

public sealed record ReconciliationItem(
    ReconciliationEntityType EntityType,
    string EntityId,
    string Field,
    string PlatformValue,
    string BrokerValue,
    string Reason);

public sealed record ReconciliationRun(
    Guid RunId,
    Guid AccountId,
    DateTimeOffset StartedAt,
    DateTimeOffset CompletedAt,
    DateTimeOffset PlatformAsOf,
    DateTimeOffset BrokerAsOf,
    string PlatformChecksum,
    string BrokerChecksum,
    string PlatformContentHash,
    string BrokerContentHash,
    ReconciliationOutcome Outcome,
    IReadOnlyList<ReconciliationItem> Items,
    int Sequence,
    bool EntryBlocked)
{
    public bool IsBrokerAuthoritative => Sequence < 0;
    public bool CreatesLiveAuthority => Sequence < 0;
}

public sealed record AccountReconciliationState(
    Guid AccountId,
    ReconciliationOutcome Outcome,
    bool EntryBlocked,
    string Reason,
    int Sequence,
    Guid? LastRunId,
    DateTimeOffset? LastCompletedAt);

public interface IReconciliationStore
{
    T Execute<T>(Func<ReconciliationLedgerState, T> operation);
}

public sealed class ReconciliationLedgerState
{
    public Dictionary<Guid, AccountReconciliationState> Accounts { get; } = [];
    public List<ReconciliationRun> Runs { get; } = [];
}
