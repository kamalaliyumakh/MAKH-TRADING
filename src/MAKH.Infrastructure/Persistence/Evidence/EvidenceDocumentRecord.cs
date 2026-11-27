using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MAKH.Application.Evidence;

namespace MAKH.Infrastructure.Persistence.Evidence;

public sealed class EvidenceDocumentRecord
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private EvidenceDocumentRecord() { }

    public EvidenceDocumentRecord(EvidenceDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);
        Id = Guid.NewGuid();
        SecurityId = document.SecurityId;
        SourceKind = document.SourceKind;
        Headline = document.Headline;
        Publisher = document.Publisher;
        AccessionNumber = document.AccessionNumber;
        Excerpt = document.Excerpt;
        TrustState = document.TrustState;
        Provider = document.Provenance.Provider;
        ProviderRecordId = document.Provenance.ProviderRecordId;
        CanonicalUri = document.Provenance.CanonicalUri.AbsoluteUri;
        PublishedAt = document.Provenance.PublishedAt;
        ObservedAt = document.Provenance.ObservedAt;
        Version = document.Provenance.Version;
        ContentRight = document.Provenance.ContentRight;
        SupersedesRecordId = document.Provenance.SupersedesRecordId;
        IsDeleted = document.IsDeleted;
        ContentSha256 = ComputeContentHash(document);
    }

    public Guid Id { get; private set; }
    public Guid SecurityId { get; private set; }
    public EvidenceSourceKind SourceKind { get; private set; }
    public string Headline { get; private set; } = string.Empty;
    public string Publisher { get; private set; } = string.Empty;
    public string? AccessionNumber { get; private set; }
    public string? Excerpt { get; private set; }
    public EvidenceTrustState TrustState { get; private set; }
    public string Provider { get; private set; } = string.Empty;
    public string ProviderRecordId { get; private set; } = string.Empty;
    public string CanonicalUri { get; private set; } = string.Empty;
    public DateTimeOffset PublishedAt { get; private set; }
    public DateTimeOffset ObservedAt { get; private set; }
    public int Version { get; private set; }
    public EvidenceContentRight ContentRight { get; private set; }
    public string? SupersedesRecordId { get; private set; }
    public bool IsDeleted { get; private set; }
    public string ContentSha256 { get; private set; } = string.Empty;

    public EvidenceDocument ToModel() => new(
        SecurityId,
        SourceKind,
        Headline,
        Publisher,
        AccessionNumber,
        Excerpt,
        TrustState,
        new EvidenceProvenance(
            Provider,
            ProviderRecordId,
            new Uri(CanonicalUri),
            PublishedAt,
            ObservedAt,
            Version,
            ContentRight,
            SupersedesRecordId),
        IsDeleted);

    public static string ComputeContentHash(EvidenceDocument document)
    {
        ArgumentNullException.ThrowIfNull(document);
        var canonical = JsonSerializer.Serialize(new
        {
            document.SecurityId,
            sourceKind = document.SourceKind.ToString(),
            document.Headline,
            document.Publisher,
            document.AccessionNumber,
            document.Excerpt,
            trustState = document.TrustState.ToString(),
            document.Provenance.Provider,
            document.Provenance.ProviderRecordId,
            canonicalUri = document.Provenance.CanonicalUri.AbsoluteUri,
            document.Provenance.PublishedAt,
            document.Provenance.ObservedAt,
            document.Provenance.Version,
            contentRight = document.Provenance.ContentRight.ToString(),
            document.Provenance.SupersedesRecordId,
            document.IsDeleted,
        }, SerializerOptions);
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)));
    }
}

public sealed record EvidenceReplayPlan(
    IReadOnlyList<EvidenceDocumentRecord> Inserts,
    int ReplayCount)
{
    public static EvidenceReplayPlan Create(
        IEnumerable<EvidenceDocumentRecord> existing,
        IEnumerable<EvidenceDocument> incoming)
    {
        ArgumentNullException.ThrowIfNull(existing);
        ArgumentNullException.ThrowIfNull(incoming);

        var known = existing.ToDictionary(Identity);
        var inserts = new List<EvidenceDocumentRecord>();
        var replayCount = 0;
        foreach (var document in incoming)
        {
            var record = new EvidenceDocumentRecord(document);
            var identity = Identity(record);
            if (known.TryGetValue(identity, out var prior))
            {
                if (!string.Equals(prior.ContentSha256, record.ContentSha256, StringComparison.Ordinal))
                    throw new InvalidOperationException(
                        "A provider record version cannot be replayed with different content.");
                replayCount++;
                continue;
            }

            known.Add(identity, record);
            inserts.Add(record);
        }

        return new EvidenceReplayPlan(inserts, replayCount);
    }

    private static (string Provider, string ProviderRecordId, int Version) Identity(
        EvidenceDocumentRecord record) => (record.Provider, record.ProviderRecordId, record.Version);
}
