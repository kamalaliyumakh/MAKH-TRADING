using MAKH.Application.Market;
using MAKH.Infrastructure.Persistence;
using MAKH.Infrastructure.Persistence.Scanner;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace MAKH.Infrastructure.Market;

public sealed class PostgresScannerRunRepository(PlatformDbContext context) : IScannerRunRepository
{
    public ScannerRun? Find(Guid runId, Guid accountId)
    {
        if (runId == Guid.Empty) throw new ArgumentException("Run ID is required.", nameof(runId));
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        return context.ScannerRuns.AsNoTracking()
            .Include(run => run.Candidates)
            .SingleOrDefault(run => run.Id == runId && run.AccountId == accountId)
            ?.ToModel();
    }

    public ScannerRun? FindLatest(Guid accountId)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        return context.ScannerRuns.AsNoTracking()
            .Include(run => run.Candidates)
            .Where(run => run.AccountId == accountId && run.StreamSequence != null)
            .OrderByDescending(run => run.StreamSequence)
            .FirstOrDefault()
            ?.ToModel();
    }

    public void Add(ScannerRun run)
    {
        ArgumentNullException.ThrowIfNull(run);
        if (run.AccountId is null || run.AccountId == Guid.Empty)
            throw new ArgumentException("Scanner run account binding is required.", nameof(run));
        if (run.StreamSequence is not null)
            throw new ArgumentException("Scanner stream sequence must be assigned by persistence.", nameof(run));
        if (run.SupersedesRunId is null && !string.IsNullOrWhiteSpace(run.CorrectionReason))
            throw new ArgumentException("A correction reason requires a superseded run.", nameof(run));
        if (run.SupersedesRunId is not null && string.IsNullOrWhiteSpace(run.CorrectionReason))
            throw new ArgumentException("A correction requires a reason.", nameof(run));
        if (run.CorrectionReason?.Trim().Length > 500)
            throw new ArgumentException("Correction reason cannot exceed 500 characters.", nameof(run));
        if (context.ScannerRuns.Any(existing => existing.Id == run.Id))
            throw new InvalidOperationException("Scanner run already exists and is immutable.");

        using var transaction = context.Database.BeginTransaction();
        using var command = context.Database.GetDbConnection().CreateCommand();
        command.Transaction = transaction.GetDbTransaction();
        command.CommandText = """
            INSERT INTO scanner.account_streams (account_id, last_sequence)
            VALUES (@accountId, 1)
            ON CONFLICT (account_id) DO UPDATE
            SET last_sequence = scanner.account_streams.last_sequence + 1
            RETURNING last_sequence;
            """;
        var accountParameter = command.CreateParameter();
        accountParameter.ParameterName = "accountId";
        accountParameter.Value = run.AccountId.Value;
        command.Parameters.Add(accountParameter);
        var sequence = command.ExecuteScalar() is long assignedSequence
            ? assignedSequence
            : throw new InvalidOperationException("Scanner stream sequence was not assigned.");
        if (sequence <= 0) throw new InvalidOperationException("Scanner stream sequence was not assigned.");

        var latest = context.ScannerRuns.AsNoTracking()
            .Include(existing => existing.Candidates)
            .Where(existing => existing.AccountId == run.AccountId && existing.StreamSequence != null)
            .OrderByDescending(existing => existing.StreamSequence)
            .FirstOrDefault()
            ?.ToModel();
        if (run.SupersedesRunId is not null && latest?.Id != run.SupersedesRunId)
            throw new InvalidOperationException("A correction may supersede only the latest sequenced run for its account.");

        var sequencedRun = run with
        {
            StreamSequence = sequence,
            CorrectionReason = run.CorrectionReason?.Trim(),
        };
        context.ScannerRuns.Add(new ScannerRunRecord(sequencedRun));
        context.OutboxMessages.Add(ScannerOutboxMessageFactory.Create(
            sequencedRun,
            sequencedRun.SupersedesRunId is null ? null : latest));
        context.SaveChanges();
        transaction.Commit();
    }
}
