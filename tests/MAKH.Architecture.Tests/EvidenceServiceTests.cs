using System.Diagnostics;
using MAKH.Application.Evidence;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class EvidenceServiceTests
{
    private static readonly Guid SecurityId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000001");
    private static readonly DateTimeOffset PublishedAt = new(2026, 8, 12, 16, 0, 0, TimeSpan.Zero);

    [Fact]
    public void AliasRejectsInvalidEffectiveWindow() => Assert.Throws<ArgumentException>(() =>
        new SecurityAlias(SecurityId, "XNAS", "MAKH", PublishedAt, PublishedAt));

    [Theory]
    [InlineData("NAS")]
    [InlineData("XN@S")]
    [InlineData("XNASX")]
    public void AliasRequiresCanonicalVenueMic(string venueMic) => Assert.Throws<ArgumentException>(() =>
        new SecurityAlias(SecurityId, venueMic, "MAKH", PublishedAt.AddDays(-1)));

    [Fact]
    public void AliasRejectsUnsafeOrOversizedSymbols()
    {
        Assert.Throws<ArgumentException>(() => new SecurityAlias(
            SecurityId, "XNAS", "BAD\u0001SYMBOL", PublishedAt.AddDays(-1)));
        Assert.Throws<ArgumentException>(() => new SecurityAlias(
            SecurityId, "XNAS", new string('A', 33), PublishedAt.AddDays(-1)));
    }

    [Fact]
    public void MatcherPrefersEffectiveCanonicalSecurityId()
    {
        var match = EvidenceEntityMatcher.Match(SecurityId, null, null, PublishedAt, [Alias()]);
        Assert.Equal(EntityMatchMethod.CanonicalSecurityId, match.Method);
        Assert.Equal(SecurityId, match.SecurityId);
    }

    [Fact]
    public void MatcherUsesCaseInsensitiveExactVenueAndSymbol()
    {
        var match = EvidenceEntityMatcher.Match(null, "xnas", "makh", PublishedAt, [Alias()]);
        Assert.Equal(EntityMatchMethod.ExactVenueSymbol, match.Method);
        Assert.Equal(SecurityId, match.SecurityId);
    }

    [Fact]
    public void MatcherRejectsSymbolOnlyMatch() => Assert.Throws<InvalidOperationException>(() =>
        EvidenceEntityMatcher.Match(null, null, "MAKH", PublishedAt, [Alias()]));

    [Fact]
    public void MatcherRejectsExpiredAlias() => Assert.Throws<InvalidOperationException>(() =>
        EvidenceEntityMatcher.Match(null, "XNAS", "MAKH", PublishedAt, [Alias(effectiveTo: PublishedAt)]));

    [Fact]
    public void MatcherFailsClosedOnAmbiguity() => Assert.Throws<InvalidOperationException>(() =>
        EvidenceEntityMatcher.Match(null, "XNAS", "MAKH", PublishedAt,
            [Alias(), Alias(Guid.NewGuid())]));

    [Fact]
    public void SnapshotDeduplicatesEquivalentHeadlinesAcrossProviders()
    {
        var snapshot = EvidenceService.BuildSnapshot(
            [Document("record-1", " Material   update "), Document("record-2", "material update", provider: "provider-two")],
            [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));
        Assert.Single(snapshot.Items);
        Assert.Equal(2, snapshot.Items[0].DuplicateSourceCount);
    }

    [Fact]
    public void RepeatedSameProviderRecordsDoNotInflateIndependentSourceCount()
    {
        var snapshot = EvidenceService.BuildSnapshot(
            [Document("record-1", "Material update"), Document("record-2", " material  update ")],
            [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));

        Assert.Single(snapshot.Items);
        Assert.Equal(1, snapshot.Items[0].DuplicateSourceCount);
        Assert.Equal("record-1", snapshot.Items[0].ProviderRecordId);
    }

    [Fact]
    public void DuplicateSourceCountIsStableAcrossProviderReplayOrder()
    {
        var first = Document("record-1", "Material update");
        var repeated = Document("record-2", "material update");
        var independent = Document("record-3", "MATERIAL UPDATE", provider: "provider-two");

        var a = EvidenceService.BuildSnapshot(
            [first, repeated, independent], [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));
        var b = EvidenceService.BuildSnapshot(
            [independent, repeated, first], [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));

        Assert.Equal(2, a.Items[0].DuplicateSourceCount);
        Assert.Equal(a.ManifestSha256, b.ManifestSha256);
    }

    [Fact]
    public void DeduplicationRetainsTheHighestTrustSource()
    {
        var snapshot = EvidenceService.BuildSnapshot(
            [Document("news-1", "Material update"), Document("filing-1", "Material update", EvidenceTrustState.PrimarySource,
                EvidenceSourceKind.SecFiling, "0000000000-26-000001", "provider-two")],
            [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));
        Assert.Equal(EvidenceTrustClass.Primary, snapshot.Items[0].TrustClass);
        Assert.Equal("filing-1", snapshot.Items[0].ProviderRecordId);
        Assert.False(snapshot.Items[0].CanVerifyCatalyst);
    }

    [Fact]
    public void SocialAttentionRemainsLowTrustAndCannotVerifyCatalyst()
    {
        var snapshot = EvidenceService.BuildSnapshot([], [SocialSignal()], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));
        Assert.Equal(EvidenceTrustClass.LowTrust, snapshot.Items[0].TrustClass);
        Assert.False(snapshot.Items[0].CanVerifyCatalyst);
    }

    [Fact]
    public void ReorderedInputsProduceTheSameSnapshotHash()
    {
        var first = Document("record-1", "First update");
        var second = Document("record-2", "Second update");
        var a = EvidenceService.BuildSnapshot([first, second], [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));
        var b = EvidenceService.BuildSnapshot([second, first], [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));
        Assert.Equal(a.ManifestSha256, b.ManifestSha256);
        Assert.Equal(64, a.ManifestSha256.Length);
    }

    [Fact]
    public void SnapshotHashChangesWhenEvidenceChanges()
    {
        var a = EvidenceService.BuildSnapshot([Document("record-1", "First update")], [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));
        var b = EvidenceService.BuildSnapshot([Document("record-1", "Changed update")], [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));
        Assert.NotEqual(a.ManifestSha256, b.ManifestSha256);
    }

    [Fact]
    public void SnapshotRejectsEvidenceObservedAfterAsOf() => Assert.Throws<InvalidOperationException>(() =>
        EvidenceService.BuildSnapshot([Document("record-1", "Update")], [], PublishedAt, TimeSpan.FromMinutes(10)));

    [Fact]
    public void CollisionGuardRejectsSameFingerprintForDifferentCanonicalContent()
    {
        var collision = new string('a', 64);
        Assert.Throws<InvalidOperationException>(() => EvidenceCollisionGuard.EnsureNoCollision([
            new(SecurityId, collision, "FIRST MATERIAL UPDATE"),
            new(SecurityId, collision, "DIFFERENT MATERIAL UPDATE"),
        ]));
    }

    [Fact]
    public void MaximumSizeSnapshotIsStableWithinLocalBudget()
    {
        var documents = Enumerable.Range(0, 10_000)
            .Select(index => Document(
                $"record-{index:D5}",
                $"Synthetic material update {index:D5}",
                provider: $"provider-{index % 50:D2}"))
            .ToArray();
        var timer = Stopwatch.StartNew();

        var snapshot = EvidenceService.BuildSnapshot(
            documents, [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));

        timer.Stop();
        Assert.Equal(10_000, snapshot.Items.Count);
        Assert.Equal(64, snapshot.ManifestSha256.Length);
        Assert.True(timer.Elapsed < TimeSpan.FromSeconds(5), $"Snapshot build took {timer.Elapsed}.");
        var replay = EvidenceService.BuildSnapshot(
            documents.Reverse(), [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10));
        Assert.Equal(snapshot.ManifestSha256, replay.ManifestSha256);
    }

    [Fact]
    public void SnapshotRejectsInputAboveMaximumSize()
    {
        var documents = Enumerable.Range(0, EvidenceService.MaximumSnapshotItems + 1)
            .Select(index => Document($"record-{index:D5}", $"Synthetic update {index:D5}"));

        Assert.Throws<InvalidOperationException>(() => EvidenceService.BuildSnapshot(
            documents, [], PublishedAt.AddMinutes(2), TimeSpan.FromMinutes(10)));
    }

    private static SecurityAlias Alias(Guid? securityId = null, DateTimeOffset? effectiveTo = null) =>
        new(securityId ?? SecurityId, "XNAS", "MAKH", PublishedAt.AddDays(-1), effectiveTo);

    private static EvidenceDocument Document(
        string recordId,
        string headline,
        EvidenceTrustState trustState = EvidenceTrustState.PublisherAttributed,
        EvidenceSourceKind sourceKind = EvidenceSourceKind.News,
        string? accessionNumber = null,
        string provider = "synthetic-evidence") => new(
            SecurityId, sourceKind, headline, "Synthetic publisher", accessionNumber, null, trustState,
            new EvidenceProvenance(provider, recordId, new Uri($"https://example.test/{recordId}"),
                PublishedAt, PublishedAt.AddMinutes(1), 1, EvidenceContentRight.MetadataOnly));

    private static SocialAttentionSignal SocialSignal() => new(
        SecurityId, 12, 8, 20, SocialConfidence.Low, ManipulationRisk.Elevated,
        "Low-trust aggregate; not proof of a catalyst or buy signal.",
        new SocialSignalProvenance("synthetic-social-attention", "aggregate-1", PublishedAt.AddMinutes(-5),
            PublishedAt, PublishedAt.AddMinutes(1), 1, "Synthetic aggregate; no raw posts retained."));
}
