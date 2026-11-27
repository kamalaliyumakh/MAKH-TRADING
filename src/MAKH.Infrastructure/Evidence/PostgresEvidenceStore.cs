using MAKH.Application.Evidence;
using MAKH.Infrastructure.Persistence;
using MAKH.Infrastructure.Persistence.Evidence;
using Microsoft.EntityFrameworkCore;

namespace MAKH.Infrastructure.Evidence;

public sealed class PostgresEvidenceStore(PlatformDbContext context) : IEvidenceStore
{
    public async Task<EvidenceIngestionResult> SaveBatchAsync(
        IReadOnlyCollection<EvidenceIngestionItem> items,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(items);
        if (items.Count == 0) return new EvidenceIngestionResult(0, 0);
        if (items.Any(item => item.Document is null || item.Snapshot is null))
            throw new ArgumentException("Every ingestion item requires a document and source snapshot.", nameof(items));

        var documents = items.Select(item => item.Document).ToArray();
        var snapshots = items.GroupBy(Identity).ToDictionary(group => group.Key, group =>
        {
            var distinct = group.Select(item => item.Snapshot).Distinct().ToArray();
            return distinct.Length == 1
                ? distinct[0]
                : throw new InvalidOperationException(
                    "A provider record version cannot be replayed with different source snapshot metadata.");
        });

        var providers = documents.Select(document => document.Provenance.Provider).Distinct().ToArray();
        var recordIds = documents.Select(document => document.Provenance.ProviderRecordId).Distinct().ToArray();

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var existing = await context.EvidenceDocuments
            .Where(record => providers.Contains(record.Provider) && recordIds.Contains(record.ProviderRecordId))
            .ToArrayAsync(cancellationToken);
        var existingIds = existing.Select(record => record.Id).ToArray();
        var existingSnapshots = await context.EvidenceSourceSnapshots
            .Where(snapshot => existingIds.Contains(snapshot.EvidenceDocumentId))
            .ToDictionaryAsync(snapshot => snapshot.EvidenceDocumentId, cancellationToken);
        foreach (var record in existing)
        {
            if (!snapshots.TryGetValue((record.Provider, record.ProviderRecordId, record.Version), out var replay))
                continue;
            if (!existingSnapshots.TryGetValue(record.Id, out var persisted) || persisted.ToModel() != replay)
                throw new InvalidOperationException(
                    "A provider record version cannot be replayed with different source snapshot metadata.");
        }
        var plan = EvidenceReplayPlan.Create(existing, documents);

        if (plan.Inserts.Count > 0)
        {
            context.EvidenceDocuments.AddRange(plan.Inserts);
            context.EvidenceSourceSnapshots.AddRange(plan.Inserts.Select(document =>
                new EvidenceSourceSnapshotRecord(document.Id, snapshots[(
                    document.Provider, document.ProviderRecordId, document.Version)])));
            context.EvidenceOutboxMessages.AddRange(plan.Inserts.Select(
                document => new EvidenceOutboxMessageRecord(document)));
            await context.SaveChangesAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return new EvidenceIngestionResult(plan.Inserts.Count, plan.ReplayCount);
    }

    private static (string Provider, string ProviderRecordId, int Version) Identity(EvidenceIngestionItem item) =>
        (item.Document.Provenance.Provider, item.Document.Provenance.ProviderRecordId, item.Document.Provenance.Version);
}
