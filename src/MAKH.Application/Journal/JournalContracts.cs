namespace MAKH.Application.Journal;

public enum JournalEntryState
{
    Draft,
    Reviewed,
    Archived,
}

public enum JournalAuditAction
{
    Created,
    Updated,
    Reviewed,
    Archived,
}

public sealed record JournalScope
{
    public JournalScope(Guid accountId, Guid userId)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        if (userId == Guid.Empty) throw new ArgumentException("User ID is required.", nameof(userId));
        AccountId = accountId;
        UserId = userId;
    }

    public Guid AccountId { get; }
    public Guid UserId { get; }
}

public sealed record JournalEntryContent
{
    public JournalEntryContent(
        string thesis,
        string tradePlan,
        string outcomeReview,
        IEnumerable<string> tags,
        IEnumerable<Guid>? evidenceItemIds = null,
        IEnumerable<Guid>? orderIds = null,
        IEnumerable<Guid>? positionIds = null)
    {
        Thesis = Required(thesis, nameof(thesis), 4_000);
        TradePlan = Required(tradePlan, nameof(tradePlan), 4_000);
        OutcomeReview = Optional(outcomeReview, nameof(outcomeReview), 4_000);
        Tags = NormalizeTags(tags);
        EvidenceItemIds = NormalizeIds(evidenceItemIds);
        OrderIds = NormalizeIds(orderIds);
        PositionIds = NormalizeIds(positionIds);
        CanAuthorizeTrade = false;
        CanChangeRiskState = false;
        CanChangeBrokerState = false;
    }

    public string Thesis { get; }
    public string TradePlan { get; }
    public string OutcomeReview { get; }
    public IReadOnlyList<string> Tags { get; }
    public IReadOnlyList<Guid> EvidenceItemIds { get; }
    public IReadOnlyList<Guid> OrderIds { get; }
    public IReadOnlyList<Guid> PositionIds { get; }
    public bool CanAuthorizeTrade { get; }
    public bool CanChangeRiskState { get; }
    public bool CanChangeBrokerState { get; }

    private static string Required(string value, string parameterName, int maximumLength)
    {
        var normalized = Optional(value, parameterName, maximumLength);
        return normalized.Length == 0
            ? throw new ArgumentException("Value is required.", parameterName)
            : normalized;
    }

    private static string Optional(string? value, string parameterName, int maximumLength)
    {
        var normalized = value?.Trim() ?? string.Empty;
        if (normalized.Length > maximumLength)
            throw new ArgumentException($"Value cannot exceed {maximumLength} characters.", parameterName);
        return normalized;
    }

    private static string[] NormalizeTags(IEnumerable<string> tags)
    {
        ArgumentNullException.ThrowIfNull(tags);
        var normalized = tags
            .Select(tag => tag?.Trim().ToLowerInvariant() ?? string.Empty)
            .Where(tag => tag.Length > 0)
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToArray();
        if (normalized.Length > 20) throw new ArgumentException("A journal entry supports at most 20 tags.", nameof(tags));
        if (normalized.Any(tag => tag.Length > 40)) throw new ArgumentException("Tags cannot exceed 40 characters.", nameof(tags));
        return normalized;
    }

    private static Guid[] NormalizeIds(IEnumerable<Guid>? values) => values?
        .Where(value => value != Guid.Empty)
        .Distinct()
        .Order()
        .ToArray() ?? [];
}

public sealed record JournalEntry(
    Guid EntryId,
    Guid AccountId,
    Guid UserId,
    Guid SecurityId,
    JournalEntryState State,
    int Version,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    JournalEntryContent Content);

public sealed record JournalAuditEvent(
    Guid EventId,
    Guid EntryId,
    Guid AccountId,
    Guid ActorUserId,
    JournalAuditAction Action,
    int EntryVersion,
    DateTimeOffset OccurredAt,
    string Reason,
    string? BeforeSha256,
    string AfterSha256,
    string CorrelationId);

public interface IJournalRepository
{
    JournalEntry? Find(Guid entryId);
    IReadOnlyList<JournalEntry> List(JournalScope scope, bool includeArchived = false);
    IReadOnlyList<JournalAuditEvent> Audit(Guid entryId);
    void Add(JournalEntry entry, JournalAuditEvent auditEvent);
    void Replace(JournalEntry entry, int expectedVersion, JournalAuditEvent auditEvent);
}
