namespace MAKH.Domain.Market;

public enum CorporateActionType
{
    SymbolChange,
    StockSplit,
    ReverseSplit,
    Merger,
    Delisting,
}

public sealed record CorporateAction
{
    public CorporateAction(Guid securityId, string sourceId, CorporateActionType type, DateOnly effectiveDate, decimal? numerator = null, decimal? denominator = null)
    {
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(securityId));
        if (!Enum.IsDefined(type)) throw new ArgumentOutOfRangeException(nameof(type));
        SecurityId = securityId;
        SourceId = string.IsNullOrWhiteSpace(sourceId) ? throw new ArgumentException("Source ID is required.", nameof(sourceId)) : sourceId.Trim();
        Type = type;
        EffectiveDate = effectiveDate;
        var requiresRatio = type is CorporateActionType.StockSplit or CorporateActionType.ReverseSplit;
        if (requiresRatio && (numerator is null || denominator is null || numerator <= 0 || denominator <= 0))
            throw new ArgumentException("Split and reverse-split actions require positive numerator and denominator values.");
        if (!requiresRatio && (numerator is not null || denominator is not null))
            throw new ArgumentException("Only split and reverse-split actions may define a ratio.");
        Numerator = numerator;
        Denominator = denominator;
    }

    public Guid SecurityId { get; }
    public string SourceId { get; }
    public CorporateActionType Type { get; }
    public DateOnly EffectiveDate { get; }
    public decimal? Numerator { get; }
    public decimal? Denominator { get; }
}
