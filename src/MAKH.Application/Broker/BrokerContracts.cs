using System.Globalization;
using System.Text;

namespace MAKH.Application.Broker;

public enum BrokerEnvironment
{
    Paper,
    Live,
}

public enum CanonicalOrderSide
{
    Buy,
    Sell,
}

public enum CanonicalTimeInForce
{
    Day,
    GoodTilCancelled,
}

public enum CanonicalOrderState
{
    PendingSubmit,
    Unknown,
    Accepted,
    PartiallyFilled,
    PendingCancel,
    PendingReplace,
    Cancelled,
    Filled,
    Rejected,
}

public sealed record BrokerAccountIdentity
{
    public BrokerAccountIdentity(string provider, string accountReference, BrokerEnvironment environment)
    {
        Provider = Required(provider, nameof(provider));
        AccountReference = Required(accountReference, nameof(accountReference));
        if (!Enum.IsDefined(environment))
            throw new ArgumentOutOfRangeException(nameof(environment));
        Environment = environment;
    }

    public string Provider { get; }
    public string AccountReference { get; }
    public BrokerEnvironment Environment { get; }
    public bool CanSubmitPaperOrders => Environment == BrokerEnvironment.Paper;
    public bool CanSubmitLiveOrders => Denied(Environment);

    private static bool Denied(BrokerEnvironment _) => false;

    private static string Required(string value, string name) => string.IsNullOrWhiteSpace(value)
        ? throw new ArgumentException("Value is required.", name)
        : value.Trim();
}

public sealed record PaperOrderRequest
{
    public PaperOrderRequest(
        Guid accountId,
        Guid securityId,
        Guid riskDecisionId,
        string clientOrderId,
        CanonicalOrderSide side,
        long quantity,
        decimal limitPrice,
        CanonicalTimeInForce timeInForce,
        bool riskApprovedForPaperProposal,
        string correlationId)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(securityId));
        if (riskDecisionId == Guid.Empty) throw new ArgumentException("Risk decision ID is required.", nameof(riskDecisionId));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(limitPrice);
        if (!Enum.IsDefined(side)) throw new ArgumentOutOfRangeException(nameof(side));
        if (!Enum.IsDefined(timeInForce)) throw new ArgumentOutOfRangeException(nameof(timeInForce));
        AccountId = accountId;
        SecurityId = securityId;
        RiskDecisionId = riskDecisionId;
        ClientOrderId = Required(clientOrderId, nameof(clientOrderId), 64);
        Side = side;
        Quantity = quantity;
        LimitPrice = limitPrice;
        TimeInForce = timeInForce;
        RiskApprovedForPaperProposal = riskApprovedForPaperProposal;
        CorrelationId = Required(correlationId, nameof(correlationId), 128);
    }

    public Guid AccountId { get; }
    public Guid SecurityId { get; }
    public Guid RiskDecisionId { get; }
    public string ClientOrderId { get; }
    public CanonicalOrderSide Side { get; }
    public long Quantity { get; }
    public decimal LimitPrice { get; }
    public CanonicalTimeInForce TimeInForce { get; }
    public bool RiskApprovedForPaperProposal { get; }
    public string CorrelationId { get; }

    public string PayloadIdentity
    {
        get
        {
            var identity = new StringBuilder();
            Add(identity, AccountId);
            Add(identity, SecurityId);
            Add(identity, RiskDecisionId);
            Add(identity, Side);
            Add(identity, Quantity);
            Add(identity, LimitPrice);
            Add(identity, TimeInForce);
            return identity.ToString();
        }
    }

    private static void Add(StringBuilder target, object value)
    {
        var text = value is IFormattable formattable
            ? formattable.ToString(null, CultureInfo.InvariantCulture)
            : value.ToString() ?? string.Empty;
        target.Append(text.Length.ToString(CultureInfo.InvariantCulture)).Append(':').Append(text);
    }

    private static string Required(string value, string name, int maximumLength)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? throw new ArgumentException("Value is required.", name) : value.Trim();
        return normalized.Length > maximumLength
            ? throw new ArgumentException($"Value cannot exceed {maximumLength} characters.", name)
            : normalized;
    }
}

public sealed record CanonicalBrokerOrder(
    string Provider,
    string ProviderOrderId,
    string ClientOrderId,
    Guid AccountId,
    Guid SecurityId,
    CanonicalOrderSide Side,
    long Quantity,
    long FilledQuantity,
    decimal LimitPrice,
    CanonicalTimeInForce TimeInForce,
    CanonicalOrderState State,
    DateTimeOffset UpdatedAt,
    string Reason,
    bool RequiresReconciliation,
    string CorrelationId)
{
    public long RemainingQuantity => Math.Max(0, Quantity - FilledQuantity);
    public bool IsTerminal => State is CanonicalOrderState.Cancelled or CanonicalOrderState.Filled or CanonicalOrderState.Rejected;
    public bool CreatesLiveAuthority => Denied(State);

    private static bool Denied(CanonicalOrderState _) => false;
}

public sealed record BrokerSubmitResult(CanonicalBrokerOrder Order, bool WasReplay);

public sealed record BrokerCancelResult(CanonicalBrokerOrder Order, bool WasReplay);

public interface IPaperBrokerAdapter
{
    string ProviderName { get; }
    BrokerAccountIdentity Account { get; }
    Task<BrokerSubmitResult> SubmitAsync(PaperOrderRequest request, CancellationToken cancellationToken = default);
    Task<BrokerCancelResult> CancelAsync(string clientOrderId, string correlationId, CancellationToken cancellationToken = default);
    Task<CanonicalBrokerOrder?> FindByClientOrderIdAsync(string clientOrderId, CancellationToken cancellationToken = default);
}
