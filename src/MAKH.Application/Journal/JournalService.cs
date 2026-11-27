using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using MAKH.Application.Common.Ports;

namespace MAKH.Application.Journal;

public sealed class JournalService(IJournalRepository repository, IClock clock)
{
    public JournalEntry Create(
        JournalScope scope,
        Guid securityId,
        JournalEntryContent content,
        string reason,
        string correlationId)
    {
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(securityId));
        ArgumentNullException.ThrowIfNull(content);
        var now = clock.UtcNow;
        var entry = new JournalEntry(Guid.NewGuid(), scope.AccountId, scope.UserId, securityId,
            JournalEntryState.Draft, 1, now, now, content);
        repository.Add(entry, Audit(entry, scope.UserId, JournalAuditAction.Created, reason, correlationId, null));
        return entry;
    }

    public JournalEntry Update(
        JournalScope scope,
        Guid entryId,
        int expectedVersion,
        JournalEntryContent content,
        string reason,
        string correlationId)
    {
        var current = GetScoped(scope, entryId);
        if (current.State == JournalEntryState.Archived)
            throw new InvalidOperationException("Archived journal entries cannot be updated.");
        ArgumentNullException.ThrowIfNull(content);
        var updated = current with { Content = content, Version = current.Version + 1, UpdatedAt = clock.UtcNow };
        repository.Replace(updated, expectedVersion,
            Audit(updated, scope.UserId, JournalAuditAction.Updated, reason, correlationId, Hash(current)));
        return updated;
    }

    public JournalEntry MarkReviewed(
        JournalScope scope,
        Guid entryId,
        int expectedVersion,
        string reason,
        string correlationId)
    {
        var current = GetScoped(scope, entryId);
        if (current.State != JournalEntryState.Draft)
            throw new InvalidOperationException("Only a draft journal entry can be marked reviewed.");
        if (current.Content.OutcomeReview.Length == 0)
            throw new InvalidOperationException("An outcome review is required before review completion.");
        var updated = current with { State = JournalEntryState.Reviewed, Version = current.Version + 1, UpdatedAt = clock.UtcNow };
        repository.Replace(updated, expectedVersion,
            Audit(updated, scope.UserId, JournalAuditAction.Reviewed, reason, correlationId, Hash(current)));
        return updated;
    }

    public JournalEntry Archive(
        JournalScope scope,
        Guid entryId,
        int expectedVersion,
        string reason,
        string correlationId)
    {
        var current = GetScoped(scope, entryId);
        if (current.State == JournalEntryState.Archived)
            throw new InvalidOperationException("Journal entry is already archived.");
        var updated = current with { State = JournalEntryState.Archived, Version = current.Version + 1, UpdatedAt = clock.UtcNow };
        repository.Replace(updated, expectedVersion,
            Audit(updated, scope.UserId, JournalAuditAction.Archived, reason, correlationId, Hash(current)));
        return updated;
    }

    public JournalEntry Get(JournalScope scope, Guid entryId) => GetScoped(scope, entryId);

    public IReadOnlyList<JournalEntry> List(JournalScope scope, bool includeArchived = false) =>
        repository.List(scope, includeArchived);

    public IReadOnlyList<JournalAuditEvent> AuditTrail(JournalScope scope, Guid entryId)
    {
        _ = GetScoped(scope, entryId);
        return repository.Audit(entryId);
    }

    private JournalEntry GetScoped(JournalScope scope, Guid entryId)
    {
        var entry = repository.Find(entryId) ?? throw new KeyNotFoundException("Journal entry was not found.");
        if (entry.AccountId != scope.AccountId || entry.UserId != scope.UserId)
            throw new UnauthorizedAccessException("Journal entry is outside the authorized scope.");
        return entry;
    }

    private JournalAuditEvent Audit(
        JournalEntry entry,
        Guid actorUserId,
        JournalAuditAction action,
        string reason,
        string correlationId,
        string? beforeHash) => new(
            Guid.NewGuid(), entry.EntryId, entry.AccountId, actorUserId, action, entry.Version, clock.UtcNow,
            Required(reason, nameof(reason)), beforeHash, Hash(entry), Required(correlationId, nameof(correlationId)));

    private static string Hash(JournalEntry entry)
    {
        var content = entry.Content;
        var canonical = string.Join('|',
            entry.EntryId.ToString("D"), entry.AccountId.ToString("D"), entry.UserId.ToString("D"),
            entry.SecurityId.ToString("D"), entry.State, entry.Version.ToString(CultureInfo.InvariantCulture),
            entry.CreatedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture),
            entry.UpdatedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture),
            content.Thesis, content.TradePlan, content.OutcomeReview,
            string.Join(',', content.Tags), string.Join(',', content.EvidenceItemIds),
            string.Join(',', content.OrderIds), string.Join(',', content.PositionIds));
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical))).ToLowerInvariant();
    }

    private static string Required(string value, string parameterName) => string.IsNullOrWhiteSpace(value)
        ? throw new ArgumentException("Value is required.", parameterName)
        : value.Trim();
}
