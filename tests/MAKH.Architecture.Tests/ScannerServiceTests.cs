using MAKH.Application.Market;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class ScannerServiceTests
{
    private static readonly DateTimeOffset AsOf = new(2026, 8, 12, 15, 0, 0, TimeSpan.Zero);
    private static readonly ScannerCalculationPolicy Policy = new("scanner-calculation-v1");
    private static readonly ScannerPreset Preset = new(
        Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        "Low float momentum",
        1,
        Policy,
        AsOf.AddDays(-1));

    [Fact]
    public void RunRanksQualifiedCandidatesDeterministically()
    {
        var lowerRvol = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "LOW", 3m, 2_000_000m);
        var higherRvol = Input("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB", "HIGH", 4m, 1_000_000m);

        var run = Execute([lowerRvol, higherRvol]);

        Assert.Equal("HIGH", run.Candidates[0].Symbol);
        Assert.Equal(1, run.Candidates[0].Rank);
        Assert.Equal("LOW", run.Candidates[1].Symbol);
        Assert.Equal(ScannerDataQuality.Complete, run.DataQuality);
    }

    [Fact]
    public void DollarVolumeBreaksEqualRvolTie()
    {
        var lowerLiquidity = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "LOW", 3m, 1_000_000m);
        var higherLiquidity = Input("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB", "HIGH", 3m, 2_000_000m);

        var run = Execute([lowerLiquidity, higherLiquidity]);

        Assert.Equal("HIGH", run.Candidates[0].Symbol);
    }

    [Fact]
    public void ReplayWithReorderedInputsProducesSameSnapshotAndCandidates()
    {
        var first = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "AAA", 3m, 1_000_000m);
        var second = Input("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB", "BBB", 4m, 2_000_000m);

        var original = Execute([first, second]);
        var replay = Execute([second, first]);

        Assert.Equal(original.InputSnapshotHash, replay.InputSnapshotHash);
        Assert.Equal(original.Candidates, replay.Candidates);
    }

    [Fact]
    public void ExtremeMoveDoesNotImproveRankOrCreateAuthority()
    {
        var ordinary = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "ORD", 4m, 2_000_000m, extreme: false);
        var extreme = Input("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB", "EXT", 3m, 1_000_000m, extreme: true);

        var run = Execute([extreme, ordinary]);

        Assert.Equal("ORD", run.Candidates[0].Symbol);
        Assert.True(run.Candidates.Single(candidate => candidate.Symbol == "EXT").ExtremeMoveRisk);
        Assert.False(ScannerCandidate.CreatesOrderAuthority);
        Assert.False(ScannerRun.CreatesOrderAuthority);
    }

    [Fact]
    public void UnqualifiedInputIsUnrankedAndRunIsPartial()
    {
        var qualified = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "GOOD", 3m, 1_000_000m);
        var unqualified = Input("BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB", "BAD", 2m, 1_000_000m, rvolMatches: false);

        var run = Execute([qualified, unqualified]);
        var excluded = run.Candidates.Single(candidate => candidate.Symbol == "BAD");

        Assert.Null(excluded.Rank);
        Assert.False(excluded.Qualified);
        Assert.Contains("Relative volume", excluded.ExclusionReason, StringComparison.Ordinal);
        Assert.Equal(ScannerDataQuality.Partial, run.DataQuality);
    }

    [Fact]
    public void FailedQualityWhenNoCandidateQualifies()
    {
        var input = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "BAD", 2m, 1_000_000m, inputsQualified: false);

        var run = Execute([input]);

        Assert.Equal(ScannerDataQuality.Failed, run.DataQuality);
        Assert.Contains("not qualified", run.Candidates[0].ExclusionReason, StringComparison.Ordinal);
    }

    [Fact]
    public void DuplicateSecurityInputIsRejected()
    {
        var input = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "DUP", 3m, 1_000_000m);

        Assert.Throws<ArgumentException>(() => Execute([input, input]));
    }

    [Fact]
    public void MetricVersionMismatchIsRejected()
    {
        var input = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "OLD", 3m, 1_000_000m);
        var mismatched = input with
        {
            Metrics = input.Metrics with
            {
                Price = input.Metrics.Price with { CalculationVersion = "old-version" },
            },
        };

        Assert.Throws<InvalidOperationException>(() => Execute([mismatched]));
    }

    [Fact]
    public void MetricAsOfMismatchIsRejected()
    {
        var input = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "OLD", 3m, 1_000_000m);
        var mismatched = input with
        {
            Metrics = input.Metrics with
            {
                Price = input.Metrics.Price with { AsOf = AsOf.AddSeconds(-1) },
            },
        };

        Assert.Throws<InvalidOperationException>(() => Execute([mismatched]));
    }

    [Fact]
    public void PresetVersionIsRetainedByRun()
    {
        var run = Execute([Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "ONE", 3m, 1_000_000m)]);

        Assert.Equal(Preset.VersionKey, run.PresetVersionKey);
        Assert.Equal(64, run.InputSnapshotHash.Length);
    }

    [Fact]
    public void PublicFloatEvidenceMustMatchSecurityKindAndTimeline()
    {
        var input = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "ONE", 3m, 1_000_000m);
        var mismatched = input with { PublicFloat = QualifiedFloat(Guid.NewGuid(), ShareMetricKind.PublicFloat, AsOf) };
        var wrongKind = input with { PublicFloat = QualifiedFloat(input.SecurityId, ShareMetricKind.SharesOutstanding, AsOf) };
        var future = input with { PublicFloat = QualifiedFloat(input.SecurityId, ShareMetricKind.PublicFloat, AsOf.AddSeconds(1)) };

        Assert.All(new[] { mismatched, wrongKind, future }, invalid =>
        {
            var candidate = Execute([invalid]).Candidates.Single();
            Assert.False(candidate.Qualified);
            Assert.Null(candidate.Rank);
            Assert.Contains("does not match", candidate.ExclusionReason, StringComparison.Ordinal);
        });
    }

    [Fact]
    public void SnapshotHashBindsSymbolMetricStateReasonAndFloatProvenance()
    {
        var input = Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "ONE", 3m, 1_000_000m);
        var baseline = Execute([input]).InputSnapshotHash;
        var symbolChanged = Execute([input with { Symbol = "TWO" }]).InputSnapshotHash;
        var reasonChanged = Execute([input with { Metrics = input.Metrics with { Price = input.Metrics.Price with { Reason = "different evidence" } } }]).InputSnapshotHash;
        var provenanceChanged = Execute([input with { PublicFloat = QualifiedFloat(input.SecurityId, ShareMetricKind.PublicFloat, AsOf, "float-v2") }]).InputSnapshotHash;

        Assert.Equal(4, new[] { baseline, symbolChanged, reasonChanged, provenanceChanged }.Distinct().Count());
    }

    [Fact]
    public void PresetCannotRunBeforePublication()
    {
        var futurePreset = new ScannerPreset(Preset.Id, Preset.Name, Preset.Version, Preset.Policy, AsOf.AddSeconds(1));

        Assert.Throws<InvalidOperationException>(() => ScannerService.Execute(Guid.NewGuid(), futurePreset, AsOf, [Input("AAAAAAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA", "ONE", 3m, 1_000_000m)]));
    }

    private static ScannerRun Execute(IEnumerable<ScannerSecurityInput> inputs) =>
        ScannerService.Execute(Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"), Preset, AsOf, inputs);

    private static ScannerSecurityInput Input(
        string securityId,
        string symbol,
        decimal rvol,
        decimal dollarVolume,
        bool extreme = false,
        bool rvolMatches = true,
        bool inputsQualified = true)
    {
        var id = Guid.Parse(securityId);
        var metric = new ScannerMetricSet(
            Metric("price", 5m, "USD"),
            Metric("gain", extreme ? 150m : 50m, "%"),
            Metric("rvol", rvol, "ratio"),
            Metric("spread", 0.02m, "USD"),
            Metric("spreadPercent", 0.4m, "%"),
            Metric("dollarVolume", dollarVolume, "USD"),
            true,
            rvolMatches,
            true,
            true,
            extreme,
            inputsQualified,
            false);
        var fact = new ShareMetricFact(
            id,
            ShareMetricKind.PublicFloat,
            400_000,
            new ReferenceFactProvenance("synthetic-reference", $"float-{symbol}", new(2026, 8, 12), AsOf, 1, "float-v1"));
        return new(id, symbol, metric, new(ReferenceResolutionState.Qualified, fact, "qualified"));
    }

    private static CalculatedMetric Metric(string name, decimal value, string unit) =>
        new(name, CalculationState.Calculated, value, unit, Policy.Version, AsOf, "synthetic");

    private static ReferenceResolution QualifiedFloat(Guid securityId, ShareMetricKind kind, DateTimeOffset observedAt, string definition = "float-v1") =>
        new(ReferenceResolutionState.Qualified,
            new ShareMetricFact(securityId, kind, 400_000,
                new ReferenceFactProvenance("synthetic-reference", $"float-{securityId:N}-{kind}", new(2026, 8, 12), observedAt, 1, definition)),
            "qualified");
}
