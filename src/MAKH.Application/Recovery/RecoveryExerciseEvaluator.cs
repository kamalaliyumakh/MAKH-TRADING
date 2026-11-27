using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace MAKH.Application.Recovery;

public static class RecoveryExerciseEvaluator
{
    public static RecoveryExerciseResult Evaluate(RecoveryExerciseEvidence evidence,
        TimeSpan targetRpo, TimeSpan targetRto, bool executionAuthorized)
    {
        ArgumentNullException.ThrowIfNull(evidence);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(targetRpo, TimeSpan.Zero);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(targetRto, TimeSpan.Zero);
        if (!Enum.IsDefined(evidence.Type)) throw new ArgumentOutOfRangeException(nameof(evidence), "Recovery exercise type is undefined.");
        RequireUtc(evidence.StartedAt, nameof(evidence.StartedAt));
        RequireUtc(evidence.CompletedAt, nameof(evidence.CompletedAt));
        if (evidence.CompletedAt <= evidence.StartedAt) throw new ArgumentException("Recovery exercise completion must follow its start.", nameof(evidence));
        if (evidence.RequestedRecoveryPoint is { } requested) RequireUtc(requested, nameof(evidence.RequestedRecoveryPoint));
        if (evidence.LastDurableTransaction is { } durable) RequireUtc(durable, nameof(evidence.LastDurableTransaction));
        var restoreExercise = evidence.Type is RecoveryExerciseType.PointInTimeRestore or RecoveryExerciseType.LogicalRestore;
        if (!restoreExercise && (evidence.RequestedRecoveryPoint is not null || evidence.LastDurableTransaction is not null))
            throw new ArgumentException("Recovery-point evidence is only valid for restore exercises.", nameof(evidence));
        if (!executionAuthorized)
            return new(evidence.ExerciseId, evidence.Type, RecoveryExerciseOutcome.NotExecuted, null,
                TimeSpan.Zero, true, ["Exercise execution was not authorized."], Hash(evidence, targetRpo, targetRto, executionAuthorized));

        var failures = new List<string>();
        if (!evidence.EntryLocked) failures.Add("Entry lock was not proven.");
        if (!evidence.IsolatedTarget) failures.Add("Restore target was not isolated.");
        if (!evidence.SourcePreserved) failures.Add("Source preservation was not proven.");
        if (!evidence.ChecksumVerified) failures.Add("Backup or restored-data checksum was not verified.");
        if (!evidence.MigrationsVerified) failures.Add("Migration history and schema invariants were not verified.");
        if (!evidence.AuthorizationVerified) failures.Add("Authorization controls were not verified.");
        if (!evidence.TelemetryVerified) failures.Add("Telemetry and alerting were not verified.");
        if (!evidence.ReconciliationMatched) failures.Add("Order, execution, position and cash reconciliation did not match.");
        var rto = evidence.CompletedAt - evidence.StartedAt;
        if (rto > targetRto) failures.Add("Measured RTO exceeded the target.");

        TimeSpan? rpo = null;
        if (restoreExercise)
        {
            if (evidence.RequestedRecoveryPoint is null || evidence.LastDurableTransaction is null)
                failures.Add("Recovery-point evidence is incomplete.");
            else
            {
                rpo = evidence.RequestedRecoveryPoint.Value - evidence.LastDurableTransaction.Value;
                if (rpo < TimeSpan.Zero) failures.Add("Last durable transaction is after the requested recovery point.");
                else if (rpo > targetRpo) failures.Add("Measured RPO exceeded the target.");
            }
        }

        return new(evidence.ExerciseId, evidence.Type,
            failures.Count == 0 ? RecoveryExerciseOutcome.Passed : RecoveryExerciseOutcome.Failed,
            rpo, rto, failures.Count > 0, failures, Hash(evidence, targetRpo, targetRto, executionAuthorized));
    }

    private static void RequireUtc(DateTimeOffset value, string name)
    {
        if (value == default || value.Offset != TimeSpan.Zero)
            throw new ArgumentException("Recovery evidence timestamps must be non-default UTC.", name);
    }

    private static string Hash(RecoveryExerciseEvidence item, TimeSpan targetRpo, TimeSpan targetRto, bool executionAuthorized)
    {
        var canonical = new StringBuilder();
        Add(canonical, item.ExerciseId.ToString("N", CultureInfo.InvariantCulture));
        Add(canonical, item.Type.ToString());
        Add(canonical, item.Environment);
        Add(canonical, item.StartedAt.ToString("O", CultureInfo.InvariantCulture));
        Add(canonical, item.CompletedAt.ToString("O", CultureInfo.InvariantCulture));
        Add(canonical, item.RequestedRecoveryPoint?.ToString("O", CultureInfo.InvariantCulture) ?? "-");
        Add(canonical, item.LastDurableTransaction?.ToString("O", CultureInfo.InvariantCulture) ?? "-");
        Add(canonical, item.EntryLocked.ToString(CultureInfo.InvariantCulture));
        Add(canonical, item.IsolatedTarget.ToString(CultureInfo.InvariantCulture));
        Add(canonical, item.ChecksumVerified.ToString(CultureInfo.InvariantCulture));
        Add(canonical, item.MigrationsVerified.ToString(CultureInfo.InvariantCulture));
        Add(canonical, item.AuthorizationVerified.ToString(CultureInfo.InvariantCulture));
        Add(canonical, item.TelemetryVerified.ToString(CultureInfo.InvariantCulture));
        Add(canonical, item.ReconciliationMatched.ToString(CultureInfo.InvariantCulture));
        Add(canonical, item.SourcePreserved.ToString(CultureInfo.InvariantCulture));
        Add(canonical, item.ArtifactDigest);
        Add(canonical, item.IncidentId);
        Add(canonical, targetRpo.Ticks.ToString(CultureInfo.InvariantCulture));
        Add(canonical, targetRto.Ticks.ToString(CultureInfo.InvariantCulture));
        Add(canonical, executionAuthorized.ToString(CultureInfo.InvariantCulture));
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(canonical.ToString())));
    }

    private static void Add(StringBuilder target, string value)
    {
        target.Append(value.Length.ToString(CultureInfo.InvariantCulture)).Append(':').Append(value);
    }
}
