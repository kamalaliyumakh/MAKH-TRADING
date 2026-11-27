namespace MAKH.Application.Evidence;

public enum SocialConfidence
{
    Low,
    Limited,
}

public enum ManipulationRisk
{
    Unknown,
    Elevated,
    Severe,
}

public sealed record SocialSignalProvenance
{
    private const int ProviderMaximumLength = 100;
    private const int AggregateIdMaximumLength = 200;
    private const int MethodMaximumLength = 500;

    public SocialSignalProvenance(
        string provider,
        string aggregateId,
        DateTimeOffset windowStart,
        DateTimeOffset windowEnd,
        DateTimeOffset observedAt,
        int version,
        string method,
        string? supersedesAggregateId = null)
    {
        Provider = Required(provider, ProviderMaximumLength, nameof(provider));
        AggregateId = Required(aggregateId, AggregateIdMaximumLength, nameof(aggregateId));
        if (windowEnd <= windowStart) throw new ArgumentException("Window end must follow window start.");
        if (observedAt < windowEnd) throw new ArgumentException("Observation time cannot precede the aggregate window end.", nameof(observedAt));
        ArgumentOutOfRangeException.ThrowIfLessThan(version, 1);
        Method = Required(method, MethodMaximumLength, nameof(method));
        WindowStart = windowStart;
        WindowEnd = windowEnd;
        ObservedAt = observedAt;
        Version = version;
        SupersedesAggregateId = string.IsNullOrWhiteSpace(supersedesAggregateId)
            ? null
            : Required(supersedesAggregateId, AggregateIdMaximumLength, nameof(supersedesAggregateId));
        if (string.Equals(AggregateId, SupersedesAggregateId, StringComparison.Ordinal))
            throw new ArgumentException("A social aggregate cannot supersede itself.", nameof(supersedesAggregateId));
    }

    public string Provider { get; }
    public string AggregateId { get; }
    public DateTimeOffset WindowStart { get; }
    public DateTimeOffset WindowEnd { get; }
    public DateTimeOffset ObservedAt { get; }
    public int Version { get; }
    public string Method { get; }
    public string? SupersedesAggregateId { get; }

    private static string Required(string value, int maximumLength, string parameterName)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new ArgumentException("Value is required.", parameterName);
        var normalized = value.Trim();
        if (normalized.Length > maximumLength)
            throw new ArgumentException($"Value cannot exceed {maximumLength} characters.", parameterName);
        if (normalized.Any(char.IsControl))
            throw new ArgumentException("Control characters are not permitted.", parameterName);
        return normalized;
    }
}

public sealed record SocialAttentionSignal
{
    public SocialAttentionSignal(
        Guid securityId,
        long mentionCount,
        long distinctAuthorEstimate,
        decimal attentionChangePercent,
        SocialConfidence confidence,
        ManipulationRisk manipulationRisk,
        string limitationLabel,
        SocialSignalProvenance provenance,
        bool isDeleted = false)
    {
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(securityId));
        ArgumentOutOfRangeException.ThrowIfNegative(mentionCount);
        ArgumentOutOfRangeException.ThrowIfNegative(distinctAuthorEstimate);
        if (distinctAuthorEstimate > mentionCount)
            throw new ArgumentException("Distinct-author estimate cannot exceed mentions.", nameof(distinctAuthorEstimate));
        if (isDeleted && (mentionCount != 0 || distinctAuthorEstimate != 0 || attentionChangePercent != 0))
            throw new ArgumentException("A deleted social aggregate cannot retain attention metrics.", nameof(isDeleted));
        if (confidence is not (SocialConfidence.Low or SocialConfidence.Limited))
            throw new ArgumentException("Social confidence must remain low or limited.", nameof(confidence));
        if (!Enum.IsDefined(manipulationRisk))
            throw new ArgumentOutOfRangeException(nameof(manipulationRisk), "Manipulation risk is unsupported.");
        SecurityId = securityId;
        MentionCount = mentionCount;
        DistinctAuthorEstimate = distinctAuthorEstimate;
        AttentionChangePercent = attentionChangePercent;
        Confidence = confidence;
        ManipulationRisk = manipulationRisk;
        LimitationLabel = RequiredLabel(limitationLabel);
        Provenance = provenance ?? throw new ArgumentNullException(nameof(provenance));
        IsDeleted = isDeleted;
        CanVerifyCatalyst = false;
        CanAuthorizeTrade = false;
    }

    public Guid SecurityId { get; }
    public long MentionCount { get; }
    public long DistinctAuthorEstimate { get; }
    public decimal AttentionChangePercent { get; }
    public SocialConfidence Confidence { get; }
    public ManipulationRisk ManipulationRisk { get; }
    public string LimitationLabel { get; }
    public SocialSignalProvenance Provenance { get; }
    public bool IsDeleted { get; }
    public bool CanVerifyCatalyst { get; }
    public bool CanAuthorizeTrade { get; }

    private static string RequiredLabel(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("A limitation label is required.", nameof(value));
        var normalized = value.Trim();
        if (normalized.Length > 500)
            throw new ArgumentException("A limitation label cannot exceed 500 characters.", nameof(value));
        if (normalized.Any(character => char.IsControl(character) && character is not ('\r' or '\n' or '\t')))
            throw new ArgumentException("Unsafe control characters are not permitted.", nameof(value));
        return normalized;
    }
}

public sealed record SocialAggregatePrivacyPolicy
{
    public SocialAggregatePrivacyPolicy(
        int minimumDistinctAuthors,
        TimeSpan maximumWindow,
        TimeSpan retentionPeriod)
    {
        if (minimumDistinctAuthors is < 2 or > 10_000)
            throw new ArgumentOutOfRangeException(nameof(minimumDistinctAuthors));
        if (maximumWindow < TimeSpan.FromMinutes(1) || maximumWindow > TimeSpan.FromDays(7))
            throw new ArgumentOutOfRangeException(nameof(maximumWindow));
        if (retentionPeriod < TimeSpan.FromHours(1) || retentionPeriod > TimeSpan.FromDays(30))
            throw new ArgumentOutOfRangeException(nameof(retentionPeriod));
        MinimumDistinctAuthors = minimumDistinctAuthors;
        MaximumWindow = maximumWindow;
        RetentionPeriod = retentionPeriod;
    }

    public int MinimumDistinctAuthors { get; }
    public TimeSpan MaximumWindow { get; }
    public TimeSpan RetentionPeriod { get; }

    public bool MayRetain(SocialAttentionSignal signal, DateTimeOffset asOf)
    {
        ArgumentNullException.ThrowIfNull(signal);
        if (signal.Provenance.ObservedAt > asOf)
            throw new InvalidOperationException("A social aggregate observed after the as-of time is not permitted.");
        return !signal.IsDeleted
            && signal.DistinctAuthorEstimate >= MinimumDistinctAuthors
            && signal.Provenance.WindowEnd - signal.Provenance.WindowStart <= MaximumWindow
            && asOf - signal.Provenance.ObservedAt <= RetentionPeriod;
    }
}

public interface ISocialAttentionProvider
{
    string ProviderName { get; }

    Task<IReadOnlyList<SocialAttentionSignal>> GetAttentionAsync(
        IReadOnlyCollection<Guid> securityIds,
        DateTimeOffset asOf,
        CancellationToken cancellationToken = default);
}

public sealed record SocialAttentionIngestionItem(
    SocialAttentionSignal Signal,
    DateTimeOffset RetainUntil);

public sealed record SocialAttentionIngestionResult(int InsertedCount, int ReplayCount);

public sealed record SocialRetentionBacklog(
    int ExpiredCount,
    DateTimeOffset? OldestRetainUntil);

public interface ISocialAttentionStore
{
    Task<SocialAttentionIngestionResult> SaveBatchAsync(
        IReadOnlyCollection<SocialAttentionIngestionItem> items,
        CancellationToken cancellationToken = default);

    Task<int> DeleteExpiredAsync(
        DateTimeOffset asOf,
        int limit,
        CancellationToken cancellationToken = default);

    Task<SocialRetentionBacklog> GetRetentionBacklogAsync(
        DateTimeOffset asOf,
        CancellationToken cancellationToken = default);
}
