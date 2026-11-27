using MAKH.Application.Market;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class ScannerCalculationsTests
{
    private static readonly Guid SecurityId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static readonly DateTimeOffset AsOf = new(2026, 8, 12, 15, 0, 0, TimeSpan.Zero);
    private static readonly ScannerCalculationPolicy Policy = new("scanner-calculation-v1");

    [Fact]
    public void QualifiedInputsProduceReproducibleMetrics()
    {
        var first = Calculate();
        var second = Calculate();

        Assert.Equal(first, second);
        Assert.Equal(5m, first.Price.Value);
        Assert.Equal(150m, first.GainPercent.Value);
        Assert.Equal(3m, first.RelativeVolume.Value);
        Assert.Equal(0.02m, first.Spread.Value);
        Assert.Equal(0.4m, first.SpreadPercent.Value);
        Assert.Equal(1_500_000m, first.DollarVolume.Value);
        Assert.True(first.MatchesDiscoveryPreset);
        Assert.True(first.IsExtremeMove);
        Assert.False(first.CreatesOrderAuthority);
    }

    [Theory]
    [InlineData(3, true)]
    [InlineData(7, true)]
    [InlineData(2.99, false)]
    [InlineData(7.01, false)]
    public void PricePresetUsesInclusiveBoundaries(decimal price, bool expected)
    {
        var result = Calculate(lastPrice: price);

        Assert.Equal(expected, result.PriceMatchesPreset);
    }

    [Theory]
    [InlineData(500000, true)]
    [InlineData(500001, false)]
    public void FloatPresetUsesInclusiveMaximum(long shares, bool expected)
    {
        var result = Calculate(publicFloat: QualifiedFloat(shares));

        Assert.Equal(expected, result.FloatMatchesPreset);
    }

    [Fact]
    public void RvolUsesMeanAtSameNormalizedSessionTime()
    {
        var result = Calculate(currentVolume: 600_000, historicalVolumes: [100_000, 200_000, 300_000]);

        Assert.Equal(3m, result.RelativeVolume.Value);
        Assert.True(result.RelativeVolumeMatchesPreset);
    }

    [Fact]
    public void ZeroHistoricalVolumeFailsClosed()
    {
        var result = Calculate(historicalVolumes: [100_000, 0, 300_000]);

        Assert.Equal(CalculationState.InvalidInput, result.RelativeVolume.State);
        Assert.False(result.InputsQualified);
        Assert.False(result.MatchesDiscoveryPreset);
    }

    [Fact]
    public void StaleQuoteInvalidatesPriceAndLiquidityMetrics()
    {
        var result = Calculate(quote: Quote(QuoteQuality.Stale));

        Assert.Equal(CalculationState.StaleInput, result.Price.State);
        Assert.Equal(CalculationState.StaleInput, result.Spread.State);
        Assert.False(result.InputsQualified);
    }

    [Fact]
    public void MissingAdjustedReferenceCloseBlocksGain()
    {
        var result = Calculate(referenceClose: null);

        Assert.Equal(CalculationState.MissingInput, result.GainPercent.State);
        Assert.False(result.IsExtremeMove);
    }

    [Theory]
    [InlineData(100, true)]
    [InlineData(600, true)]
    [InlineData(99.99, false)]
    [InlineData(600.01, false)]
    public void ExtremeMoveUsesInclusiveRiskBoundaries(decimal gainPercent, bool expected)
    {
        const decimal reference = 2m;
        var price = reference * (1m + (gainPercent / 100m));

        var result = Calculate(lastPrice: price, referenceClose: reference);

        Assert.Equal(expected, result.IsExtremeMove);
        Assert.False(result.CreatesOrderAuthority);
    }

    [Fact]
    public void AmbiguousFloatBlocksQualification()
    {
        var resolution = new ReferenceResolution(ReferenceResolutionState.Ambiguous, null, "providers disagree");

        var result = Calculate(publicFloat: resolution);

        Assert.False(result.FloatMatchesPreset);
        Assert.False(result.InputsQualified);
    }

    [Fact]
    public void FloatMustMatchQuoteSecurityAndMetricKind()
    {
        var otherSecurity = QualifiedFloat(500_000, Guid.NewGuid());
        var sharesOutstanding = QualifiedFloat(500_000, SecurityId, ShareMetricKind.SharesOutstanding);

        Assert.False(Calculate(publicFloat: otherSecurity).InputsQualified);
        Assert.False(Calculate(publicFloat: otherSecurity).FloatMatchesPreset);
        Assert.False(Calculate(publicFloat: sharesOutstanding).InputsQualified);
        Assert.False(Calculate(publicFloat: sharesOutstanding).FloatMatchesPreset);
    }

    [Fact]
    public void FloatObservedAfterCalculationCannotQualify()
    {
        var result = Calculate(publicFloat: QualifiedFloat(500_000, observedAt: AsOf.AddSeconds(1)));

        Assert.False(result.InputsQualified);
        Assert.False(result.FloatMatchesPreset);
    }

    [Fact]
    public void FutureQuoteInvalidatesPriceAndSpread()
    {
        var future = new QuoteEvent(SecurityId, 4.99m, 5.01m, 100, 100, QuoteQuality.Valid,
            new MarketEventProvenance("synthetic", "future", 1, AsOf.AddSeconds(1), AsOf.AddSeconds(1)));

        var result = Calculate(quote: future);

        Assert.Equal(CalculationState.InvalidInput, result.Price.State);
        Assert.Equal(CalculationState.InvalidInput, result.Spread.State);
        Assert.False(result.InputsQualified);
    }

    [Fact]
    public void MetricCarriesCalculationVersionAndAsOf()
    {
        var result = Calculate();

        Assert.All(
            new[] { result.Price, result.GainPercent, result.RelativeVolume, result.Spread, result.SpreadPercent, result.DollarVolume },
            metric =>
            {
                Assert.Equal(Policy.Version, metric.CalculationVersion);
                Assert.Equal(AsOf, metric.AsOf);
            });
    }

    private static ScannerMetricSet Calculate(
        QuoteEvent? quote = null,
        decimal? lastPrice = 5m,
        decimal? referenceClose = 2m,
        long? currentVolume = 300_000,
        IReadOnlyCollection<long>? historicalVolumes = null,
        ReferenceResolution? publicFloat = null) =>
        ScannerCalculations.Calculate(
            Policy,
            AsOf,
            quote ?? Quote(QuoteQuality.Valid),
            lastPrice,
            referenceClose,
            currentVolume,
            historicalVolumes ?? [50_000, 100_000, 150_000],
            publicFloat ?? QualifiedFloat(500_000));

    private static QuoteEvent Quote(QuoteQuality quality) => new(
        SecurityId,
        4.99m,
        5.01m,
        100,
        100,
        quality,
        new MarketEventProvenance("synthetic", "quote", 1, AsOf, AsOf));

    private static ReferenceResolution QualifiedFloat(
        long shares,
        Guid? securityId = null,
        ShareMetricKind kind = ShareMetricKind.PublicFloat,
        DateTimeOffset? observedAt = null)
    {
        var fact = new ShareMetricFact(
            securityId ?? SecurityId,
            kind,
            shares,
            new ReferenceFactProvenance(
                "synthetic-reference",
                "float",
                DateOnly.FromDateTime(AsOf.UtcDateTime),
                observedAt ?? AsOf,
                1,
                "freely-tradable-common-shares-v1"));
        return new(ReferenceResolutionState.Qualified, fact, "qualified");
    }
}
