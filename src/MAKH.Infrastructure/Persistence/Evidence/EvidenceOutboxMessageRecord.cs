using System.Text.Json;

namespace MAKH.Infrastructure.Persistence.Evidence;

public sealed class EvidenceOutboxMessageRecord
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private EvidenceOutboxMessageRecord() { }

    public EvidenceOutboxMessageRecord(EvidenceDocumentRecord document)
    {
        ArgumentNullException.ThrowIfNull(document);
        Id = Guid.NewGuid();
        EvidenceDocumentId = document.Id;
        EventType = "evidence.updated";
        SchemaVersion = 1;
        OccurredAt = document.ObservedAt;
        Payload = JsonSerializer.Serialize(new
        {
            evidenceDocumentId = document.Id,
            document.SecurityId,
            sourceKind = document.SourceKind.ToString(),
            document.Provider,
            document.ProviderRecordId,
            document.Version,
            document.PublishedAt,
            document.ObservedAt,
            document.SupersedesRecordId,
            document.IsDeleted,
            document.ContentSha256,
        }, SerializerOptions);
        NextAttemptAt = OccurredAt;
    }

    public Guid Id { get; private set; }
    public Guid EvidenceDocumentId { get; private set; }
    public string EventType { get; private set; } = string.Empty;
    public int SchemaVersion { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }
    public string Payload { get; private set; } = string.Empty;
    public DateTimeOffset? PublishedAt { get; private set; }
    public int AttemptCount { get; private set; }
    public string? LeaseOwner { get; private set; }
    public DateTimeOffset? LeaseUntil { get; private set; }
    public DateTimeOffset NextAttemptAt { get; private set; }
    public string? LastError { get; private set; }
    public EvidenceDocumentRecord EvidenceDocument { get; private set; } = null!;
}
