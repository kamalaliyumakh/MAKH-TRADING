using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using MAKH.Application.Evidence;

namespace MAKH.Infrastructure.Persistence.Evidence;

public sealed class SocialAttentionAggregateRecord
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    private SocialAttentionAggregateRecord() { }

    public SocialAttentionAggregateRecord(SocialAttentionSignal signal, DateTimeOffset retainUntil)
    {
        ArgumentNullException.ThrowIfNull(signal);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(retainUntil, signal.Provenance.ObservedAt);
        Id = Guid.NewGuid();
        SecurityId = signal.SecurityId;
        MentionCount = signal.MentionCount;
        DistinctAuthorEstimate = signal.DistinctAuthorEstimate;
        AttentionChangePercent = signal.AttentionChangePercent;
        Confidence = signal.Confidence;
        ManipulationRisk = signal.ManipulationRisk;
        LimitationLabel = signal.LimitationLabel;
        Provider = signal.Provenance.Provider;
        AggregateId = signal.Provenance.AggregateId;
        WindowStart = signal.Provenance.WindowStart;
        WindowEnd = signal.Provenance.WindowEnd;
        ObservedAt = signal.Provenance.ObservedAt;
        Version = signal.Provenance.Version;
        Method = signal.Provenance.Method;
        SupersedesAggregateId = signal.Provenance.SupersedesAggregateId;
        IsDeleted = signal.IsDeleted;
        RetainUntil = retainUntil;
        ContentSha256 = ComputeContentHash(signal, retainUntil);
    }

    public Guid Id { get; private set; }
    public Guid SecurityId { get; private set; }
    public long MentionCount { get; private set; }
    public long DistinctAuthorEstimate { get; private set; }
    public decimal AttentionChangePercent { get; private set; }
    public SocialConfidence Confidence { get; private set; }
    public ManipulationRisk ManipulationRisk { get; private set; }
    public string LimitationLabel { get; private set; } = string.Empty;
    public string Provider { get; private set; } = string.Empty;
    public string AggregateId { get; private set; } = string.Empty;
    public DateTimeOffset WindowStart { get; private set; }
    public DateTimeOffset WindowEnd { get; private set; }
    public DateTimeOffset ObservedAt { get; private set; }
    public int Version { get; private set; }
    public string Method { get; private set; } = string.Empty;
    public string? SupersedesAggregateId { get; private set; }
    public bool IsDeleted { get; private set; }
    public DateTimeOffset RetainUntil { get; private set; }
    public string ContentSha256 { get; private set; } = string.Empty;

    public SocialAttentionSignal ToModel() => new(
        SecurityId,
        MentionCount,
        DistinctAuthorEstimate,
        AttentionChangePercent,
        Confidence,
        ManipulationRisk,
        LimitationLabel,
        new SocialSignalProvenance(
            Provider,
            AggregateId,
            WindowStart,
            WindowEnd,
            ObservedAt,
            Version,
            Method,
            SupersedesAggregateId),
        IsDeleted);

    public static string ComputeContentHash(SocialAttentionSignal signal, DateTimeOffset retainUntil)
    {
        ArgumentNullException.ThrowIfNull(signal);
        var canonical = JsonSerializer.Serialize(new
        {
            signal.SecurityId,
            signal.MentionCount,
            signal.DistinctAuthorEstimate,
            signal.AttentionChangePercent,
            confidence = signal.Confidence.ToString(),
            manipulationRisk = signal.ManipulationRisk.ToString(),
            signal.LimitationLabel,
            signal.Provenance.Provider,
            signal.Provenance.AggregateId,
            signal.Provenance.WindowStart,
            signal.Provenance.WindowEnd,
            signal.Provenance.ObservedAt,
            signal.Provenance.Version,
            signal.Provenance.Method,
            signal.Provenance.SupersedesAggregateId,
            signal.IsDeleted,
            retainUntil,
        }, SerializerOptions);
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)));
    }
}

public sealed record SocialAttentionReplayPlan(
    IReadOnlyList<SocialAttentionAggregateRecord> Inserts,
    int ReplayCount)
{
    public static SocialAttentionReplayPlan Create(
        IEnumerable<SocialAttentionAggregateRecord> existing,
        IEnumerable<(SocialAttentionSignal Signal, DateTimeOffset RetainUntil)> incoming)
    {
        ArgumentNullException.ThrowIfNull(existing);
        ArgumentNullException.ThrowIfNull(incoming);
        var known = existing.ToDictionary(Identity);
        var inserts = new List<SocialAttentionAggregateRecord>();
        var replayCount = 0;
        foreach (var (signal, retainUntil) in incoming)
        {
            var record = new SocialAttentionAggregateRecord(signal, retainUntil);
            var identity = Identity(record);
            if (known.TryGetValue(identity, out var prior))
            {
                if (!string.Equals(prior.ContentSha256, record.ContentSha256, StringComparison.Ordinal))
                    throw new InvalidOperationException(
                        "A social provider aggregate version cannot be replayed with different content or retention.");
                replayCount++;
                continue;
            }

            known.Add(identity, record);
            inserts.Add(record);
        }

        return new SocialAttentionReplayPlan(inserts, replayCount);
    }

    private static (string Provider, string AggregateId, int Version) Identity(
        SocialAttentionAggregateRecord record) => (record.Provider, record.AggregateId, record.Version);
}
