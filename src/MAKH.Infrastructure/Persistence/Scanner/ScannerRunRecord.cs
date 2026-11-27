using MAKH.Application.Market;

namespace MAKH.Infrastructure.Persistence.Scanner;

public sealed class ScannerRunRecord
{
    private ScannerRunRecord() { }

    public ScannerRunRecord(ScannerRun run)
    {
        ArgumentNullException.ThrowIfNull(run);
        if (run.Id == Guid.Empty) throw new ArgumentException("Run ID is required.", nameof(run));
        if (run.InputSnapshotHash.Length != 64) throw new ArgumentException("Snapshot hash must be SHA-256 hex.", nameof(run));

        Id = run.Id;
        AccountId = run.AccountId;
        StreamSequence = run.StreamSequence;
        SupersedesRunId = run.SupersedesRunId;
        CorrectionReason = run.CorrectionReason;
        PresetVersionKey = run.PresetVersionKey;
        AsOf = run.AsOf;
        InputSnapshotHash = run.InputSnapshotHash.ToLowerInvariant();
        DataQuality = run.DataQuality;
        Candidates = run.Candidates.Select(candidate => new ScannerCandidateRecord(run.Id, candidate)).ToList();
    }

    public Guid Id { get; private set; }
    public Guid? AccountId { get; private set; }
    public long? StreamSequence { get; private set; }
    public Guid? SupersedesRunId { get; private set; }
    public string? CorrectionReason { get; private set; }
    public string PresetVersionKey { get; private set; } = string.Empty;
    public DateTimeOffset AsOf { get; private set; }
    public string InputSnapshotHash { get; private set; } = string.Empty;
    public ScannerDataQuality DataQuality { get; private set; }
    public List<ScannerCandidateRecord> Candidates { get; private set; } = [];

    public ScannerRun ToModel() => new(
        Id,
        PresetVersionKey,
        AsOf,
        InputSnapshotHash,
        DataQuality,
        Candidates.OrderBy(candidate => candidate.Rank is null)
            .ThenBy(candidate => candidate.Rank)
            .ThenBy(candidate => candidate.Symbol, StringComparer.Ordinal)
            .Select(candidate => candidate.ToModel())
            .ToArray())
    {
        AccountId = AccountId,
        StreamSequence = StreamSequence,
        SupersedesRunId = SupersedesRunId,
        CorrectionReason = CorrectionReason,
    };
}

public sealed class ScannerCandidateRecord
{
    private ScannerCandidateRecord() { }

    public ScannerCandidateRecord(Guid runId, ScannerCandidate candidate)
    {
        if (runId == Guid.Empty) throw new ArgumentException("Run ID is required.", nameof(runId));
        ArgumentNullException.ThrowIfNull(candidate);
        RunId = runId;
        SecurityId = candidate.SecurityId;
        Symbol = candidate.Symbol;
        Rank = candidate.Rank;
        Qualified = candidate.Qualified;
        ExtremeMoveRisk = candidate.ExtremeMoveRisk;
        Price = candidate.Price;
        GainPercent = candidate.GainPercent;
        RelativeVolume = candidate.RelativeVolume;
        PublicFloat = candidate.PublicFloat;
        SpreadPercent = candidate.SpreadPercent;
        DollarVolume = candidate.DollarVolume;
        ExclusionReason = candidate.ExclusionReason;
    }

    public Guid RunId { get; private set; }
    public Guid SecurityId { get; private set; }
    public string Symbol { get; private set; } = string.Empty;
    public int? Rank { get; private set; }
    public bool Qualified { get; private set; }
    public bool ExtremeMoveRisk { get; private set; }
    public decimal? Price { get; private set; }
    public decimal? GainPercent { get; private set; }
    public decimal? RelativeVolume { get; private set; }
    public long? PublicFloat { get; private set; }
    public decimal? SpreadPercent { get; private set; }
    public decimal? DollarVolume { get; private set; }
    public string ExclusionReason { get; private set; } = string.Empty;
    public ScannerRunRecord Run { get; private set; } = null!;

    public ScannerCandidate ToModel() => new(
        SecurityId, Symbol, Rank, Qualified, ExtremeMoveRisk, Price, GainPercent,
        RelativeVolume, PublicFloat, SpreadPercent, DollarVolume, ExclusionReason);
}
