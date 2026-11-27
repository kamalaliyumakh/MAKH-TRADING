namespace MAKH.Infrastructure.Persistence.Evidence;

public sealed class SocialRetentionDeletionAuditRecord
{
    private SocialRetentionDeletionAuditRecord() { }

    public Guid Id { get; private set; }
    public Guid AggregateRecordId { get; private set; }
    public string Provider { get; private set; } = string.Empty;
    public string AggregateId { get; private set; } = string.Empty;
    public int Version { get; private set; }
    public DateTimeOffset RetainUntil { get; private set; }
    public DateTimeOffset DeletedAt { get; private set; }
    public string Reason { get; private set; } = string.Empty;
    public string ContentSha256 { get; private set; } = string.Empty;
}
