using MAKH.Application.Journal;

namespace MAKH.Infrastructure.Journal;

public sealed class InMemoryJournalRepository : IJournalRepository
{
    private readonly Dictionary<Guid, JournalEntry> entries = [];
    private readonly Dictionary<Guid, List<JournalAuditEvent>> auditEvents = [];
    private readonly object sync = new();

    public JournalEntry? Find(Guid entryId)
    {
        lock (sync) return entries.GetValueOrDefault(entryId);
    }

    public IReadOnlyList<JournalEntry> List(JournalScope scope, bool includeArchived = false)
    {
        lock (sync)
        {
            return entries.Values
                .Where(entry => entry.AccountId == scope.AccountId && entry.UserId == scope.UserId)
                .Where(entry => includeArchived || entry.State != JournalEntryState.Archived)
                .OrderByDescending(entry => entry.UpdatedAt)
                .ThenBy(entry => entry.EntryId)
                .ToArray();
        }
    }

    public IReadOnlyList<JournalAuditEvent> Audit(Guid entryId)
    {
        lock (sync) return auditEvents.GetValueOrDefault(entryId)?.ToArray() ?? [];
    }

    public void Add(JournalEntry entry, JournalAuditEvent auditEvent)
    {
        lock (sync)
        {
            if (!entries.TryAdd(entry.EntryId, entry)) throw new InvalidOperationException("Journal entry already exists.");
            auditEvents.Add(entry.EntryId, [auditEvent]);
        }
    }

    public void Replace(JournalEntry entry, int expectedVersion, JournalAuditEvent auditEvent)
    {
        lock (sync)
        {
            if (!entries.TryGetValue(entry.EntryId, out var current))
                throw new KeyNotFoundException("Journal entry was not found.");
            if (current.Version != expectedVersion)
                throw new InvalidOperationException("Journal entry version conflict.");
            entries[entry.EntryId] = entry;
            auditEvents[entry.EntryId].Add(auditEvent);
        }
    }
}
