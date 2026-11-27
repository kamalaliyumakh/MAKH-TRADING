namespace MAKH.Application.Market;

public enum CalculationState
{
    Calculated,
    MissingInput,
    InvalidInput,
    StaleInput,
}

public sealed record CalculatedMetric(
    string Name,
    CalculationState State,
    decimal? Value,
    string Unit,
    string CalculationVersion,
    DateTimeOffset AsOf,
    string Reason)
{
    public bool IsUsable => State == CalculationState.Calculated;
}

public sealed record ScannerCalculationPolicy
{
    public ScannerCalculationPolicy(
        string version,
        decimal minimumPrice = 3m,
        decimal maximumPrice = 7m,
        decimal minimumRelativeVolume = 3m,
        long maximumPublicFloat = 500_000,
        decimal extremeGainMinimumPercent = 100m,
        decimal extremeGainMaximumPercent = 600m)
    {
        Version = string.IsNullOrWhiteSpace(version) ? throw new ArgumentException("Policy version is required.", nameof(version)) : version.Trim();
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(minimumPrice);
        ArgumentOutOfRangeException.ThrowIfLessThan(maximumPrice, minimumPrice);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(minimumRelativeVolume);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maximumPublicFloat);
        ArgumentOutOfRangeException.ThrowIfNegative(extremeGainMinimumPercent);
        ArgumentOutOfRangeException.ThrowIfLessThan(extremeGainMaximumPercent, extremeGainMinimumPercent);
        MinimumPrice = minimumPrice;
        MaximumPrice = maximumPrice;
        MinimumRelativeVolume = minimumRelativeVolume;
        MaximumPublicFloat = maximumPublicFloat;
        ExtremeGainMinimumPercent = extremeGainMinimumPercent;
        ExtremeGainMaximumPercent = extremeGainMaximumPercent;
    }

    public string Version { get; }
    public decimal MinimumPrice { get; }
    public decimal MaximumPrice { get; }
    public decimal MinimumRelativeVolume { get; }
    public long MaximumPublicFloat { get; }
    public decimal ExtremeGainMinimumPercent { get; }
    public decimal ExtremeGainMaximumPercent { get; }
}

public sealed record ScannerMetricSet(
    CalculatedMetric Price,
    CalculatedMetric GainPercent,
    CalculatedMetric RelativeVolume,
    CalculatedMetric Spread,
    CalculatedMetric SpreadPercent,
    CalculatedMetric DollarVolume,
    bool PriceMatchesPreset,
    bool RelativeVolumeMatchesPreset,
    bool FloatMatchesPreset,
    bool GainMatchesPreset,
    bool IsExtremeMove,
    bool InputsQualified,
    bool CreatesOrderAuthority)
{
    public bool MatchesDiscoveryPreset =>
        InputsQualified && PriceMatchesPreset && RelativeVolumeMatchesPreset && FloatMatchesPreset && GainMatchesPreset;
}

public static class ScannerCalculations
{
    public static ScannerMetricSet Calculate(
        ScannerCalculationPolicy policy,
        DateTimeOffset asOf,
        QuoteEvent? quote,
        decimal? lastEligibleTradePrice,
        decimal? adjustedReferenceClose,
        long? cumulativeEligibleVolume,
        IReadOnlyCollection<long> historicalCumulativeVolumes,
        ReferenceResolution publicFloat)
    {
        ArgumentNullException.ThrowIfNull(policy);
        ArgumentNullException.ThrowIfNull(historicalCumulativeVolumes);
        ArgumentNullException.ThrowIfNull(publicFloat);
        if (asOf == default) throw new ArgumentException("Calculation as-of time is required.", nameof(asOf));
        asOf = asOf.ToUniversalTime();

        var price = Price(policy.Version, asOf, quote, lastEligibleTradePrice);
        var gain = RatioMetric(
            "gain",
            "%",
            policy.Version,
            asOf,
            price.Value,
            adjustedReferenceClose,
            static (current, reference) => ((current / reference) - 1m) * 100m);
        var rvol = RelativeVolume(policy.Version, asOf, cumulativeEligibleVolume, historicalCumulativeVolumes);
        var quoteIsFuture = quote?.Provenance.EventTime > asOf;
        var spread = quote is null || !quote.IsExecutable || quoteIsFuture
            ? Failed("spread", "USD", policy.Version, asOf, quote is null ? CalculationState.MissingInput : quoteIsFuture ? CalculationState.InvalidInput : CalculationState.StaleInput, "A current executable quote is required.")
            : Success("spread", "USD", policy.Version, asOf, quote.Ask - quote.Bid);
        decimal? midpoint = quote is null ? null : (quote.Ask + quote.Bid) / 2m;
        var spreadPercent = RatioMetric(
            "spreadPercent",
            "%",
            policy.Version,
            asOf,
            spread.Value,
            midpoint,
            static (value, basis) => value / basis * 100m);
        var dollarVolume = RatioMetric(
            "dollarVolume",
            "USD",
            policy.Version,
            asOf,
            price.Value,
            cumulativeEligibleVolume,
            static (currentPrice, volume) => currentPrice * volume);

        var publicFloatEvidenceUsable = quote is not null
            && publicFloat.Fact is { Kind: ShareMetricKind.PublicFloat } floatFact
            && floatFact.SecurityId == quote.SecurityId
            && floatFact.Provenance.ObservedAt <= asOf;
        var inputsQualified = price.IsUsable
            && gain.IsUsable
            && rvol.IsUsable
            && spread.IsUsable
            && spreadPercent.IsUsable
            && dollarVolume.IsUsable
            && publicFloat.CanQualifyScannerCandidate
            && publicFloatEvidenceUsable;
        return new(
            price,
            gain,
            rvol,
            spread,
            spreadPercent,
            dollarVolume,
            price.Value >= policy.MinimumPrice && price.Value <= policy.MaximumPrice,
            rvol.Value >= policy.MinimumRelativeVolume,
            publicFloat.Fact?.Shares <= policy.MaximumPublicFloat && publicFloat.CanQualifyScannerCandidate && publicFloatEvidenceUsable,
            gain.Value >= policy.ExtremeGainMinimumPercent && gain.Value <= policy.ExtremeGainMaximumPercent,
            gain.Value >= policy.ExtremeGainMinimumPercent && gain.Value <= policy.ExtremeGainMaximumPercent,
            inputsQualified,
            false);
    }

    private static CalculatedMetric Price(string version, DateTimeOffset asOf, QuoteEvent? quote, decimal? lastEligibleTradePrice)
    {
        if (quote is null || lastEligibleTradePrice is null)
            return Failed("price", "USD", version, asOf, CalculationState.MissingInput, "Quote and last eligible trade are required.");
        if (!quote.IsExecutable)
            return Failed("price", "USD", version, asOf, CalculationState.StaleInput, "Quote is not executable.");
        if (quote.Provenance.EventTime > asOf)
            return Failed("price", "USD", version, asOf, CalculationState.InvalidInput, "Quote event time cannot follow calculation time.");
        if (lastEligibleTradePrice <= 0)
            return Failed("price", "USD", version, asOf, CalculationState.InvalidInput, "Last eligible trade price must be positive.");
        return Success("price", "USD", version, asOf, lastEligibleTradePrice.Value);
    }

    private static CalculatedMetric RelativeVolume(
        string version,
        DateTimeOffset asOf,
        long? cumulativeEligibleVolume,
        IReadOnlyCollection<long> historicalCumulativeVolumes)
    {
        if (cumulativeEligibleVolume is null || historicalCumulativeVolumes.Count == 0)
            return Failed("rvol", "ratio", version, asOf, CalculationState.MissingInput, "Current and historical normalized-session volumes are required.");
        if (cumulativeEligibleVolume < 0 || historicalCumulativeVolumes.Any(value => value <= 0))
            return Failed("rvol", "ratio", version, asOf, CalculationState.InvalidInput, "Volumes must be non-negative and historical observations positive.");
        var mean = historicalCumulativeVolumes.Average(value => (decimal)value);
        return Success("rvol", "ratio", version, asOf, cumulativeEligibleVolume.Value / mean);
    }

    private static CalculatedMetric RatioMetric<T>(
        string name,
        string unit,
        string version,
        DateTimeOffset asOf,
        decimal? numerator,
        T? denominator,
        Func<decimal, decimal, decimal> calculate)
        where T : struct
    {
        if (numerator is null || denominator is null)
            return Failed(name, unit, version, asOf, CalculationState.MissingInput, "Required calculation input is missing.");
        var denominatorValue = Convert.ToDecimal(denominator.Value, System.Globalization.CultureInfo.InvariantCulture);
        if (numerator < 0 || denominatorValue <= 0)
            return Failed(name, unit, version, asOf, CalculationState.InvalidInput, "Calculation inputs are outside the valid domain.");
        return Success(name, unit, version, asOf, calculate(numerator.Value, denominatorValue));
    }

    private static CalculatedMetric Success(string name, string unit, string version, DateTimeOffset asOf, decimal value) =>
        new(name, CalculationState.Calculated, value, unit, version, asOf, "Calculated from qualified inputs.");

    private static CalculatedMetric Failed(
        string name,
        string unit,
        string version,
        DateTimeOffset asOf,
        CalculationState state,
        string reason) => new(name, state, null, unit, version, asOf, reason);
}
