using System.Text.Json;
using MAKH.Application.Market;
using MAKH.Infrastructure.Market;
using MAKH.Infrastructure.Persistence;
using MAKH.Infrastructure.Persistence.Scanner;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class ScannerPersistenceTests
{
    private static readonly DateTimeOffset AsOf = new(2026, 9, 11, 14, 30, 0, TimeSpan.Zero);

    [Fact]
    public void PersistenceRecordRoundTripsImmutableRunAndCandidates()
    {
        var run = Run() with
        {
            AccountId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            StreamSequence = 12,
            SupersedesRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            CorrectionReason = "Vendor corrected the source snapshot.",
        };

        var restored = new ScannerRunRecord(run).ToModel();

        Assert.Equal(run.Id, restored.Id);
        Assert.Equal(run.AccountId, restored.AccountId);
        Assert.Equal(run.StreamSequence, restored.StreamSequence);
        Assert.Equal(run.SupersedesRunId, restored.SupersedesRunId);
        Assert.Equal(run.CorrectionReason, restored.CorrectionReason);
        Assert.Equal(run.PresetVersionKey, restored.PresetVersionKey);
        Assert.Equal(run.AsOf, restored.AsOf);
        Assert.Equal(run.InputSnapshotHash, restored.InputSnapshotHash);
        Assert.Equal(run.DataQuality, restored.DataQuality);
        Assert.Equal(run.Candidates, restored.Candidates);
        Assert.False(ScannerRun.CreatesOrderAuthority);
        Assert.False(ScannerCandidate.CreatesOrderAuthority);
    }

    [Fact]
    public void SnapshotHashMustBeCanonicalSha256Hex()
    {
        var invalid = Run() with { InputSnapshotHash = "not-a-hash" };

        Assert.Throws<ArgumentException>(() => new ScannerRunRecord(invalid));
    }

    [Fact]
    public void RepositoryRejectsUnboundAndCallerSequencedRunsBeforeDatabaseAccess()
    {
        using var context = Context();
        var repository = new PostgresScannerRunRepository(context);

        Assert.Throws<ArgumentException>(() => repository.Add(Run()));
        Assert.Throws<ArgumentException>(() => repository.Add(Run() with
        {
            AccountId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            StreamSequence = 1,
        }));
    }

    [Fact]
    public void ScannerOutboxMessageCarriesRecoveryDeltaWithoutTradingAuthority()
    {
        var run = Run() with
        {
            AccountId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            StreamSequence = 12,
        };

        var message = ScannerOutboxMessageFactory.Create(run);
        using var payload = JsonDocument.Parse(message.Payload);

        Assert.Equal("scanner.updated", message.EventType);
        Assert.Equal(run.AccountId, message.AccountId);
        Assert.Equal(run.Id, message.AggregateId);
        Assert.Equal(12, message.StreamSequence);
        Assert.Equal(run.Id, payload.RootElement.GetProperty("runId").GetGuid());
        Assert.Equal(2, payload.RootElement.GetProperty("upserts").GetArrayLength());
        Assert.Equal(run.Candidates[0].SecurityId,
            payload.RootElement.GetProperty("upserts")[0].GetProperty("securityId").GetGuid());
        Assert.False(payload.RootElement.GetProperty("upserts")[0].TryGetProperty("SecurityId", out _));
        Assert.Equal(0, payload.RootElement.GetProperty("removals").GetArrayLength());
        Assert.DoesNotContain("order", message.Payload, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("broker", message.Payload, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CorrectionOutboxCarriesLineageAndDeterministicRemovalsWithoutMutatingHistory()
    {
        var accountId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var previous = Run() with { AccountId = accountId, StreamSequence = 11 };
        var corrected = Run() with
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            AccountId = accountId,
            StreamSequence = 12,
            SupersedesRunId = previous.Id,
            CorrectionReason = "Vendor corrected the source snapshot.",
            Candidates = [previous.Candidates[0]],
        };

        var message = ScannerOutboxMessageFactory.Create(corrected, previous);
        using var payload = JsonDocument.Parse(message.Payload);

        Assert.Equal(previous.Id, payload.RootElement.GetProperty("supersedesRunId").GetGuid());
        Assert.Equal(corrected.CorrectionReason, payload.RootElement.GetProperty("correctionReason").GetString());
        Assert.Equal(previous.Candidates[1].SecurityId,
            payload.RootElement.GetProperty("removals")[0].GetGuid());
        Assert.Equal(2, previous.Candidates.Count);
        Assert.DoesNotContain("order", message.Payload, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("broker", message.Payload, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void CorrectionOutboxRejectsMissingOrCrossAccountLineage()
    {
        var accountId = Guid.Parse("00000000-0000-0000-0000-000000000001");
        var previous = Run() with { AccountId = accountId, StreamSequence = 11 };
        var corrected = Run() with
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            AccountId = accountId,
            StreamSequence = 12,
            SupersedesRunId = previous.Id,
            CorrectionReason = "Correction",
        };

        Assert.Throws<ArgumentException>(() => ScannerOutboxMessageFactory.Create(corrected));
        Assert.Throws<ArgumentException>(() => ScannerOutboxMessageFactory.Create(corrected,
            previous with { AccountId = Guid.Parse("99999999-9999-9999-9999-999999999999") }));
    }

    [Fact]
    public void EfModelMapsScannerTablesAndFailClosedConstraints()
    {
        using var context = Context();
        var model = context.GetService<IDesignTimeModel>().Model;
        var runs = model.FindEntityType(typeof(ScannerRunRecord))!;
        var candidates = model.FindEntityType(typeof(ScannerCandidateRecord))!;
        var stream = model.FindEntityType(typeof(ScannerAccountStreamRecord))!;
        var outbox = model.FindEntityType(typeof(OutboxMessageRecord))!;

        AssertTable(runs, DatabaseSchemas.Scanner, "runs");
        AssertTable(stream, DatabaseSchemas.Scanner, "account_streams");
        AssertTable(outbox, DatabaseSchemas.Platform, "outbox_messages");
        Assert.Contains(stream.GetCheckConstraints(), constraint => constraint.Name == "ck_scanner_account_streams_last_sequence");
        Assert.Contains(runs.GetForeignKeys(), key => key.Properties.Single().Name == "AccountId"
            && key.DeleteBehavior == DeleteBehavior.Restrict);
        Assert.Contains(runs.GetIndexes(), index => index.Properties.Select(property => property.Name)
            .SequenceEqual(["AccountId", "Id"]));
        Assert.Contains(runs.GetIndexes(), index => index.IsUnique
            && index.Properties.Select(property => property.Name).SequenceEqual(["AccountId", "StreamSequence"]));
        Assert.Contains(outbox.GetIndexes(), index => index.IsUnique
            && index.Properties.Select(property => property.Name)
                .SequenceEqual(["AccountId", "EventType", "StreamSequence"]));
        Assert.Contains(outbox.GetCheckConstraints(), constraint => constraint.Name == "ck_outbox_messages_stream_sequence");
        AssertTable(candidates, DatabaseSchemas.Scanner, "run_candidates");
        Assert.Contains(runs.GetCheckConstraints(), constraint => constraint.Name == "ck_scanner_runs_snapshot_hash");
        Assert.Contains(runs.GetCheckConstraints(), constraint => constraint.Name == "ck_scanner_runs_correction_lineage");
        Assert.Contains(runs.GetIndexes(), index => index.IsUnique
            && index.Properties.Select(property => property.Name).SequenceEqual(["SupersedesRunId"]));
        Assert.Contains(runs.GetForeignKeys(), key => key.Properties.Single().Name == "SupersedesRunId"
            && key.DeleteBehavior == DeleteBehavior.Restrict);
        Assert.Contains(candidates.GetCheckConstraints(), constraint => constraint.Name == "ck_scanner_candidates_qualified_rank");
        Assert.Contains(candidates.GetIndexes(), index => index.IsUnique
            && index.Properties.Select(property => property.Name).SequenceEqual(["RunId", "Rank"]));
        Assert.Equal(DeleteBehavior.Restrict, candidates.GetForeignKeys().Single().DeleteBehavior);
    }

    private static ScannerRun Run() => new(
        Guid.Parse("11111111-1111-1111-1111-111111111111"),
        "dddddddddddddddddddddddddddddddd:1",
        AsOf,
        new string('a', 64),
        ScannerDataQuality.Partial,
        [
            new(Guid.Parse("22222222-2222-2222-2222-222222222222"), "TRKA", 1, true, true,
                4.72m, 98.21m, 8.4m, 420_000, 1.2m, 1_982_400m, string.Empty),
            new(Guid.Parse("33333333-3333-3333-3333-333333333333"), "NOPE", null, false, false,
                8.50m, 20m, 1.1m, 800_000, 3m, 40_000m, "Price is outside the preset range."),
        ]);

    private static PlatformDbContext Context()
    {
        var options = new DbContextOptionsBuilder<PlatformDbContext>()
            .UseNpgsql("Host=localhost;Database=model_only;Username=model_only")
            .Options;
        return new PlatformDbContext(options);
    }

    private static void AssertTable(IEntityType entity, string schema, string table)
    {
        Assert.Equal(schema, entity.GetSchema());
        Assert.Equal(table, entity.GetTableName());
    }
}
