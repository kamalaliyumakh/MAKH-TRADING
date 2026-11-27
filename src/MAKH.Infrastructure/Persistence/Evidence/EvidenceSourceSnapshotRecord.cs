using MAKH.Application.Evidence;

namespace MAKH.Infrastructure.Persistence.Evidence;

public sealed class EvidenceSourceSnapshotRecord
{
    private EvidenceSourceSnapshotRecord() { }

    public EvidenceSourceSnapshotRecord(Guid evidenceDocumentId, EvidenceSourceSnapshot snapshot)
    {
        if (evidenceDocumentId == Guid.Empty)
            throw new ArgumentException("Evidence document ID is required.", nameof(evidenceDocumentId));
        ArgumentNullException.ThrowIfNull(snapshot);
        EvidenceDocumentId = evidenceDocumentId;
        PayloadSha256 = snapshot.PayloadSha256;
        ByteCount = snapshot.ByteCount;
        MediaType = snapshot.MediaType;
        ScannerVersion = snapshot.ScannerVersion;
        CapturedAt = snapshot.CapturedAt;
        RetainUntil = snapshot.RetainUntil;
    }

    public Guid EvidenceDocumentId { get; private set; }
    public string PayloadSha256 { get; private set; } = string.Empty;
    public int ByteCount { get; private set; }
    public string MediaType { get; private set; } = string.Empty;
    public string ScannerVersion { get; private set; } = string.Empty;
    public DateTimeOffset CapturedAt { get; private set; }
    public DateTimeOffset RetainUntil { get; private set; }
    public EvidenceDocumentRecord EvidenceDocument { get; private set; } = null!;

    public EvidenceSourceSnapshot ToModel() => new(
        PayloadSha256, ByteCount, MediaType, ScannerVersion, CapturedAt, RetainUntil);
}
