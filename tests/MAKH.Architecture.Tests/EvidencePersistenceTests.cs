using System.Text.Json;
using MAKH.Application.Evidence;
using MAKH.Infrastructure.Evidence;
using MAKH.Infrastructure.Persistence;
using MAKH.Infrastructure.Persistence.Evidence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class EvidencePersistenceTests
{
    private static readonly Guid SecurityId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly DateTimeOffset PublishedAt = new(2026, 9, 30, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void PersistenceRecordRoundTripsImmutableEvidenceAndHash()
    {
        var document = Document("record-1", version: 2, supersedesRecordId: "record-0");
        var record = new EvidenceDocumentRecord(document);

        Assert.Equal(document, record.ToModel());
        Assert.Equal(64, record.ContentSha256.Length);
        Assert.Equal(record.ContentSha256, EvidenceDocumentRecord.ComputeContentHash(document));
    }

    [Fact]
    public void ContentHashIsStableAndCoversDeletionState()
    {
        var active = Document("record-1");
        var replay = Document("record-1");
        var deletion = Document("record-1", isDeleted: true);

        Assert.Equal(EvidenceDocumentRecord.ComputeContentHash(active), EvidenceDocumentRecord.ComputeContentHash(replay));
        Assert.NotEqual(EvidenceDocumentRecord.ComputeContentHash(active), EvidenceDocumentRecord.ComputeContentHash(deletion));
    }

    [Fact]
    public void ReplayPlanIsIdempotentForIdenticalProviderVersion()
    {
        var document = Document("record-1");
        var plan = EvidenceReplayPlan.Create([new EvidenceDocumentRecord(document)], [document]);

        Assert.Empty(plan.Inserts);
        Assert.Equal(1, plan.ReplayCount);
    }

    [Fact]
    public void ReplayPlanRejectsChangedContentAtExistingProviderVersion()
    {
        var existing = new EvidenceDocumentRecord(Document("record-1"));
        var changed = Document("record-1", headline: "Changed without a version increment");

        Assert.Throws<InvalidOperationException>(() => EvidenceReplayPlan.Create([existing], [changed]));
    }

    [Fact]
    public void ReplayPlanDeduplicatesIdenticalItemsWithinOneBatch()
    {
        var document = Document("record-1");
        var plan = EvidenceReplayPlan.Create([], [document, document]);

        Assert.Single(plan.Inserts);
        Assert.Equal(1, plan.ReplayCount);
    }

    [Fact]
    public void EfModelMapsEvidenceTableAndFailClosedConstraints()
    {
        using var context = Context();
        var model = context.GetService<IDesignTimeModel>().Model;
        var documents = model.FindEntityType(typeof(EvidenceDocumentRecord))!;

        Assert.Equal(DatabaseSchemas.Evidence, documents.GetSchema());
        Assert.Equal("documents", documents.GetTableName());
        Assert.Contains(documents.GetIndexes(), index => index.IsUnique && index.Properties
            .Select(property => property.Name).SequenceEqual(["Provider", "ProviderRecordId", "Version"]));
        Assert.Contains(documents.GetCheckConstraints(), constraint => constraint.Name == "ck_evidence_documents_content_hash");
        Assert.Contains(documents.GetCheckConstraints(), constraint => constraint.Name == "ck_evidence_documents_observation_time");
        Assert.Contains(documents.GetCheckConstraints(), constraint => constraint.Name == "ck_evidence_documents_deleted_excerpt");
    }

    [Fact]
    public void EvidenceOutboxCarriesMetadataAndHashWithoutLicensedContent()
    {
        var document = new EvidenceDocumentRecord(Document("record-1", headline: "Public headline"));
        var message = new EvidenceOutboxMessageRecord(document);
        using var payload = JsonDocument.Parse(message.Payload);

        Assert.Equal("evidence.updated", message.EventType);
        Assert.Equal(document.Id, message.EvidenceDocumentId);
        Assert.Equal(document.ContentSha256, payload.RootElement.GetProperty("contentSha256").GetString());
        Assert.False(payload.RootElement.TryGetProperty("headline", out _));
        Assert.False(payload.RootElement.TryGetProperty("excerpt", out _));
    }

    [Fact]
    public async Task EmptyBatchReturnsWithoutDatabaseAccess()
    {
        await using var context = Context();
        var result = await new PostgresEvidenceStore(context).SaveBatchAsync([]);

        Assert.Equal(new EvidenceIngestionResult(0, 0), result);
    }

    [Fact]
    public void EfModelMapsTransactionalEvidenceOutbox()
    {
        using var context = Context();
        var model = context.GetService<IDesignTimeModel>().Model;
        var outbox = model.FindEntityType(typeof(EvidenceOutboxMessageRecord))!;

        Assert.Equal(DatabaseSchemas.Evidence, outbox.GetSchema());
        Assert.Equal("outbox_messages", outbox.GetTableName());
        Assert.Contains(outbox.GetIndexes(), index => index.IsUnique && index.Properties
            .Select(property => property.Name).SequenceEqual(["EvidenceDocumentId"]));
        Assert.Contains(outbox.GetForeignKeys(), key => key.Properties.Single().Name == "EvidenceDocumentId"
            && key.DeleteBehavior == DeleteBehavior.Restrict);
        Assert.Contains(outbox.GetCheckConstraints(), constraint => constraint.Name == "ck_evidence_outbox_schema_version");
    }

    [Fact]
    public void SourceSnapshotRequiresCanonicalHashAndBoundedRetention()
    {
        Assert.Throws<ArgumentException>(() => Snapshot(payloadHash: "not-a-hash"));
        Assert.Throws<ArgumentOutOfRangeException>(() => Snapshot(retainUntil: PublishedAt.AddMinutes(1)));
        Assert.Throws<ArgumentOutOfRangeException>(() => Snapshot(retainUntil: PublishedAt.AddDays(3_651)));
    }

    [Fact]
    public void SourceSnapshotRecordRoundTripsImmutableManifest()
    {
        var snapshot = Snapshot();
        var record = new EvidenceSourceSnapshotRecord(Guid.NewGuid(), snapshot);

        Assert.Equal(snapshot, record.ToModel());
    }

    [Fact]
    public void EfModelMapsImmutableSourceSnapshotManifest()
    {
        using var context = Context();
        var model = context.GetService<IDesignTimeModel>().Model;
        var snapshots = model.FindEntityType(typeof(EvidenceSourceSnapshotRecord))!;

        Assert.Equal(DatabaseSchemas.Evidence, snapshots.GetSchema());
        Assert.Equal("source_snapshots", snapshots.GetTableName());
        Assert.Contains(snapshots.GetCheckConstraints(), constraint => constraint.Name == "ck_evidence_snapshots_payload_hash");
        Assert.Contains(snapshots.GetCheckConstraints(), constraint => constraint.Name == "ck_evidence_snapshots_byte_count");
        Assert.Contains(snapshots.GetCheckConstraints(), constraint => constraint.Name == "ck_evidence_snapshots_retention");
        Assert.Equal(DeleteBehavior.Restrict, snapshots.GetForeignKeys().Single().DeleteBehavior);
    }

    [Fact]
    public void CombinedSnapshotRecordRoundTripsOrderedItemsAndManifest()
    {
        var snapshot = CombinedSnapshot();
        var record = new EvidenceSnapshotRecord(snapshot);
        var roundTrip = record.ToModel();

        Assert.Equal(snapshot.AsOf, roundTrip.AsOf);
        Assert.Equal(snapshot.SchemaVersion, roundTrip.SchemaVersion);
        Assert.Equal(snapshot.ManifestSha256, roundTrip.ManifestSha256);
        Assert.Equal(snapshot.Items, roundTrip.Items);
        Assert.Equal(snapshot.Items.Count, record.ItemCount);
        Assert.DoesNotContain("CanVerifyCatalyst\":true", record.ItemsJson, StringComparison.Ordinal);
    }

    [Fact]
    public void EfModelMapsReplaySafeCombinedSnapshots()
    {
        using var context = Context();
        var model = context.GetService<IDesignTimeModel>().Model;
        var snapshots = model.FindEntityType(typeof(EvidenceSnapshotRecord))!;

        Assert.Equal(DatabaseSchemas.Evidence, snapshots.GetSchema());
        Assert.Equal("combined_snapshots", snapshots.GetTableName());
        Assert.Contains(snapshots.GetIndexes(), index => index.IsUnique
            && index.Properties.Single().Name == "AsOf");
        Assert.Contains(snapshots.GetIndexes(), index => index.IsUnique
            && index.Properties.Single().Name == "ManifestSha256");
        Assert.Contains(snapshots.GetCheckConstraints(), constraint =>
            constraint.Name == "ck_evidence_combined_snapshots_hash");
        Assert.Contains(snapshots.GetCheckConstraints(), constraint =>
            constraint.Name == "ck_evidence_combined_snapshots_items");
    }

    private static EvidenceDocument Document(
        string recordId,
        int version = 1,
        string headline = "Synthetic headline",
        string? supersedesRecordId = null,
        bool isDeleted = false) => new(
            SecurityId,
            EvidenceSourceKind.News,
            headline,
            "Synthetic publisher",
            null,
            null,
            EvidenceTrustState.PublisherAttributed,
            new EvidenceProvenance(
                "synthetic-evidence",
                recordId,
                new Uri($"https://example.test/{recordId}"),
                PublishedAt,
                PublishedAt.AddMinutes(1),
                version,
                EvidenceContentRight.MetadataOnly,
                supersedesRecordId),
            isDeleted);

    private static PlatformDbContext Context()
    {
        var options = new DbContextOptionsBuilder<PlatformDbContext>()
            .UseNpgsql("Host=localhost;Database=model_only;Username=model_only")
            .Options;
        return new PlatformDbContext(options);
    }

    private static EvidenceSourceSnapshot Snapshot(
        string? payloadHash = null,
        DateTimeOffset? retainUntil = null) => new(
            payloadHash ?? new string('a', 64),
            128,
            "text/plain",
            "synthetic-scanner/1",
            PublishedAt.AddMinutes(1),
            retainUntil ?? PublishedAt.AddDays(30));

    private static EvidenceSnapshot CombinedSnapshot() => EvidenceService.BuildSnapshot(
        [Document("record-1")],
        [],
        PublishedAt.AddMinutes(2),
        TimeSpan.FromMinutes(10));
}
