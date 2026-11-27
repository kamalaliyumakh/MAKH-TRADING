using MAKH.Domain.Market;

namespace MAKH.Application.Market;

public enum ShareMetricKind
{
    PublicFloat,
    SharesOutstanding,
}

public sealed record ReferenceFactProvenance
{
    public ReferenceFactProvenance(
        string provider,
        string factId,
        DateOnly asOfDate,
        DateTimeOffset observedAt,
        int revision,
        string definition,
        string? supersedesFactId = null)
    {
        Provider = Required(provider, nameof(provider));
        FactId = Required(factId, nameof(factId));
        ArgumentOutOfRangeException.ThrowIfLessThan(revision, 1);
        Definition = Required(definition, nameof(definition));
        if (observedAt == default) throw new ArgumentException("Observation time is required.", nameof(observedAt));
        var observedAtUtc = observedAt.ToUniversalTime();
        if (DateOnly.FromDateTime(observedAtUtc.UtcDateTime) < asOfDate)
            throw new ArgumentException("Observation time cannot precede the fact as-of date.", nameof(observedAt));
        if (revision == 1 && !string.IsNullOrWhiteSpace(supersedesFactId))
            throw new ArgumentException("An initial fact revision cannot supersede prior evidence.", nameof(supersedesFactId));
        if (revision > 1 && string.IsNullOrWhiteSpace(supersedesFactId))
            throw new ArgumentException("A later fact revision must identify the superseded fact.", nameof(supersedesFactId));
        AsOfDate = asOfDate;
        ObservedAt = observedAtUtc;
        Revision = revision;
        SupersedesFactId = string.IsNullOrWhiteSpace(supersedesFactId) ? null : supersedesFactId.Trim();
    }

    public string Provider { get; }
    public string FactId { get; }
    public DateOnly AsOfDate { get; }
    public DateTimeOffset ObservedAt { get; }
    public int Revision { get; }
    public string Definition { get; }
    public string? SupersedesFactId { get; }
    public bool IsRevision => SupersedesFactId is not null;

    private static string Required(string value, string parameterName) => string.IsNullOrWhiteSpace(value)
        ? throw new ArgumentException("Value is required.", parameterName)
        : value.Trim();
}

public sealed record ShareMetricFact
{
    public ShareMetricFact(Guid securityId, ShareMetricKind kind, long shares, ReferenceFactProvenance provenance)
    {
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(securityId));
        if (!Enum.IsDefined(kind)) throw new ArgumentOutOfRangeException(nameof(kind));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(shares);
        SecurityId = securityId;
        Kind = kind;
        Shares = shares;
        Provenance = provenance ?? throw new ArgumentNullException(nameof(provenance));
    }

    public Guid SecurityId { get; }
    public ShareMetricKind Kind { get; }
    public long Shares { get; }
    public ReferenceFactProvenance Provenance { get; }
}

public sealed record CorporateActionFact
{
    public CorporateActionFact(
        Guid securityId,
        CorporateActionType type,
        DateOnly effectiveDate,
        ReferenceFactProvenance provenance,
        decimal? numerator = null,
        decimal? denominator = null)
    {
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(securityId));
        if (!Enum.IsDefined(type)) throw new ArgumentOutOfRangeException(nameof(type));
        var requiresRatio = type is CorporateActionType.StockSplit or CorporateActionType.ReverseSplit;
        if (requiresRatio && (numerator is null || denominator is null || numerator <= 0 || denominator <= 0))
            throw new ArgumentException("Split and reverse-split facts require positive numerator and denominator values.");
        if (!requiresRatio && (numerator is not null || denominator is not null))
            throw new ArgumentException("Only split and reverse-split facts may define a ratio.");
        SecurityId = securityId;
        Type = type;
        EffectiveDate = effectiveDate;
        Provenance = provenance ?? throw new ArgumentNullException(nameof(provenance));
        Numerator = numerator;
        Denominator = denominator;
    }

    public Guid SecurityId { get; }
    public CorporateActionType Type { get; }
    public DateOnly EffectiveDate { get; }
    public ReferenceFactProvenance Provenance { get; }
    public decimal? Numerator { get; }
    public decimal? Denominator { get; }
}

public interface IReferenceDataProvider
{
    string ProviderName { get; }

    Task<IReadOnlyList<ShareMetricFact>> GetShareMetricsAsync(
        IReadOnlyCollection<Guid> securityIds,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CorporateActionFact>> GetCorporateActionsAsync(
        IReadOnlyCollection<Guid> securityIds,
        CancellationToken cancellationToken = default);
}
