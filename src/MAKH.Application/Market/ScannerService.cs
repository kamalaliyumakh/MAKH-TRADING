using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace MAKH.Application.Market;

public sealed record ScannerPreset
{
    public ScannerPreset(Guid id, string name, int version, ScannerCalculationPolicy policy, DateTimeOffset publishedAt)
    {
        if (id == Guid.Empty) throw new ArgumentException("Preset ID is required.", nameof(id));
        Name = string.IsNullOrWhiteSpace(name) ? throw new ArgumentException("Preset name is required.", nameof(name)) : name.Trim();
        ArgumentOutOfRangeException.ThrowIfLessThan(version, 1);
        Id = id;
        Version = version;
        Policy = policy ?? throw new ArgumentNullException(nameof(policy));
        if (publishedAt == default) throw new ArgumentException("Preset publication time is required.", nameof(publishedAt));
        PublishedAt = publishedAt.ToUniversalTime();
    }

    public Guid Id { get; }
    public string Name { get; }
    public int Version { get; }
    public ScannerCalculationPolicy Policy { get; }
    public DateTimeOffset PublishedAt { get; }
    public string VersionKey => $"{Id:N}:{Version}";
}

public sealed record ScannerSecurityInput(
    Guid SecurityId,
    string Symbol,
    ScannerMetricSet Metrics,
    ReferenceResolution PublicFloat);

public enum ScannerDataQuality
{
    Complete,
    Partial,
    Failed,
}

public sealed record ScannerCandidate(
    Guid SecurityId,
    string Symbol,
    int? Rank,
    bool Qualified,
    bool ExtremeMoveRisk,
    decimal? Price,
    decimal? GainPercent,
    decimal? RelativeVolume,
    long? PublicFloat,
    decimal? SpreadPercent,
    decimal? DollarVolume,
    string ExclusionReason)
{
    public static bool CreatesOrderAuthority => false;
}

public sealed record ScannerRun(
    Guid Id,
    string PresetVersionKey,
    DateTimeOffset AsOf,
    string InputSnapshotHash,
    ScannerDataQuality DataQuality,
    IReadOnlyList<ScannerCandidate> Candidates)
{
    public static bool CreatesOrderAuthority => false;

    // Unscoped legacy runs remain unreadable until an account binding is persisted.
    public Guid? AccountId { get; init; }

    // Assigned atomically by persistence; null marks pre-sequence legacy evidence.
    public long? StreamSequence { get; init; }

    // Corrections are append-only runs that supersede the latest account run.
    public Guid? SupersedesRunId { get; init; }
    public string? CorrectionReason { get; init; }
}

public interface IScannerRunRepository
{
    ScannerRun? Find(Guid runId, Guid accountId);
    ScannerRun? FindLatest(Guid accountId);
    void Add(ScannerRun run);
}

public static class ScannerService
{
    public static ScannerRun Execute(
        Guid runId,
        ScannerPreset preset,
        DateTimeOffset asOf,
        IEnumerable<ScannerSecurityInput> inputs)
    {
        if (runId == Guid.Empty) throw new ArgumentException("Run ID is required.", nameof(runId));
        ArgumentNullException.ThrowIfNull(preset);
        ArgumentNullException.ThrowIfNull(inputs);
        if (asOf == default) throw new ArgumentException("Run as-of time is required.", nameof(asOf));
        asOf = asOf.ToUniversalTime();
        if (preset.PublishedAt > asOf) throw new InvalidOperationException("Scanner preset cannot be used before publication.");

        var materialized = inputs.OrderBy(input => input.SecurityId).ToArray();
        if (materialized.Any(input => input.SecurityId == Guid.Empty))
            throw new ArgumentException("Every scanner input requires a security ID.", nameof(inputs));
        if (materialized.GroupBy(input => input.SecurityId).Any(group => group.Count() > 1))
            throw new ArgumentException("A scanner run may contain only one input per security.", nameof(inputs));
        if (materialized.SelectMany(input => Metrics(input.Metrics)).Any(metric => metric.CalculationVersion != preset.Policy.Version))
            throw new InvalidOperationException("Metric calculation version does not match the published preset.");
        if (materialized.SelectMany(input => Metrics(input.Metrics)).Any(metric => metric.AsOf != asOf))
            throw new InvalidOperationException("Metric as-of time does not match the scanner run.");

        var evaluated = materialized.Select(input => Candidate(input, asOf)).ToArray();
        var ranked = evaluated
            .Where(candidate => candidate.Qualified)
            .OrderByDescending(candidate => candidate.RelativeVolume)
            .ThenByDescending(candidate => candidate.DollarVolume)
            .ThenBy(candidate => candidate.SecurityId)
            .Select((candidate, index) => candidate with { Rank = index + 1 })
            .ToDictionary(candidate => candidate.SecurityId);
        var candidates = evaluated
            .Select(candidate => ranked.GetValueOrDefault(candidate.SecurityId, candidate))
            .OrderBy(candidate => candidate.Rank is null)
            .ThenBy(candidate => candidate.Rank)
            .ThenBy(candidate => candidate.Symbol, StringComparer.Ordinal)
            .ToArray();
        var quality = materialized.Length == 0 || candidates.All(candidate => !candidate.Qualified)
            ? ScannerDataQuality.Failed
            : candidates.Any(candidate => !candidate.Qualified)
                ? ScannerDataQuality.Partial
                : ScannerDataQuality.Complete;

        return new(runId, preset.VersionKey, asOf, SnapshotHash(preset, asOf, materialized), quality, candidates);
    }

    private static ScannerCandidate Candidate(ScannerSecurityInput input, DateTimeOffset asOf)
    {
        if (string.IsNullOrWhiteSpace(input.Symbol)) throw new ArgumentException("Symbol is required.", nameof(input));
        ArgumentNullException.ThrowIfNull(input.Metrics);
        ArgumentNullException.ThrowIfNull(input.PublicFloat);
        var referenceEvidenceQualified = ReferenceEvidenceQualified(input, asOf);
        var qualified = input.Metrics.MatchesDiscoveryPreset && referenceEvidenceQualified;
        return new(
            input.SecurityId,
            input.Symbol.Trim().ToUpperInvariant(),
            null,
            qualified,
            input.Metrics.IsExtremeMove,
            input.Metrics.Price.Value,
            input.Metrics.GainPercent.Value,
            input.Metrics.RelativeVolume.Value,
            input.PublicFloat.Fact?.Shares,
            input.Metrics.SpreadPercent.Value,
            input.Metrics.DollarVolume.Value,
            qualified ? string.Empty : ExclusionReason(input, referenceEvidenceQualified));
    }

    private static IEnumerable<CalculatedMetric> Metrics(ScannerMetricSet metrics)
    {
        yield return metrics.Price;
        yield return metrics.GainPercent;
        yield return metrics.RelativeVolume;
        yield return metrics.Spread;
        yield return metrics.SpreadPercent;
        yield return metrics.DollarVolume;
    }

    private static string ExclusionReason(ScannerSecurityInput input, bool referenceEvidenceQualified)
    {
        if (!referenceEvidenceQualified) return "Public-float evidence does not match the scanner security, metric kind or run timeline.";
        if (!input.Metrics.InputsQualified) return "Required market or reference input is not qualified.";
        if (!input.Metrics.PriceMatchesPreset) return "Price is outside the preset range.";
        if (!input.Metrics.RelativeVolumeMatchesPreset) return "Relative volume is below the preset minimum.";
        if (!input.Metrics.FloatMatchesPreset) return "Public float exceeds the preset maximum.";
        if (!input.Metrics.GainMatchesPreset) return "Gain is outside the 100%–600% preset range.";
        return "Candidate does not satisfy the published preset.";
    }

    private static bool ReferenceEvidenceQualified(ScannerSecurityInput input, DateTimeOffset asOf) =>
        input.PublicFloat.CanQualifyScannerCandidate
        && input.PublicFloat.Fact is { Kind: ShareMetricKind.PublicFloat } fact
        && fact.SecurityId == input.SecurityId
        && fact.Provenance.ObservedAt <= asOf;

    private static string SnapshotHash(ScannerPreset preset, DateTimeOffset asOf, IEnumerable<ScannerSecurityInput> inputs)
    {
        var builder = new StringBuilder();
        Append(builder, preset.VersionKey);
        Append(builder, asOf.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        foreach (var input in inputs)
        {
            Append(builder, input.SecurityId.ToString("N", CultureInfo.InvariantCulture));
            Append(builder, input.Symbol.Trim().ToUpperInvariant());
            foreach (var metric in Metrics(input.Metrics))
            {
                Append(builder, metric.Name);
                Append(builder, metric.State.ToString());
                Append(builder, metric.Value?.ToString(CultureInfo.InvariantCulture) ?? "null");
                Append(builder, metric.Unit);
                Append(builder, metric.CalculationVersion);
                Append(builder, metric.AsOf.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
                Append(builder, metric.Reason);
            }
            Append(builder, input.Metrics.PriceMatchesPreset.ToString());
            Append(builder, input.Metrics.RelativeVolumeMatchesPreset.ToString());
            Append(builder, input.Metrics.FloatMatchesPreset.ToString());
            Append(builder, input.Metrics.GainMatchesPreset.ToString());
            Append(builder, input.Metrics.IsExtremeMove.ToString());
            Append(builder, input.Metrics.InputsQualified.ToString());
            Append(builder, input.Metrics.CreatesOrderAuthority.ToString());
            Append(builder, input.PublicFloat.State.ToString());
            Append(builder, input.PublicFloat.Reason);
            var fact = input.PublicFloat.Fact;
            Append(builder, fact?.SecurityId.ToString("N", CultureInfo.InvariantCulture) ?? "null");
            Append(builder, fact?.Kind.ToString() ?? "null");
            Append(builder, fact?.Shares.ToString(CultureInfo.InvariantCulture) ?? "null");
            Append(builder, fact?.Provenance.Provider ?? "null");
            Append(builder, fact?.Provenance.FactId ?? "null");
            Append(builder, fact?.Provenance.AsOfDate.ToString("O", CultureInfo.InvariantCulture) ?? "null");
            Append(builder, fact?.Provenance.ObservedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture) ?? "null");
            Append(builder, fact?.Provenance.Revision.ToString(CultureInfo.InvariantCulture) ?? "null");
            Append(builder, fact?.Provenance.Definition ?? "null");
            Append(builder, fact?.Provenance.SupersedesFactId ?? "null");
        }

        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(builder.ToString())));
    }

    private static void Append(StringBuilder builder, string value) =>
        builder.Append(value.Length.ToString(CultureInfo.InvariantCulture)).Append(':').Append(value);
}
