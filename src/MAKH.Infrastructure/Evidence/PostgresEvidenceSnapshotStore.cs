using MAKH.Application.Evidence;
using MAKH.Infrastructure.Persistence;
using MAKH.Infrastructure.Persistence.Evidence;
using Microsoft.EntityFrameworkCore;

namespace MAKH.Infrastructure.Evidence;

public sealed class PostgresEvidenceSnapshotStore(PlatformDbContext context) : IEvidenceSnapshotStore
{
    public async Task<EvidenceSnapshotSaveResult> SaveAsync(
        EvidenceSnapshot snapshot,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(snapshot);
        var record = new EvidenceSnapshotRecord(snapshot);
        var inserted = await context.Database.ExecuteSqlInterpolatedAsync($"""
            INSERT INTO evidence.combined_snapshots
                (id, as_of, schema_version, manifest_sha256, item_count, items_json)
            VALUES
                ({record.Id}, {record.AsOf}, {record.SchemaVersion}, {record.ManifestSha256},
                 {record.ItemCount}, {record.ItemsJson}::jsonb)
            ON CONFLICT (as_of) DO NOTHING
            """, cancellationToken);
        if (inserted == 1) return new(true, false);

        var existingManifest = await context.EvidenceSnapshots.AsNoTracking()
            .Where(existing => existing.AsOf == snapshot.AsOf)
            .Select(existing => existing.ManifestSha256)
            .SingleOrDefaultAsync(cancellationToken)
            ?? throw new InvalidOperationException("Snapshot conflict resolution could not read the winning manifest.");
        if (!string.Equals(existingManifest, snapshot.ManifestSha256, StringComparison.Ordinal))
            throw new InvalidOperationException("An evidence snapshot point in time cannot be replayed with a different manifest.");
        return new(false, true);
    }

    public async Task<EvidenceSnapshot?> GetAsync(
        DateTimeOffset asOf,
        CancellationToken cancellationToken = default)
    {
        var record = await context.EvidenceSnapshots.AsNoTracking()
            .SingleOrDefaultAsync(snapshot => snapshot.AsOf == asOf, cancellationToken);
        return record?.ToModel();
    }
}
