using System.Text.RegularExpressions;

namespace MAKH.Application.Evidence;

public enum EvidenceSourceKind
{
    News,
    IssuerAnnouncement,
    ExchangeAnnouncement,
    SecFiling,
}

public enum EvidenceContentRight
{
    MetadataOnly,
    Excerpt,
    FullText,
}

public enum EvidenceTrustState
{
    Unverified,
    PublisherAttributed,
    PrimarySource,
}

public sealed record EvidenceProvenance
{
    public EvidenceProvenance(
        string provider,
        string providerRecordId,
        Uri canonicalUri,
        DateTimeOffset publishedAt,
        DateTimeOffset observedAt,
        int version,
        EvidenceContentRight contentRight,
        string? supersedesRecordId = null)
    {
        Provider = EvidenceText.Validate(provider, nameof(provider), 100, required: true)!;
        ProviderRecordId = EvidenceText.Validate(providerRecordId, nameof(providerRecordId), 200, required: true)!;
        if (canonicalUri is null || !canonicalUri.IsAbsoluteUri || canonicalUri.Scheme is not ("https" or "http") ||
            !string.IsNullOrEmpty(canonicalUri.UserInfo) || !string.IsNullOrEmpty(canonicalUri.Fragment))
            throw new ArgumentException("A canonical HTTP(S) URI is required.", nameof(canonicalUri));
        if (observedAt < publishedAt)
            throw new ArgumentException("Observation time cannot precede publication time.", nameof(observedAt));
        ArgumentOutOfRangeException.ThrowIfLessThan(version, 1);
        if (!Enum.IsDefined(contentRight))
            throw new ArgumentOutOfRangeException(nameof(contentRight), "Evidence content right is unsupported.");
        CanonicalUri = canonicalUri;
        PublishedAt = publishedAt;
        ObservedAt = observedAt;
        Version = version;
        ContentRight = contentRight;
        SupersedesRecordId = EvidenceText.Validate(
            supersedesRecordId, nameof(supersedesRecordId), 200, required: false);
        if (string.Equals(ProviderRecordId, SupersedesRecordId, StringComparison.Ordinal))
            throw new ArgumentException("Evidence cannot supersede itself.", nameof(supersedesRecordId));
    }

    public string Provider { get; }
    public string ProviderRecordId { get; }
    public Uri CanonicalUri { get; }
    public DateTimeOffset PublishedAt { get; }
    public DateTimeOffset ObservedAt { get; }
    public int Version { get; }
    public EvidenceContentRight ContentRight { get; }
    public string? SupersedesRecordId { get; }
    public bool IsRevision => SupersedesRecordId is not null;

}

public sealed record EvidenceDocument
{
    private static readonly Regex SecAccessionPattern = new(
        "^[0-9]{10}-[0-9]{2}-[0-9]{6}$",
        RegexOptions.CultureInvariant,
        TimeSpan.FromMilliseconds(50));

    public EvidenceDocument(
        Guid securityId,
        EvidenceSourceKind sourceKind,
        string headline,
        string publisher,
        string? accessionNumber,
        string? excerpt,
        EvidenceTrustState trustState,
        EvidenceProvenance provenance,
        bool isDeleted = false)
    {
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(securityId));
        if (!Enum.IsDefined(sourceKind))
            throw new ArgumentOutOfRangeException(nameof(sourceKind), "Evidence source kind is unsupported.");
        if (!Enum.IsDefined(trustState))
            throw new ArgumentOutOfRangeException(nameof(trustState), "Evidence trust state is unsupported.");
        SecurityId = securityId;
        SourceKind = sourceKind;
        Headline = EvidenceText.Validate(headline, nameof(headline), 500, required: true)!;
        Publisher = EvidenceText.Validate(publisher, nameof(publisher), 200, required: true)!;
        AccessionNumber = EvidenceText.Validate(accessionNumber, nameof(accessionNumber), 20, required: false);
        Excerpt = EvidenceText.Validate(excerpt, nameof(excerpt), 2_000, required: false);
        TrustState = trustState;
        Provenance = provenance ?? throw new ArgumentNullException(nameof(provenance));
        IsDeleted = isDeleted;

        if (sourceKind == EvidenceSourceKind.SecFiling && AccessionNumber is null)
            throw new ArgumentException("SEC filings require an accession number.", nameof(accessionNumber));
        if (sourceKind == EvidenceSourceKind.SecFiling && !SecAccessionPattern.IsMatch(AccessionNumber!))
            throw new ArgumentException("SEC accession number format is invalid.", nameof(accessionNumber));
        if (sourceKind != EvidenceSourceKind.SecFiling && AccessionNumber is not null)
            throw new ArgumentException("Only SEC filings may contain an accession number.", nameof(accessionNumber));
        if (provenance.ContentRight == EvidenceContentRight.MetadataOnly && Excerpt is not null)
            throw new ArgumentException("Metadata-only rights prohibit storing an excerpt.", nameof(excerpt));
        if (isDeleted && Excerpt is not null)
            throw new ArgumentException("Deleted evidence cannot retain excerpt content.", nameof(excerpt));
    }

    public Guid SecurityId { get; }
    public EvidenceSourceKind SourceKind { get; }
    public string Headline { get; }
    public string Publisher { get; }
    public string? AccessionNumber { get; }
    public string? Excerpt { get; }
    public EvidenceTrustState TrustState { get; }
    public EvidenceProvenance Provenance { get; }
    public bool IsDeleted { get; }
    public bool IsPrimarySource => TrustState == EvidenceTrustState.PrimarySource;

}

internal static class EvidenceText
{
    public static string? Validate(string? value, string parameterName, int maximumLength, bool required)
    {
        if (string.IsNullOrWhiteSpace(value))
            return required ? throw new ArgumentException("Value is required.", parameterName) : null;
        var result = value.Trim();
        if (result.Length > maximumLength)
            throw new ArgumentException($"Value exceeds the {maximumLength}-character limit.", parameterName);
        if (result.Any(character => char.IsControl(character) && character is not ('\r' or '\n' or '\t')))
            throw new ArgumentException("Value contains unsupported control characters.", parameterName);
        return result;
    }
}

public interface IEvidenceProvider
{
    string ProviderName { get; }

    Task<IReadOnlyList<EvidenceDocument>> GetEvidenceAsync(
        IReadOnlyCollection<Guid> securityIds,
        DateTimeOffset publishedAfter,
        CancellationToken cancellationToken = default);
}

public sealed record EvidenceSourceSnapshot
{
    public EvidenceSourceSnapshot(
        string payloadSha256,
        int byteCount,
        string mediaType,
        string scannerVersion,
        DateTimeOffset capturedAt,
        DateTimeOffset retainUntil)
    {
        if (payloadSha256?.Length != 64 || payloadSha256.Any(character => !char.IsAsciiHexDigit(character)))
            throw new ArgumentException("Payload hash must be SHA-256 hex.", nameof(payloadSha256));
        ArgumentOutOfRangeException.ThrowIfLessThan(byteCount, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(byteCount, EvidencePayloadSafety.MaximumPayloadBytes);
        if (string.IsNullOrWhiteSpace(mediaType) || mediaType.Trim().Length > 100)
            throw new ArgumentException("A bounded media type is required.", nameof(mediaType));
        if (string.IsNullOrWhiteSpace(scannerVersion) || scannerVersion.Trim().Length > 100)
            throw new ArgumentException("A bounded scanner version is required.", nameof(scannerVersion));
        if (capturedAt == default) throw new ArgumentException("Capture time is required.", nameof(capturedAt));
        if (retainUntil <= capturedAt || retainUntil > capturedAt.AddDays(3_650))
            throw new ArgumentOutOfRangeException(nameof(retainUntil), "Retention must be from one instant through ten years.");

        PayloadSha256 = payloadSha256.ToLowerInvariant();
        ByteCount = byteCount;
        MediaType = mediaType.Trim().ToLowerInvariant();
        ScannerVersion = scannerVersion.Trim();
        CapturedAt = capturedAt;
        RetainUntil = retainUntil;
    }

    public string PayloadSha256 { get; }
    public int ByteCount { get; }
    public string MediaType { get; }
    public string ScannerVersion { get; }
    public DateTimeOffset CapturedAt { get; }
    public DateTimeOffset RetainUntil { get; }
}

public sealed record EvidenceIngestionItem(EvidenceDocument Document, EvidenceSourceSnapshot Snapshot);

public sealed record EvidenceIngestionResult(int InsertedCount, int ReplayCount);

public interface IEvidenceStore
{
    Task<EvidenceIngestionResult> SaveBatchAsync(
        IReadOnlyCollection<EvidenceIngestionItem> items,
        CancellationToken cancellationToken = default);
}
