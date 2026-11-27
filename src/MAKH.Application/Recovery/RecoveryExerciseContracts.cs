namespace MAKH.Application.Recovery;

public enum RecoveryExerciseType { PointInTimeRestore, LogicalRestore, DependencyFailure, IncidentResponse }
public enum RecoveryExerciseOutcome { Passed, Failed, NotExecuted }

public sealed record RecoveryExerciseEvidence
{
    public RecoveryExerciseEvidence(Guid exerciseId, RecoveryExerciseType type, string environment,
        DateTimeOffset startedAt, DateTimeOffset completedAt, DateTimeOffset? requestedRecoveryPoint,
        DateTimeOffset? lastDurableTransaction, bool entryLocked, bool isolatedTarget, bool checksumVerified,
        bool migrationsVerified, bool authorizationVerified, bool telemetryVerified,
        bool reconciliationMatched, bool sourcePreserved, string artifactDigest, string incidentId)
    {
        if (exerciseId == Guid.Empty) throw new ArgumentException("Exercise ID is required.", nameof(exerciseId));
        if (!Enum.IsDefined(type)) throw new ArgumentOutOfRangeException(nameof(type), "Exercise type is not supported.");
        Environment = Required(environment, nameof(environment));
        ArtifactDigest = Sha256Digest(artifactDigest, nameof(artifactDigest));
        IncidentId = Required(incidentId, nameof(incidentId));
        if (completedAt <= startedAt) throw new ArgumentException("Completion must be later than start.", nameof(completedAt));
        if (requestedRecoveryPoint > startedAt || lastDurableTransaction > startedAt)
            throw new ArgumentException("Recovery points cannot be later than exercise start.");
        ExerciseId = exerciseId;
        Type = type;
        StartedAt = startedAt;
        CompletedAt = completedAt;
        RequestedRecoveryPoint = requestedRecoveryPoint;
        LastDurableTransaction = lastDurableTransaction;
        EntryLocked = entryLocked;
        IsolatedTarget = isolatedTarget;
        ChecksumVerified = checksumVerified;
        MigrationsVerified = migrationsVerified;
        AuthorizationVerified = authorizationVerified;
        TelemetryVerified = telemetryVerified;
        ReconciliationMatched = reconciliationMatched;
        SourcePreserved = sourcePreserved;
    }

    public Guid ExerciseId { get; }
    public RecoveryExerciseType Type { get; }
    public string Environment { get; }
    public DateTimeOffset StartedAt { get; }
    public DateTimeOffset CompletedAt { get; }
    public DateTimeOffset? RequestedRecoveryPoint { get; }
    public DateTimeOffset? LastDurableTransaction { get; }
    public bool EntryLocked { get; }
    public bool IsolatedTarget { get; }
    public bool ChecksumVerified { get; }
    public bool MigrationsVerified { get; }
    public bool AuthorizationVerified { get; }
    public bool TelemetryVerified { get; }
    public bool ReconciliationMatched { get; }
    public bool SourcePreserved { get; }
    public string ArtifactDigest { get; }
    public string IncidentId { get; }

    private static string Required(string value, string name)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? throw new ArgumentException("Value is required.", name) : value.Trim();
        if (normalized.Length > 150 || normalized.Contains('@') || normalized.Contains("token", StringComparison.OrdinalIgnoreCase) || normalized.Contains("secret", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Recovery evidence contains prohibited or excessive material.", name);
        return normalized;
    }

    private static string Sha256Digest(string value, string name)
    {
        var normalized = Required(value, name);
        if (normalized.Length != 64 || normalized.Any(character => !Uri.IsHexDigit(character)))
            throw new ArgumentException("Artifact digest must be a 64-character hexadecimal SHA-256 value.", name);
        return normalized.ToLowerInvariant();
    }
}

public sealed record RecoveryExerciseResult(
    Guid ExerciseId, RecoveryExerciseType Type, RecoveryExerciseOutcome Outcome,
    TimeSpan? MeasuredRpo, TimeSpan MeasuredRto, bool PromotionBlocked,
    IReadOnlyList<string> Failures, string EvidenceSha256)
{
    public static bool ClearsEntryLock => false;
    public static bool CreatesLiveAuthority => false;
}
