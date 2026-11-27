using MAKH.Application.Recovery;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class RecoveryExerciseEvaluatorTests
{
    private static readonly DateTimeOffset Start = new(2026, 8, 13, 18, 0, 0, TimeSpan.Zero);

    [Fact] public void UnauthorizedExerciseIsNotExecutedAndBlocksPromotion() { var result = Evaluate(Evidence(), false); Assert.Equal(RecoveryExerciseOutcome.NotExecuted, result.Outcome); Assert.True(result.PromotionBlocked); }
    [Fact] public void CompletePitrExercisePassesTargets() { var result = Evaluate(Evidence()); Assert.Equal(RecoveryExerciseOutcome.Passed, result.Outcome); Assert.Equal(TimeSpan.FromMinutes(3), result.MeasuredRpo); Assert.Equal(TimeSpan.FromMinutes(45), result.MeasuredRto); }
    [Fact] public void RpoOverTargetFails() { var result = Evaluate(Evidence(lastDurable: Start.AddMinutes(-10))); Assert.Equal(RecoveryExerciseOutcome.Failed, result.Outcome); Assert.Contains(result.Failures, x => x.Contains("RPO", StringComparison.Ordinal)); }
    [Fact] public void RtoOverTargetFails() { var result = Evaluate(Evidence(completed: Start.AddMinutes(61))); Assert.Contains(result.Failures, x => x.Contains("RTO", StringComparison.Ordinal)); }
    [Fact] public void MissingRecoveryPointFailsRestore() { var result = Evaluate(Evidence(missingRequested: true)); Assert.Contains(result.Failures, x => x.Contains("Recovery-point", StringComparison.Ordinal)); }
    [Fact] public void DependencyExerciseDoesNotRequireRecoveryPoint() { var result = Evaluate(Evidence(type: RecoveryExerciseType.DependencyFailure, requested: null, lastDurable: null)); Assert.Equal(RecoveryExerciseOutcome.Passed, result.Outcome); Assert.Null(result.MeasuredRpo); }
    [Fact] public void MissingEntryLockFails() => AssertFailure(Evidence(entryLocked: false), "Entry lock");
    [Fact] public void NonIsolatedTargetFails() => AssertFailure(Evidence(isolated: false), "isolated");
    [Fact] public void SourceOverwriteRiskFails() => AssertFailure(Evidence(sourcePreserved: false), "Source preservation");
    [Fact] public void ChecksumFailureFails() => AssertFailure(Evidence(checksum: false), "checksum");
    [Fact] public void MigrationFailureFails() => AssertFailure(Evidence(migrations: false), "Migration");
    [Fact] public void AuthorizationFailureFails() => AssertFailure(Evidence(authorization: false), "Authorization");
    [Fact] public void TelemetryFailureFails() => AssertFailure(Evidence(telemetry: false), "Telemetry");
    [Fact] public void ReconciliationMismatchFails() => AssertFailure(Evidence(reconciliation: false), "reconciliation");
    [Fact] public void EvidenceHashIsDeterministic() => Assert.Equal(Evaluate(Evidence()).EvidenceSha256, Evaluate(Evidence()).EvidenceSha256);
    [Fact] public void ResultCannotClearLockOrCreateLiveAuthority() { Assert.False(RecoveryExerciseResult.ClearsEntryLock); Assert.False(RecoveryExerciseResult.CreatesLiveAuthority); }
    [Fact] public void SecretAndAddressEvidenceRejected() { Assert.Throws<ArgumentException>(() => Evidence(artifact: "secret-value")); Assert.Throws<ArgumentException>(() => Evidence(artifact: "person@example.com")); }
    [Fact] public void UndefinedExerciseTypeRejected() => Assert.Throws<ArgumentOutOfRangeException>(() => Evidence(type: (RecoveryExerciseType)99));
    [Fact] public void ZeroDurationEvidenceRejected() => Assert.Throws<ArgumentException>(() => Evidence(completed: Start));
    [Theory]
    [InlineData("abc")]
    [InlineData("gggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggggg")]
    public void MalformedArtifactDigestRejected(string digest) => Assert.Throws<ArgumentException>(() => Evidence(artifact: digest));
    [Fact] public void ArtifactDigestIsCanonicalized() { var evidence = Evidence(artifact: "ABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCDEFABCD"); Assert.Equal("abcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcdefabcd", evidence.ArtifactDigest); }

    private static RecoveryExerciseResult Evaluate(RecoveryExerciseEvidence evidence, bool authorized = true) => RecoveryExerciseEvaluator.Evaluate(evidence, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(60), authorized);
    private static void AssertFailure(RecoveryExerciseEvidence evidence, string text) { var result = Evaluate(evidence); Assert.Equal(RecoveryExerciseOutcome.Failed, result.Outcome); Assert.Contains(result.Failures, x => x.Contains(text, StringComparison.OrdinalIgnoreCase)); }
    private static RecoveryExerciseEvidence Evidence(RecoveryExerciseType type = RecoveryExerciseType.PointInTimeRestore,
        DateTimeOffset? completed = null, DateTimeOffset? requested = default, DateTimeOffset? lastDurable = default,
        bool entryLocked = true, bool isolated = true, bool checksum = true, bool migrations = true,
        bool authorization = true, bool telemetry = true, bool reconciliation = true, bool sourcePreserved = true,
        string artifact = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", bool missingRequested = false) => new(Guid.Parse("10000000-0000-0000-0000-000000000001"), type, "synthetic-test",
            Start, completed ?? Start.AddMinutes(45), missingRequested ? null : requested == default ? Start.AddMinutes(-1) : requested,
            lastDurable == default ? Start.AddMinutes(-4) : lastDurable, entryLocked, isolated, checksum, migrations,
            authorization, telemetry, reconciliation, sourcePreserved, artifact, "INC-SYNTHETIC-001");
}
