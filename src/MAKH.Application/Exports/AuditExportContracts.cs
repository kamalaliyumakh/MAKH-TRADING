namespace MAKH.Application.Exports;

public enum AuditExportFormat { Csv, Json, Pdf }

public sealed record AuditExportRequest
{
    public AuditExportRequest(Guid requestId, Guid accountId, Guid actorUserId, string actorRole,
        AuditExportFormat format, DateTimeOffset requestedAt, DateTimeOffset expiresAt)
    {
        if (requestId == Guid.Empty || accountId == Guid.Empty || actorUserId == Guid.Empty)
            throw new ArgumentException("Request, account and actor IDs are required.");
        if (string.IsNullOrWhiteSpace(actorRole) || actorRole.Length > 100 || actorRole.Any(char.IsControl)
            || actorRole.Contains('@') || actorRole.Contains("token", StringComparison.OrdinalIgnoreCase)
            || actorRole.Contains("secret", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Actor role is invalid.", nameof(actorRole));
        if (!Enum.IsDefined(format)) throw new ArgumentOutOfRangeException(nameof(format));
        if (requestedAt == default || requestedAt.Offset != TimeSpan.Zero
            || expiresAt == default || expiresAt.Offset != TimeSpan.Zero)
            throw new ArgumentException("Export request and expiry times must be non-default UTC values.");
        if (expiresAt <= requestedAt || expiresAt > requestedAt.AddDays(7))
            throw new ArgumentException("Export expiry must be after request time and no more than seven days later.");
        RequestId = requestId;
        AccountId = accountId;
        ActorUserId = actorUserId;
        ActorRole = actorRole.Trim();
        Format = format;
        RequestedAt = requestedAt;
        ExpiresAt = expiresAt;
    }

    public Guid RequestId { get; }
    public Guid AccountId { get; }
    public Guid ActorUserId { get; }
    public string ActorRole { get; }
    public AuditExportFormat Format { get; }
    public DateTimeOffset RequestedAt { get; }
    public DateTimeOffset ExpiresAt { get; }
}

public sealed record AuditEvidenceRow
{
    public AuditEvidenceRow(string eventId, Guid accountId, DateTimeOffset occurredAt, string category,
        string action, string subjectReference, string correlationId)
    {
        EventId = Safe(eventId, nameof(eventId), 200);
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        if (occurredAt == default || occurredAt.Offset != TimeSpan.Zero)
            throw new ArgumentException("Evidence occurrence time must be a non-default UTC value.", nameof(occurredAt));
        Category = Safe(category, nameof(category));
        Action = Safe(action, nameof(action));
        SubjectReference = Safe(subjectReference, nameof(subjectReference));
        CorrelationId = Safe(correlationId, nameof(correlationId), 200);
        AccountId = accountId;
        OccurredAt = occurredAt;
    }

    public string EventId { get; }
    public Guid AccountId { get; }
    public DateTimeOffset OccurredAt { get; }
    public string Category { get; }
    public string Action { get; }
    public string SubjectReference { get; }
    public string CorrelationId { get; }

    private static string Required(string value, string name) => string.IsNullOrWhiteSpace(value)
        ? throw new ArgumentException("Value is required.", name) : value.Trim();

    private static string Safe(string value, string name, int maximumLength = 500)
    {
        var normalized = Required(value, name);
        if (normalized.Contains('@') || normalized.Contains("token", StringComparison.OrdinalIgnoreCase) ||
            normalized.Contains("secret", StringComparison.OrdinalIgnoreCase) || normalized.Length > maximumLength ||
            normalized.Any(char.IsControl))
            throw new ArgumentException("Export evidence contains prohibited or excessive material.", name);
        return normalized;
    }
}

public sealed record AuditExportManifest(
    Guid ExportId,
    Guid RequestId,
    Guid AccountId,
    Guid ActorUserId,
    string ActorRole,
    AuditExportFormat Format,
    DateTimeOffset GeneratedAt,
    DateTimeOffset ExpiresAt,
    int RecordCount,
    string ContentSha256,
    string MediaType,
    string FileName,
    bool Authorized,
    bool ContainsCredentials,
    bool CreatesTradingAuthority);

public sealed record AuditExportPackage(AuditExportManifest Manifest, byte[] Content);

public interface IAuditExportAuthorization
{
    bool CanExport(Guid actorUserId, Guid accountId, string actorRole);
}
