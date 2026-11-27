using MAKH.Application.Market;
using MAKH.Domain.Market;
using MAKH.Infrastructure.Market;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class ReferenceDataAdapterTests
{
    private const string FloatDefinition = "freely-tradable-common-shares-v1";
    private static readonly Guid SecurityId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly DateTimeOffset ObservedAt = new(2026, 8, 12, 12, 0, 0, TimeSpan.Zero);
    private static readonly IReadOnlySet<string> ApprovedDefinitions = new HashSet<string>(StringComparer.Ordinal) { FloatDefinition };

    [Fact]
    public void CurrentApprovedFloatQualifies()
    {
        var fact = FloatFact("float-1", new(2026, 8, 10), 450_000);

        var result = ReferenceDataResolver.ResolveShareMetric(
            SecurityId,
            ShareMetricKind.PublicFloat,
            new(2026, 8, 12),
            30,
            ApprovedDefinitions,
            [fact]);

        Assert.Equal(ReferenceResolutionState.Qualified, result.State);
        Assert.True(result.CanQualifyScannerCandidate);
        Assert.Equal(450_000, result.Fact?.Shares);
    }

    [Fact]
    public void SharesOutstandingCannotSubstituteForFloat()
    {
        var fact = new ShareMetricFact(
            SecurityId,
            ShareMetricKind.SharesOutstanding,
            450_000,
            Provenance("shares-1", new(2026, 8, 10), 1, "issued-common-shares-v1"));

        var result = ReferenceDataResolver.ResolveShareMetric(
            SecurityId,
            ShareMetricKind.PublicFloat,
            new(2026, 8, 12),
            30,
            ApprovedDefinitions,
            [fact]);

        Assert.Equal(ReferenceResolutionState.Missing, result.State);
    }

    [Fact]
    public void StaleFloatFailsQualification()
    {
        var result = ReferenceDataResolver.ResolveShareMetric(
            SecurityId,
            ShareMetricKind.PublicFloat,
            new(2026, 8, 12),
            30,
            ApprovedDefinitions,
            [FloatFact("float-old", new(2026, 6, 1), 450_000)]);

        Assert.Equal(ReferenceResolutionState.Stale, result.State);
        Assert.False(result.CanQualifyScannerCandidate);
    }

    [Fact]
    public void UnapprovedDefinitionFailsQualification()
    {
        var fact = new ShareMetricFact(
            SecurityId,
            ShareMetricKind.PublicFloat,
            450_000,
            Provenance("float-unknown", new(2026, 8, 10), 1, "unknown-definition"));

        var result = ReferenceDataResolver.ResolveShareMetric(
            SecurityId,
            ShareMetricKind.PublicFloat,
            new(2026, 8, 12),
            30,
            ApprovedDefinitions,
            [fact]);

        Assert.Equal(ReferenceResolutionState.DefinitionUnapproved, result.State);
    }

    [Fact]
    public void ConflictingProvidersFailAsAmbiguous()
    {
        var first = FloatFact("float-a", new(2026, 8, 10), 450_000);
        var second = new ShareMetricFact(
            SecurityId,
            ShareMetricKind.PublicFloat,
            550_000,
            new ReferenceFactProvenance("second-provider", "float-b", new(2026, 8, 10), ObservedAt, 1, FloatDefinition));

        var result = ReferenceDataResolver.ResolveShareMetric(
            SecurityId,
            ShareMetricKind.PublicFloat,
            new(2026, 8, 12),
            30,
            ApprovedDefinitions,
            [first, second]);

        Assert.Equal(ReferenceResolutionState.Ambiguous, result.State);
        Assert.Null(result.Fact);
    }

    [Fact]
    public void ConflictingDefinitionsFailAsAmbiguousEvenWhenValuesAgree()
    {
        var first = FloatFact("float-a", new(2026, 8, 10), 450_000);
        var second = new ShareMetricFact(SecurityId, ShareMetricKind.PublicFloat, 450_000,
            new ReferenceFactProvenance("second-provider", "float-b", new(2026, 8, 10), ObservedAt, 1, "different-definition"));

        var result = ReferenceDataResolver.ResolveShareMetric(SecurityId, ShareMetricKind.PublicFloat, new(2026, 8, 12), 30, ApprovedDefinitions, [first, second]);

        Assert.Equal(ReferenceResolutionState.Ambiguous, result.State);
    }

    [Fact]
    public void SameProviderSameRevisionConflictFailsAsAmbiguous()
    {
        var first = FloatFact("float-a", new(2026, 8, 10), 450_000);
        var second = FloatFact("float-b", new(2026, 8, 10), 460_000);

        var result = ReferenceDataResolver.ResolveShareMetric(SecurityId, ShareMetricKind.PublicFloat, new(2026, 8, 12), 30, ApprovedDefinitions, [first, second]);

        Assert.Equal(ReferenceResolutionState.Ambiguous, result.State);
    }

    [Fact]
    public async Task LatestProviderRevisionIsSelected()
    {
        var original = FloatFact("float-revised", new(2026, 8, 10), 400_000);
        var revised = new ShareMetricFact(
            SecurityId,
            ShareMetricKind.PublicFloat,
            450_000,
            new ReferenceFactProvenance(
                "synthetic-reference",
                "float-revised",
                new(2026, 8, 10),
                ObservedAt.AddHours(1),
                2,
                FloatDefinition,
                original.Provenance.FactId));
        var adapter = new SyntheticReferenceDataAdapter([original, revised], []);

        var result = await adapter.GetShareMetricsAsync([SecurityId]);

        Assert.Single(result);
        Assert.Equal(2, result[0].Provenance.Revision);
        Assert.Equal(450_000, result[0].Shares);
    }

    [Fact]
    public async Task AdapterFiltersRequestedSecurities()
    {
        var other = Guid.NewGuid();
        var adapter = new SyntheticReferenceDataAdapter([
            FloatFact("requested", new(2026, 8, 10), 450_000),
            new ShareMetricFact(other, ShareMetricKind.PublicFloat, 300_000, Provenance("other", new(2026, 8, 10), 1, FloatDefinition)),
        ], []);

        var result = await adapter.GetShareMetricsAsync([SecurityId]);

        Assert.Single(result);
        Assert.Equal(SecurityId, result[0].SecurityId);
    }

    [Fact]
    public void AdapterRejectsForeignProviderAttribution()
    {
        var foreign = new ShareMetricFact(
            SecurityId,
            ShareMetricKind.PublicFloat,
            450_000,
            new ReferenceFactProvenance("foreign", "float", new(2026, 8, 10), ObservedAt, 1, FloatDefinition));

        Assert.Throws<InvalidOperationException>(() => new SyntheticReferenceDataAdapter([foreign], []));
    }

    [Fact]
    public async Task CorporateActionPreservesEffectiveDateAndRatio()
    {
        var action = new CorporateActionFact(
            SecurityId,
            CorporateActionType.ReverseSplit,
            new(2026, 8, 15),
            Provenance("action-1", new(2026, 8, 12), 1, "exchange-corporate-action-v1"),
            1,
            10);
        var adapter = new SyntheticReferenceDataAdapter([], [action]);

        var result = await adapter.GetCorporateActionsAsync([SecurityId]);

        Assert.Single(result);
        Assert.Equal(1m, result[0].Numerator);
        Assert.Equal(10m, result[0].Denominator);
    }

    [Fact]
    public void InvalidSplitRatioIsRejected()
    {
        Assert.Throws<ArgumentException>(() => new CorporateActionFact(
            SecurityId,
            CorporateActionType.StockSplit,
            new(2026, 8, 15),
            Provenance("action-invalid", new(2026, 8, 12), 1, "exchange-corporate-action-v1"),
            0,
            1));
    }

    [Fact]
    public void ProvenanceRejectsFutureAsOfAndBrokenRevisionLineage()
    {
        Assert.Throws<ArgumentException>(() => new ReferenceFactProvenance(
            "synthetic-reference", "future", new(2026, 8, 13), ObservedAt, 1, FloatDefinition));
        Assert.Throws<ArgumentException>(() => new ReferenceFactProvenance(
            "synthetic-reference", "revision", new(2026, 8, 10), ObservedAt, 2, FloatDefinition));
        Assert.Throws<ArgumentException>(() => new ReferenceFactProvenance(
            "synthetic-reference", "initial", new(2026, 8, 10), ObservedAt, 1, FloatDefinition, "older"));
    }

    [Fact]
    public void AdapterRejectsFactIdentityAndRevisionCollisions()
    {
        var other = Guid.NewGuid();
        var first = FloatFact("collision", new(2026, 8, 10), 450_000);
        var otherSecurity = new ShareMetricFact(other, ShareMetricKind.PublicFloat, 450_000,
            new ReferenceFactProvenance("synthetic-reference", "collision", new(2026, 8, 10), ObservedAt, 2, FloatDefinition, "collision"));
        Assert.Throws<InvalidOperationException>(() => new SyntheticReferenceDataAdapter([first, otherSecurity], []));

        var duplicateRevision = new ShareMetricFact(SecurityId, ShareMetricKind.PublicFloat, 460_000, Provenance("collision", new(2026, 8, 10), 1, FloatDefinition));
        Assert.Throws<InvalidOperationException>(() => new SyntheticReferenceDataAdapter([first, duplicateRevision], []));
    }

    private static ShareMetricFact FloatFact(string factId, DateOnly asOf, long shares) =>
        new(SecurityId, ShareMetricKind.PublicFloat, shares, Provenance(factId, asOf, 1, FloatDefinition));

    private static ReferenceFactProvenance Provenance(
        string factId,
        DateOnly asOf,
        int revision,
        string definition) =>
        new("synthetic-reference", factId, asOf, ObservedAt, revision, definition);
}
