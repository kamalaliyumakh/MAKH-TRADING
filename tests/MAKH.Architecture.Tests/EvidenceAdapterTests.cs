using MAKH.Application.Evidence;
using MAKH.Infrastructure.Evidence;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class EvidenceAdapterTests
{
    private static readonly Guid SecurityId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly DateTimeOffset PublishedAt = new(2026, 8, 12, 14, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ProvenanceRequiresCanonicalHttpUri() =>
        Assert.Throws<ArgumentException>(() => Provenance("record-1", new Uri("file:///tmp/evidence")));

    [Fact]
    public void ProvenanceRejectsObservationBeforePublication() =>
        Assert.Throws<ArgumentException>(() => new EvidenceProvenance(
            "synthetic-evidence", "record-1", new Uri("https://example.test/record-1"),
            PublishedAt, PublishedAt.AddSeconds(-1), 1, EvidenceContentRight.MetadataOnly));

    [Fact]
    public void ProvenanceRejectsUndefinedRightsAndSelfSupersession()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new EvidenceProvenance(
            "synthetic-evidence", "record-1", new Uri("https://example.test/record-1"),
            PublishedAt, PublishedAt.AddMinutes(1), 1, (EvidenceContentRight)999));
        Assert.Throws<ArgumentException>(() => Provenance("record-1", supersedesRecordId: "record-1"));
    }

    [Fact]
    public void DocumentRejectsUndefinedSourceAndTrustStates()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Document("record-1", (EvidenceSourceKind)999));
        Assert.Throws<ArgumentOutOfRangeException>(() => Document(
            "record-1", EvidenceSourceKind.News, trustState: (EvidenceTrustState)999));
    }

    [Fact]
    public void MetadataOnlyRightsProhibitExcerptStorage() =>
        Assert.Throws<ArgumentException>(() => Document(
            "record-1", EvidenceSourceKind.News, excerpt: "Unlicensed text"));

    [Fact]
    public void SecFilingsRequireAccessionNumber() =>
        Assert.Throws<ArgumentException>(() => Document("record-1", EvidenceSourceKind.SecFiling));

    [Fact]
    public void NonSecDocumentsRejectAccessionNumbers() =>
        Assert.Throws<ArgumentException>(() => Document(
            "record-1", EvidenceSourceKind.News, accessionNumber: "0000000000-26-000001"));

    [Theory]
    [InlineData("000000000026000001")]
    [InlineData("0000000000-2026-000001")]
    [InlineData("0000000000-26-1")]
    public void SecFilingsRequireCanonicalAccessionFormat(string accessionNumber) =>
        Assert.Throws<ArgumentException>(() => Document(
            "record-1", EvidenceSourceKind.SecFiling, accessionNumber: accessionNumber));

    [Fact]
    public void CanonicalUriRejectsCredentialsAndFragments()
    {
        Assert.Throws<ArgumentException>(() => Provenance(
            "record-1", new Uri("https://user@example.test/record-1")));
        Assert.Throws<ArgumentException>(() => Provenance(
            "record-1", new Uri("https://example.test/record-1#fragment")));
    }

    [Fact]
    public void EvidenceTextRejectsUnsupportedControlsAndOversizedContent()
    {
        Assert.Throws<ArgumentException>(() => Document(
            "record-1", EvidenceSourceKind.News, headline: "Unsafe\0headline"));
        Assert.Throws<ArgumentException>(() => new EvidenceDocument(
            SecurityId,
            EvidenceSourceKind.News,
            "Headline",
            "Publisher",
            null,
            new string('x', 2_001),
            EvidenceTrustState.PublisherAttributed,
            new EvidenceProvenance(
                "synthetic-evidence",
                "record-1",
                new Uri("https://example.test/record-1"),
                PublishedAt,
                PublishedAt.AddMinutes(1),
                1,
                EvidenceContentRight.Excerpt)));
    }

    [Fact]
    public void NormalizerKeepsLatestProviderRecordVersion()
    {
        var original = Document("record-1", EvidenceSourceKind.News, version: 1);
        var revised = Document("record-1", EvidenceSourceKind.News, version: 2, headline: "Corrected headline");

        var result = EvidenceNormalizer.Normalize([original, revised], PublishedAt.AddMinutes(2));

        Assert.Single(result);
        Assert.Equal("Corrected headline", result[0].Headline);
    }

    [Fact]
    public void NormalizerRemovesSupersededRecord()
    {
        var original = Document("record-1", EvidenceSourceKind.News);
        var replacement = Document("record-2", EvidenceSourceKind.News, supersedesRecordId: "record-1");

        var result = EvidenceNormalizer.Normalize([original, replacement], PublishedAt.AddMinutes(2));

        Assert.Single(result);
        Assert.Equal("record-2", result[0].Provenance.ProviderRecordId);
    }

    [Fact]
    public void NormalizerDoesNotResurrectAnEarlierDeletedVersion()
    {
        var original = Document("record-1", EvidenceSourceKind.News, version: 1);
        var tombstone = Document("record-1", EvidenceSourceKind.News, version: 2, isDeleted: true);

        var result = EvidenceNormalizer.Normalize([original, tombstone], PublishedAt.AddMinutes(2));

        Assert.Empty(result);
    }

    [Fact]
    public void SupersedingTombstoneRemovesTheTargetWithoutDisplayingTheTombstone()
    {
        var original = Document("record-1", EvidenceSourceKind.News);
        var tombstone = Document(
            "deletion-1", EvidenceSourceKind.News, supersedesRecordId: "record-1", isDeleted: true);

        var result = EvidenceNormalizer.Normalize([original, tombstone], PublishedAt.AddMinutes(2));

        Assert.Empty(result);
    }

    [Fact]
    public void DeletedEvidenceCannotRetainExcerptContent()
    {
        var provenance = new EvidenceProvenance(
            "synthetic-evidence",
            "record-1",
            new Uri("https://example.test/record-1"),
            PublishedAt,
            PublishedAt.AddMinutes(1),
            1,
            EvidenceContentRight.Excerpt);

        Assert.Throws<ArgumentException>(() => new EvidenceDocument(
            SecurityId,
            EvidenceSourceKind.News,
            "Deleted record",
            "Synthetic publisher",
            null,
            "Content that must not survive deletion.",
            EvidenceTrustState.PublisherAttributed,
            provenance,
            isDeleted: true));
    }

    [Fact]
    public void NormalizerRejectsFutureObservation()
    {
        Assert.Throws<InvalidOperationException>(() =>
            EvidenceNormalizer.Normalize([Document("record-1", EvidenceSourceKind.News)], PublishedAt));
    }

    [Fact]
    public async Task AdapterFiltersBySecurityAndPublicationTime()
    {
        var otherSecurity = Guid.NewGuid();
        var adapter = new SyntheticEvidenceAdapter([
            Document("record-1", EvidenceSourceKind.News),
            Document("record-2", EvidenceSourceKind.IssuerAnnouncement, securityId: otherSecurity),
        ]);

        var result = await adapter.GetEvidenceAsync([SecurityId], PublishedAt.AddMinutes(-1));

        Assert.Single(result);
        Assert.Equal(SecurityId, result[0].SecurityId);
    }

    [Fact]
    public void AdapterRejectsCrossProviderEvidence()
    {
        var provenance = new EvidenceProvenance(
            "other-provider", "record-1", new Uri("https://example.test/record-1"),
            PublishedAt, PublishedAt.AddMinutes(1), 1, EvidenceContentRight.MetadataOnly);
        var document = new EvidenceDocument(
            SecurityId, EvidenceSourceKind.News, "Headline", "Publisher", null, null,
            EvidenceTrustState.PublisherAttributed, provenance);

        Assert.Throws<InvalidOperationException>(() => new SyntheticEvidenceAdapter([document]));
    }

    [Fact]
    public void PrimarySourceStateIsExplicit()
    {
        var filing = Document(
            "record-1", EvidenceSourceKind.SecFiling,
            accessionNumber: "0000000000-26-000001", trustState: EvidenceTrustState.PrimarySource);
        Assert.True(filing.IsPrimarySource);
    }

    [Fact]
    public void SecFairAccessRequiresAttributableIdentityAndBoundedTraffic()
    {
        var policy = new SecFairAccessPolicy("MAKH Trading Research", "data@example.test", 8, 2);

        Assert.Equal("MAKH Trading Research data@example.test", policy.UserAgent);
        Assert.Equal(TimeSpan.FromMilliseconds(125), policy.MinimumRequestInterval);
        Assert.Throws<ArgumentException>(() => new SecFairAccessPolicy("MAKH", "not-an-email"));
        Assert.Throws<ArgumentOutOfRangeException>(() => new SecFairAccessPolicy("MAKH", "data@example.test", 11));
        Assert.Throws<ArgumentOutOfRangeException>(() => new SecFairAccessPolicy("MAKH", "data@example.test", 8, 3));
    }

    [Theory]
    [InlineData("https://www.sec.gov/Archives/edgar/data/1/index.json")]
    [InlineData("https://data.sec.gov/submissions/CIK0000000001.json")]
    public void SecFairAccessAllowsOnlySecureSecEndpoints(string endpoint)
    {
        SecFairAccessPolicy.EnsureAllowedEndpoint(new Uri(endpoint));
    }

    [Theory]
    [InlineData("http://www.sec.gov/Archives/edgar/data/1/index.json")]
    [InlineData("https://sec.gov.example.test/filing.json")]
    [InlineData("https://example.test/filing.json")]
    public void SecFairAccessRejectsNonSecOrInsecureEndpoints(string endpoint)
    {
        Assert.Throws<InvalidOperationException>(() => SecFairAccessPolicy.EnsureAllowedEndpoint(new Uri(endpoint)));
    }

    [Fact]
    public void SecFairAccessUsesBoundedExponentialOrServerRetryDelay()
    {
        Assert.Equal(TimeSpan.FromSeconds(4), SecFairAccessPolicy.GetRetryDelay(2));
        Assert.Equal(TimeSpan.FromSeconds(30), SecFairAccessPolicy.GetRetryDelay(2, TimeSpan.FromSeconds(30)));
        Assert.Equal(TimeSpan.FromMinutes(5), SecFairAccessPolicy.GetRetryDelay(20, TimeSpan.FromHours(1)));
    }

    private static EvidenceDocument Document(
        string recordId,
        EvidenceSourceKind sourceKind,
        int version = 1,
        string headline = "Synthetic headline",
        string? accessionNumber = null,
        string? excerpt = null,
        string? supersedesRecordId = null,
        Guid? securityId = null,
        EvidenceTrustState trustState = EvidenceTrustState.PublisherAttributed,
        bool isDeleted = false) => new(
            securityId ?? SecurityId,
            sourceKind,
            headline,
            "Synthetic publisher",
            accessionNumber,
            excerpt,
            trustState,
            Provenance(recordId, version: version, supersedesRecordId: supersedesRecordId),
            isDeleted);

    private static EvidenceProvenance Provenance(
        string recordId,
        Uri? uri = null,
        int version = 1,
        string? supersedesRecordId = null) => new(
            "synthetic-evidence",
            recordId,
            uri ?? new Uri($"https://example.test/{recordId}"),
            PublishedAt,
            PublishedAt.AddMinutes(1),
            version,
            EvidenceContentRight.MetadataOnly,
            supersedesRecordId);
}
