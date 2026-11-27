using System.Text.Json;
using MAKH.Application.Market;
using MAKH.Infrastructure.Persistence;

namespace MAKH.Infrastructure.Market;

public static class ScannerOutboxMessageFactory
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public static OutboxMessageRecord Create(ScannerRun run, ScannerRun? supersededRun = null)
    {
        ArgumentNullException.ThrowIfNull(run);
        if (run.AccountId is null || run.AccountId == Guid.Empty)
            throw new ArgumentException("Scanner run account binding is required.", nameof(run));
        if (run.StreamSequence is null or <= 0)
            throw new ArgumentException("Scanner run sequence is required.", nameof(run));
        if (run.SupersedesRunId is null && supersededRun is not null)
            throw new ArgumentException("A superseded run requires correction lineage.", nameof(supersededRun));
        if (run.SupersedesRunId is not null && (supersededRun is null || supersededRun.Id != run.SupersedesRunId))
            throw new ArgumentException("The supplied superseded run does not match correction lineage.", nameof(supersededRun));
        if (supersededRun is not null && supersededRun.AccountId != run.AccountId)
            throw new ArgumentException("Correction lineage must remain within one account.", nameof(supersededRun));

        var removals = supersededRun?.Candidates
            .Select(candidate => candidate.SecurityId)
            .Except(run.Candidates.Select(candidate => candidate.SecurityId))
            .Order()
            .ToArray() ?? [];

        var payload = JsonSerializer.Serialize(new
        {
            scannerVersion = run.PresetVersionKey,
            runId = run.Id,
            supersedesRunId = run.SupersedesRunId,
            correctionReason = run.CorrectionReason,
            asOf = run.AsOf,
            upserts = run.Candidates,
            removals,
        }, SerializerOptions);
        return new OutboxMessageRecord(
            Guid.NewGuid(), run.AccountId.Value, run.Id, "scanner.updated", 1,
            run.StreamSequence.Value, run.AsOf, payload);
    }
}
