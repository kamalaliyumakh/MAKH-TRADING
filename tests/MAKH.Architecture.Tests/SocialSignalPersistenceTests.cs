using MAKH.Application.Evidence;
using MAKH.Infrastructure.Evidence;
using MAKH.Infrastructure.Persistence;
using MAKH.Infrastructure.Persistence.Evidence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class SocialSignalPersistenceTests
{
    private static readonly DateTimeOffset ObservedAt = new(2026, 10, 2, 12, 1, 0, TimeSpan.Zero);
    private static readonly DateTimeOffset RetainUntil = ObservedAt.AddDays(7);

    [Fact]
    public void PersistenceRecordRoundTripsAggregateWithoutUserContent()
    {
        var signal = Signal("aggregate-1");
        var record = new SocialAttentionAggregateRecord(signal, RetainUntil);

        Assert.Equal(signal, record.ToModel());
        Assert.Equal(64, record.ContentSha256.Length);
        Assert.Equal(RetainUntil, record.RetainUntil);
    }

    [Fact]
    public void ReplayIsIdempotentAndRejectsChangedSameVersion()
    {
        var signal = Signal("aggregate-1");
        var existing = new SocialAttentionAggregateRecord(signal, RetainUntil);

        var replay = SocialAttentionReplayPlan.Create([existing], [(signal, RetainUntil)]);
        Assert.Empty(replay.Inserts);
        Assert.Equal(1, replay.ReplayCount);
        Assert.Throws<InvalidOperationException>(() => SocialAttentionReplayPlan.Create(
            [existing], [(Signal("aggregate-1", mentions: 20), RetainUntil)]));
    }

    [Fact]
    public void ReplayDeduplicatesIdenticalBatchItems()
    {
        var signal = Signal("aggregate-1");
        var plan = SocialAttentionReplayPlan.Create([], [(signal, RetainUntil), (signal, RetainUntil)]);

        Assert.Single(plan.Inserts);
        Assert.Equal(1, plan.ReplayCount);
    }

    [Fact]
    public void RecordRequiresRetentionAfterObservation()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new SocialAttentionAggregateRecord(Signal("aggregate-1"), ObservedAt));
    }

    [Fact]
    public void EfModelMapsPrivacySafeAggregateConstraints()
    {
        using var context = Context();
        var model = context.GetService<IDesignTimeModel>().Model;
        var aggregate = model.FindEntityType(typeof(SocialAttentionAggregateRecord))!;

        Assert.Equal(DatabaseSchemas.Evidence, aggregate.GetSchema());
        Assert.Equal("social_attention_aggregates", aggregate.GetTableName());
        Assert.Contains(aggregate.GetIndexes(), index => index.IsUnique && index.Properties
            .Select(property => property.Name).SequenceEqual(["Provider", "AggregateId", "Version"]));
        Assert.Contains(aggregate.GetCheckConstraints(), constraint => constraint.Name == "ck_social_attention_deleted_metrics");
        Assert.Contains(aggregate.GetCheckConstraints(), constraint => constraint.Name == "ck_social_attention_retention");
        Assert.DoesNotContain(aggregate.GetProperties(), property =>
            property.Name.Contains("Post", StringComparison.OrdinalIgnoreCase)
            || property.Name.Contains("Handle", StringComparison.OrdinalIgnoreCase)
            || property.Name.Contains("Profile", StringComparison.OrdinalIgnoreCase)
            || property.Name.Contains("AuthorId", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task EmptyRepositoryBatchReturnsWithoutDatabaseAccess()
    {
        await using var context = Context();
        var result = await new PostgresSocialAttentionStore(context).SaveBatchAsync([]);

        Assert.Equal(new SocialAttentionIngestionResult(0, 0), result);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1001)]
    public async Task ExpiredDeletionRequiresBoundedBatch(int limit)
    {
        await using var context = Context();
        await Assert.ThrowsAsync<ArgumentOutOfRangeException>(() =>
            new PostgresSocialAttentionStore(context).DeleteExpiredAsync(ObservedAt, limit));
    }

    [Fact]
    public void EfModelMapsImmutableDeletionAuditWithoutSocialContent()
    {
        using var context = Context();
        var model = context.GetService<IDesignTimeModel>().Model;
        var audit = model.FindEntityType(typeof(SocialRetentionDeletionAuditRecord))!;

        Assert.Equal(DatabaseSchemas.Audit, audit.GetSchema());
        Assert.Equal("social_retention_deletions", audit.GetTableName());
        Assert.Contains(audit.GetIndexes(), index => index.IsUnique
            && index.Properties.Single().Name == "AggregateRecordId");
        Assert.Contains(audit.GetCheckConstraints(), constraint =>
            constraint.Name == "ck_social_retention_audit_reason");
        Assert.DoesNotContain(audit.GetProperties(), property =>
            property.Name.Contains("Post", StringComparison.OrdinalIgnoreCase)
            || property.Name.Contains("Handle", StringComparison.OrdinalIgnoreCase)
            || property.Name.Contains("Profile", StringComparison.OrdinalIgnoreCase));
    }

    private static SocialAttentionSignal Signal(string aggregateId, long mentions = 12) => new(
        Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
        mentions,
        10,
        25,
        SocialConfidence.Low,
        ManipulationRisk.Elevated,
        "Aggregate attention only; not proof of a catalyst or buy signal.",
        new SocialSignalProvenance(
            "synthetic-social-attention",
            aggregateId,
            ObservedAt.AddMinutes(-6),
            ObservedAt.AddMinutes(-1),
            ObservedAt,
            1,
            "Synthetic aggregate; no raw posts or identifiers retained."));

    private static PlatformDbContext Context() => new(
        new DbContextOptionsBuilder<PlatformDbContext>()
            .UseNpgsql("Host=localhost;Database=model_only;Username=model_only")
            .Options);
}
