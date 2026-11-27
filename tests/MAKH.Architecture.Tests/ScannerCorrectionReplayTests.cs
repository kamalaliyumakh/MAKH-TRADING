using System.Globalization;
using System.Text.Json;
using MAKH.Application.Market;
using MAKH.Infrastructure.Market;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class ScannerCorrectionReplayTests
{
    private const int AccountCount = 100;
    private const int RunsPerAccount = 20;
    private static readonly DateTimeOffset StartedAt = new(2026, 9, 17, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ReorderedCorrectionReplayReconstructsEveryAccountSnapshotDeterministically()
    {
        var events = new List<ReplayEvent>(AccountCount * RunsPerAccount);
        var expected = new Dictionary<Guid, HashSet<Guid>>();
        for (var account = 1; account <= AccountCount; account++)
        {
            var accountId = Id(account, 0, 1);
            ScannerRun? previous = null;
            for (var sequence = 1; sequence <= RunsPerAccount; sequence++)
            {
                var run = Run(accountId, account, sequence, previous);
                var message = ScannerOutboxMessageFactory.Create(run, previous);
                events.Add(new(accountId, sequence, message.Payload));
                expected[accountId] = run.Candidates.Select(candidate => candidate.SecurityId).ToHashSet();
                previous = run;
            }
        }

        var reorderedWithRetries = events
            .OrderBy(item => StableShuffleKey(item.AccountId, item.Sequence))
            .Concat(events.Where(item => item.Sequence % 7 == 0))
            .ToArray();
        var replay = new CorrectionReplayProjection();
        foreach (var item in reorderedWithRetries) replay.Accept(item);

        Assert.Equal(AccountCount * RunsPerAccount, replay.AppliedCount);
        Assert.Equal(AccountCount * (RunsPerAccount / 7), replay.DuplicateCount);
        Assert.Equal(0, replay.LineageViolations);
        foreach (var (accountId, securities) in expected)
            Assert.True(securities.SetEquals(replay.Securities(accountId)));
    }

    private static ScannerRun Run(Guid accountId, int account, int sequence, ScannerRun? previous)
    {
        var retained = Candidate(Id(account, 1, 1), $"A{account:000}", 1);
        var rotating = Candidate(Id(account, sequence % 5 + 2, 1), $"R{sequence:00}", 2);
        return new(
            Id(account, sequence, 2),
            "dddddddddddddddddddddddddddddddd:1",
            StartedAt.AddSeconds(sequence),
            sequence.ToString("x64", CultureInfo.InvariantCulture),
            ScannerDataQuality.Complete,
            [retained, rotating])
        {
            AccountId = accountId,
            StreamSequence = sequence,
            SupersedesRunId = previous?.Id,
            CorrectionReason = previous is null ? null : $"Synthetic correction {sequence}",
        };
    }

    private static ScannerCandidate Candidate(Guid securityId, string symbol, int rank) =>
        new(securityId, symbol, rank, true, false, 4m, 150m, 4m, 300_000, 1m, 1_200_000m, string.Empty);

    private static Guid Id(int account, int value, int suffix) =>
        Guid.Parse($"{account:x8}-{value:x4}-{suffix:x4}-0000-000000000001");

    private static int StableShuffleKey(Guid accountId, long sequence) =>
        HashCode.Combine(accountId, sequence * 7919 % 97);

    private sealed record ReplayEvent(Guid AccountId, long Sequence, string Payload);

    private sealed class CorrectionReplayProjection
    {
        private readonly Dictionary<Guid, SortedDictionary<long, ReplayEvent>> pending = [];
        private readonly Dictionary<Guid, AccountState> states = [];
        private int duplicates;
        private int lineageViolations;

        public int AppliedCount => states.Values.Sum(state => (int)state.Sequence);
        public int DuplicateCount => duplicates;
        public int LineageViolations => lineageViolations;
        public HashSet<Guid> Securities(Guid accountId) => states[accountId].Securities;

        public void Accept(ReplayEvent item)
        {
            var state = states.GetValueOrDefault(item.AccountId) ?? new AccountState();
            states[item.AccountId] = state;
            if (item.Sequence <= state.Sequence || pending.GetValueOrDefault(item.AccountId)?.ContainsKey(item.Sequence) == true)
            {
                duplicates++;
                return;
            }

            var accountPending = pending.GetValueOrDefault(item.AccountId) ?? [];
            pending[item.AccountId] = accountPending;
            accountPending[item.Sequence] = item;
            while (accountPending.Remove(state.Sequence + 1, out var next)) Apply(state, next);
        }

        private void Apply(AccountState state, ReplayEvent item)
        {
            using var document = JsonDocument.Parse(item.Payload);
            var payload = document.RootElement;
            var runId = payload.GetProperty("runId").GetGuid();
            var supersedes = payload.GetProperty("supersedesRunId");
            if (state.Sequence == 0 ? supersedes.ValueKind != JsonValueKind.Null : supersedes.GetGuid() != state.RunId)
                lineageViolations++;
            foreach (var removal in payload.GetProperty("removals").EnumerateArray())
                state.Securities.Remove(removal.GetGuid());
            foreach (var upsert in payload.GetProperty("upserts").EnumerateArray())
                state.Securities.Add(upsert.GetProperty("securityId").GetGuid());
            state.RunId = runId;
            state.Sequence = item.Sequence;
        }

        private sealed class AccountState
        {
            public long Sequence { get; set; }
            public Guid RunId { get; set; }
            public HashSet<Guid> Securities { get; } = [];
        }
    }
}
