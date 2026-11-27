using MAKH.Application.Evidence;
using MAKH.Infrastructure.Evidence;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class SocialSignalAdapterTests
{
    private static readonly Guid SecurityId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff");
    private static readonly DateTimeOffset WindowEnd = new(2026, 8, 12, 15, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ProvenanceRequiresAValidWindow() => Assert.Throws<ArgumentException>(() => new SocialSignalProvenance(
        "synthetic-social-attention", "aggregate-1", WindowEnd, WindowEnd, WindowEnd, 1, "Synthetic count"));

    [Fact]
    public void ProvenanceRejectsObservationBeforeWindowEnd() => Assert.Throws<ArgumentException>(() => new SocialSignalProvenance(
        "synthetic-social-attention", "aggregate-1", WindowEnd.AddMinutes(-5), WindowEnd,
        WindowEnd.AddSeconds(-1), 1, "Synthetic count"));

    [Fact]
    public void ProvenanceRejectsSelfSupersession() => Assert.Throws<ArgumentException>(() =>
        Provenance("aggregate-1", supersedesAggregateId: "aggregate-1"));

    [Fact]
    public void SignalRequiresLimitationLabel() => Assert.Throws<ArgumentException>(() =>
        Signal("aggregate-1", limitationLabel: " "));

    [Fact]
    public void SignalRejectsAuthorEstimateAboveMentions() => Assert.Throws<ArgumentException>(() =>
        Signal("aggregate-1", mentions: 2, authors: 3));

    [Fact]
    public void SignalRejectsUndefinedConfidenceAndManipulationRisk()
    {
        var provenance = Provenance("aggregate-1");
        Assert.Throws<ArgumentException>(() => new SocialAttentionSignal(
            SecurityId, 10, 8, 25, (SocialConfidence)999, ManipulationRisk.Elevated,
            "Low-trust aggregate.", provenance));
        Assert.Throws<ArgumentOutOfRangeException>(() => new SocialAttentionSignal(
            SecurityId, 10, 8, 25, SocialConfidence.Low, (ManipulationRisk)999,
            "Low-trust aggregate.", provenance));
    }

    [Fact]
    public void SocialAttentionNeverVerifiesCatalystOrAuthorizesTrade()
    {
        var signal = Signal("aggregate-1");
        Assert.False(signal.CanVerifyCatalyst);
        Assert.False(signal.CanAuthorizeTrade);
    }

    [Fact]
    public void NormalizerKeepsLatestVersion()
    {
        var result = SocialSignalNormalizer.Normalize(
            [Signal("aggregate-1", version: 1), Signal("aggregate-1", version: 2, mentions: 20)],
            WindowEnd.AddMinutes(2), TimeSpan.FromMinutes(10));
        Assert.Single(result);
        Assert.Equal(20, result[0].MentionCount);
    }

    [Fact]
    public void NormalizerRemovesSupersededAggregate()
    {
        var result = SocialSignalNormalizer.Normalize(
            [Signal("aggregate-1"), Signal("aggregate-2", supersedesAggregateId: "aggregate-1")],
            WindowEnd.AddMinutes(2), TimeSpan.FromMinutes(10));
        Assert.Single(result);
        Assert.Equal("aggregate-2", result[0].Provenance.AggregateId);
    }

    [Fact]
    public void NormalizerDropsStaleAggregates()
    {
        var result = SocialSignalNormalizer.Normalize(
            [Signal("aggregate-1")], WindowEnd.AddMinutes(30), TimeSpan.FromMinutes(10));
        Assert.Empty(result);
    }

    [Fact]
    public void NormalizerRejectsFutureObservation() => Assert.Throws<InvalidOperationException>(() =>
        SocialSignalNormalizer.Normalize(
            [Signal("aggregate-1")], WindowEnd, TimeSpan.FromMinutes(10)));

    [Fact]
    public async Task AdapterFiltersBySecurityAndAsOf()
    {
        var otherSecurity = Guid.NewGuid();
        var adapter = new SyntheticSocialAttentionAdapter([
            Signal("aggregate-1"),
            Signal("aggregate-2", securityId: otherSecurity),
        ]);
        var result = await adapter.GetAttentionAsync([SecurityId], WindowEnd.AddMinutes(1));
        Assert.Single(result);
        Assert.Equal(SecurityId, result[0].SecurityId);
    }

    [Fact]
    public void AdapterRejectsCrossProviderSignals()
    {
        var provenance = Provenance("aggregate-1", provider: "other-provider");
        var signal = new SocialAttentionSignal(
            SecurityId, 10, 8, 25, SocialConfidence.Low, ManipulationRisk.Elevated,
            "Low-trust aggregate; not proof of a catalyst.", provenance);
        Assert.Throws<InvalidOperationException>(() => new SyntheticSocialAttentionAdapter([signal]));
    }

    [Fact]
    public void ProvenanceRejectsOversizedOrUnsafeIdentifiers()
    {
        Assert.Throws<ArgumentException>(() => Provenance(new string('a', 201)));
        Assert.Throws<ArgumentException>(() => Provenance("aggregate\u0001unsafe"));
    }

    [Fact]
    public void DeletedAggregateCannotRetainMetrics() => Assert.Throws<ArgumentException>(() =>
        Signal("aggregate-1", isDeleted: true));

    [Fact]
    public void NormalizerRemovesLatestDeletedAggregate()
    {
        var result = SocialSignalNormalizer.Normalize(
            [Signal("aggregate-1"), Signal("aggregate-1", version: 2, mentions: 0, authors: 0, attentionChangePercent: 0, isDeleted: true)],
            WindowEnd.AddMinutes(2), TimeSpan.FromMinutes(10));

        Assert.Empty(result);
    }

    [Fact]
    public void PrivacyPolicySuppressesSmallCohortsAndExpiredAggregates()
    {
        var policy = new SocialAggregatePrivacyPolicy(10, TimeSpan.FromHours(1), TimeSpan.FromHours(2));

        Assert.False(policy.MayRetain(Signal("small", authors: 9), WindowEnd.AddMinutes(2)));
        Assert.False(policy.MayRetain(Signal("expired", authors: 10), WindowEnd.AddHours(4)));
        Assert.True(policy.MayRetain(Signal("eligible", authors: 10, mentions: 12), WindowEnd.AddMinutes(2)));
    }

    [Fact]
    public void PrivacyPolicyRejectsUnboundedConfiguration()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new SocialAggregatePrivacyPolicy(1, TimeSpan.FromHours(1), TimeSpan.FromDays(1)));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new SocialAggregatePrivacyPolicy(10, TimeSpan.FromDays(8), TimeSpan.FromDays(1)));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new SocialAggregatePrivacyPolicy(10, TimeSpan.FromHours(1), TimeSpan.FromDays(31)));
    }

    private static SocialAttentionSignal Signal(
        string aggregateId,
        long mentions = 10,
        long authors = 8,
        decimal attentionChangePercent = 25,
        int version = 1,
        string limitationLabel = "Low-trust aggregate; not proof of a catalyst or buy signal.",
        string? supersedesAggregateId = null,
        Guid? securityId = null,
        bool isDeleted = false) => new(
            securityId ?? SecurityId,
            mentions,
            authors,
            attentionChangePercent,
            SocialConfidence.Low,
            ManipulationRisk.Elevated,
            limitationLabel,
            Provenance(aggregateId, version: version, supersedesAggregateId: supersedesAggregateId),
            isDeleted);

    private static SocialSignalProvenance Provenance(
        string aggregateId,
        int version = 1,
        string? supersedesAggregateId = null,
        string provider = "synthetic-social-attention") => new(
            provider,
            aggregateId,
            WindowEnd.AddMinutes(-5),
            WindowEnd,
            WindowEnd.AddMinutes(1),
            version,
            "Synthetic aggregate count; no raw posts or user identifiers retained.",
            supersedesAggregateId);
}
