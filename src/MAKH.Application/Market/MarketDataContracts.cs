namespace MAKH.Application.Market;

public enum MarketEventKind
{
    Quote,
    Trade,
    Bar,
    MarketStatus,
}

public enum MarketTradingState
{
    Unknown,
    PreMarket,
    Open,
    Halted,
    Closed,
}

public enum QuoteQuality
{
    Valid,
    Locked,
    Crossed,
    Stale,
}

public sealed record MarketEventProvenance
{
    public MarketEventProvenance(
        string provider,
        string eventId,
        long sequence,
        DateTimeOffset eventTime,
        DateTimeOffset receivedTime,
        string? correctsEventId = null)
    {
        Provider = Required(provider, nameof(provider));
        EventId = Required(eventId, nameof(eventId));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(sequence);
        if (receivedTime < eventTime) throw new ArgumentException("Receipt time cannot precede event time.", nameof(receivedTime));
        Sequence = sequence;
        EventTime = eventTime.ToUniversalTime();
        ReceivedTime = receivedTime.ToUniversalTime();
        CorrectsEventId = string.IsNullOrWhiteSpace(correctsEventId) ? null : correctsEventId.Trim();
        if (CorrectsEventId == EventId) throw new ArgumentException("A market event cannot correct itself.", nameof(correctsEventId));
    }

    public string Provider { get; }
    public string EventId { get; }
    public long Sequence { get; }
    public DateTimeOffset EventTime { get; }
    public DateTimeOffset ReceivedTime { get; }
    public string? CorrectsEventId { get; }
    public bool IsCorrection => CorrectsEventId is not null;

    private static string Required(string value, string parameterName) => string.IsNullOrWhiteSpace(value)
        ? throw new ArgumentException("Value is required.", parameterName)
        : value.Trim();
}

public abstract record NormalizedMarketEvent(Guid SecurityId, MarketEventProvenance Provenance)
{
    public abstract MarketEventKind Kind { get; }
}

public sealed record QuoteEvent : NormalizedMarketEvent
{
    public QuoteEvent(
        Guid securityId,
        decimal bid,
        decimal ask,
        long bidSize,
        long askSize,
        QuoteQuality quality,
        MarketEventProvenance provenance)
        : base(RequiredSecurity(securityId), provenance ?? throw new ArgumentNullException(nameof(provenance)))
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(bid);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(ask);
        ArgumentOutOfRangeException.ThrowIfNegative(bidSize);
        ArgumentOutOfRangeException.ThrowIfNegative(askSize);
        if (!Enum.IsDefined(quality)) throw new ArgumentOutOfRangeException(nameof(quality));
        if ((quality == QuoteQuality.Valid && bid >= ask)
            || (quality == QuoteQuality.Locked && bid != ask)
            || (quality == QuoteQuality.Crossed && bid <= ask))
            throw new ArgumentException("Quote prices and quality classification are inconsistent.", nameof(quality));
        Bid = bid;
        Ask = ask;
        BidSize = bidSize;
        AskSize = askSize;
        Quality = quality;
    }

    public override MarketEventKind Kind => MarketEventKind.Quote;
    public decimal Bid { get; }
    public decimal Ask { get; }
    public long BidSize { get; }
    public long AskSize { get; }
    public QuoteQuality Quality { get; }
    public bool IsExecutable => Quality is QuoteQuality.Valid or QuoteQuality.Locked;

    private static Guid RequiredSecurity(Guid securityId) => securityId == Guid.Empty
        ? throw new ArgumentException("Security ID is required.", nameof(securityId))
        : securityId;
}

public sealed record TradeEvent : NormalizedMarketEvent
{
    public TradeEvent(Guid securityId, decimal price, long size, bool isEligible, bool isCancelled, MarketEventProvenance provenance)
        : base(securityId == Guid.Empty ? throw new ArgumentException("Security ID is required.", nameof(securityId)) : securityId,
            provenance ?? throw new ArgumentNullException(nameof(provenance)))
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(price);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(size);
        Price = price;
        Size = size;
        IsEligible = isEligible;
        IsCancelled = isCancelled;
    }

    public override MarketEventKind Kind => MarketEventKind.Trade;
    public decimal Price { get; }
    public long Size { get; }
    public bool IsEligible { get; }
    public bool IsCancelled { get; }
    public bool ContributesToMetrics => IsEligible && !IsCancelled;
}

public sealed record BarEvent : NormalizedMarketEvent
{
    public BarEvent(
        Guid securityId,
        DateTimeOffset intervalStart,
        TimeSpan interval,
        decimal open,
        decimal high,
        decimal low,
        decimal close,
        long volume,
        int version,
        MarketEventProvenance provenance)
        : base(securityId == Guid.Empty ? throw new ArgumentException("Security ID is required.", nameof(securityId)) : securityId,
            provenance ?? throw new ArgumentNullException(nameof(provenance)))
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(interval, TimeSpan.Zero);
        if (open <= 0 || high <= 0 || low <= 0 || close <= 0) throw new ArgumentOutOfRangeException(nameof(open), "OHLC values must be positive.");
        if (high < Math.Max(open, close) || low > Math.Min(open, close) || high < low)
            throw new ArgumentException("OHLC values are inconsistent.", nameof(high));
        ArgumentOutOfRangeException.ThrowIfNegative(volume);
        ArgumentOutOfRangeException.ThrowIfLessThan(version, 1);
        IntervalStart = intervalStart;
        Interval = interval;
        Open = open;
        High = high;
        Low = low;
        Close = close;
        Volume = volume;
        Version = version;
    }

    public override MarketEventKind Kind => MarketEventKind.Bar;
    public DateTimeOffset IntervalStart { get; }
    public TimeSpan Interval { get; }
    public decimal Open { get; }
    public decimal High { get; }
    public decimal Low { get; }
    public decimal Close { get; }
    public long Volume { get; }
    public int Version { get; }
}

public sealed record MarketStatusEvent : NormalizedMarketEvent
{
    public MarketStatusEvent(Guid securityId, MarketTradingState state, string reason, MarketEventProvenance provenance)
        : base(securityId == Guid.Empty ? throw new ArgumentException("Security ID is required.", nameof(securityId)) : securityId,
            provenance ?? throw new ArgumentNullException(nameof(provenance)))
    {
        if (!Enum.IsDefined(state)) throw new ArgumentOutOfRangeException(nameof(state));
        State = state;
        Reason = string.IsNullOrWhiteSpace(reason) ? throw new ArgumentException("Status reason is required.", nameof(reason)) : reason.Trim();
    }

    public override MarketEventKind Kind => MarketEventKind.MarketStatus;
    public MarketTradingState State { get; }
    public string Reason { get; }
    public bool AllowsNewExposure => State == MarketTradingState.Open;
}

public interface IMarketDataProvider
{
    string ProviderName { get; }

    IAsyncEnumerable<NormalizedMarketEvent> StreamAsync(
        IReadOnlyCollection<Guid> securityIds,
        CancellationToken cancellationToken = default);
}
