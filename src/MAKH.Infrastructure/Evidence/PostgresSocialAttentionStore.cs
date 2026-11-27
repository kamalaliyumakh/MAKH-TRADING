using MAKH.Application.Evidence;
using MAKH.Infrastructure.Persistence;
using MAKH.Infrastructure.Persistence.Evidence;
using Microsoft.EntityFrameworkCore;

namespace MAKH.Infrastructure.Evidence;

public sealed class PostgresSocialAttentionStore(PlatformDbContext context) : ISocialAttentionStore
{
    public async Task<SocialAttentionIngestionResult> SaveBatchAsync(
        IReadOnlyCollection<SocialAttentionIngestionItem> items,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(items);
        if (items.Count == 0) return new(0, 0);
        if (items.Any(item => item.Signal is null))
            throw new ArgumentException("Every ingestion item requires a social aggregate.", nameof(items));

        var incoming = items.Select(item => (item.Signal, item.RetainUntil)).ToArray();
        var providers = incoming.Select(item => item.Signal.Provenance.Provider).Distinct().ToArray();
        var aggregateIds = incoming.Select(item => item.Signal.Provenance.AggregateId).Distinct().ToArray();

        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        var existing = await context.SocialAttentionAggregates
            .Where(record => providers.Contains(record.Provider) && aggregateIds.Contains(record.AggregateId))
            .ToArrayAsync(cancellationToken);
        var plan = SocialAttentionReplayPlan.Create(existing, incoming);
        if (plan.Inserts.Count > 0)
        {
            context.SocialAttentionAggregates.AddRange(plan.Inserts);
            await context.SaveChangesAsync(cancellationToken);
        }

        await transaction.CommitAsync(cancellationToken);
        return new(plan.Inserts.Count, plan.ReplayCount);
    }

    public Task<int> DeleteExpiredAsync(
        DateTimeOffset asOf,
        int limit,
        CancellationToken cancellationToken = default)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(limit, 1);
        ArgumentOutOfRangeException.ThrowIfGreaterThan(limit, 1_000);
        return context.Database.ExecuteSqlInterpolatedAsync($"""
            WITH expired AS MATERIALIZED (
                SELECT aggregate.id, aggregate.provider, aggregate.aggregate_id, aggregate.version,
                       aggregate.retain_until, aggregate.content_sha256
                FROM evidence.social_attention_aggregates aggregate
                WHERE aggregate.retain_until <= {asOf}
                ORDER BY aggregate.retain_until, aggregate.id
                FOR UPDATE SKIP LOCKED
                LIMIT {limit}
            ), deleted AS (
            DELETE FROM evidence.social_attention_aggregates aggregate
            USING expired
            WHERE aggregate.id = expired.id
            RETURNING aggregate.id
            )
            INSERT INTO audit.social_retention_deletions
                (id, aggregate_record_id, provider, aggregate_id, version, retain_until,
                 deleted_at, reason, content_sha256)
            SELECT gen_random_uuid(), expired.id, expired.provider, expired.aggregate_id,
                   expired.version, expired.retain_until, {asOf}, 'RetentionExpired',
                   expired.content_sha256
            FROM expired
            INNER JOIN deleted ON deleted.id = expired.id
            """, cancellationToken);
    }

    public async Task<SocialRetentionBacklog> GetRetentionBacklogAsync(
        DateTimeOffset asOf,
        CancellationToken cancellationToken = default)
    {
        var expired = context.SocialAttentionAggregates
            .AsNoTracking()
            .Where(record => record.RetainUntil <= asOf);
        var count = await expired.CountAsync(cancellationToken);
        var oldest = await expired
            .Select(record => (DateTimeOffset?)record.RetainUntil)
            .MinAsync(cancellationToken);
        return new(count, oldest);
    }
}
