using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace MAKH.Application.Evidence;

public enum EvidenceTrustClass
{
    LowTrust = 0,
    Attributed = 1,
    Primary = 2,
}

public enum EntityMatchMethod
{
    CanonicalSecurityId,
    ExactVenueSymbol,
}

public sealed record SecurityAlias
{
    public SecurityAlias(
        Guid securityId,
        string venueMic,
        string symbol,
        DateTimeOffset effectiveFrom,
        DateTimeOffset? effectiveTo = null)
    {
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(securityId));
        if (effectiveTo <= effectiveFrom) throw new ArgumentException("Effective end must follow effective start.", nameof(effectiveTo));
        SecurityId = securityId;
        VenueMic = NormalizeVenueMic(venueMic);
        Symbol = Required(symbol, nameof(symbol), 32).ToUpperInvariant();
        EffectiveFrom = effectiveFrom;
        EffectiveTo = effectiveTo;
    }

    public Guid SecurityId { get; }
    public string VenueMic { get; }
    public string Symbol { get; }
    public DateTimeOffset EffectiveFrom { get; }
    public DateTimeOffset? EffectiveTo { get; }

    public bool IsEffectiveAt(DateTimeOffset asOf) =>
        EffectiveFrom <= asOf && (EffectiveTo is null || asOf < EffectiveTo);

    private static string NormalizeVenueMic(string value)
    {
        var normalized = Required(value, nameof(value), 4).ToUpperInvariant();
        if (normalized.Length != 4 || normalized.Any(character => !char.IsAsciiLetterOrDigit(character)))
            throw new ArgumentException("Venue MIC must contain exactly four ASCII letters or digits.", nameof(value));
        return normalized;
    }

    private static string Required(string value, string parameterName, int maximumLength)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new ArgumentException("Value is required.", parameterName);
        var normalized = value.Trim();
        if (normalized.Length > maximumLength || normalized.Any(char.IsControl))
            throw new ArgumentException("Value contains unsupported characters or exceeds its limit.", parameterName);
        return normalized;
    }
}

public sealed record EntityMatch(Guid SecurityId, EntityMatchMethod Method, string MatchedValue);

public static class EvidenceEntityMatcher
{
    public static EntityMatch Match(
        Guid? canonicalSecurityId,
        string? venueMic,
        string? symbol,
        DateTimeOffset asOf,
        IEnumerable<SecurityAlias> aliases)
    {
        ArgumentNullException.ThrowIfNull(aliases);
        var materialized = aliases.ToArray();
        if (canonicalSecurityId is { } securityId && securityId != Guid.Empty)
        {
            if (!materialized.Any(alias => alias.SecurityId == securityId && alias.IsEffectiveAt(asOf)))
                throw new InvalidOperationException("The supplied canonical security is not effective at the match time.");
            return new EntityMatch(securityId, EntityMatchMethod.CanonicalSecurityId, securityId.ToString("D"));
        }

        if (string.IsNullOrWhiteSpace(venueMic) || string.IsNullOrWhiteSpace(symbol))
            throw new InvalidOperationException("Entity matching requires a canonical security ID or an exact venue and symbol.");

        var normalizedVenue = venueMic.Trim().ToUpperInvariant();
        var normalizedSymbol = symbol.Trim().ToUpperInvariant();
        var matches = materialized
            .Where(alias => alias.IsEffectiveAt(asOf))
            .Where(alias => alias.VenueMic == normalizedVenue && alias.Symbol == normalizedSymbol)
            .Select(alias => alias.SecurityId)
            .Distinct()
            .ToArray();
        return matches.Length switch
        {
            1 => new EntityMatch(matches[0], EntityMatchMethod.ExactVenueSymbol, $"{normalizedVenue}:{normalizedSymbol}"),
            0 => throw new InvalidOperationException("No effective canonical security matches the exact venue and symbol."),
            _ => throw new InvalidOperationException("Entity match is ambiguous and must fail closed."),
        };
    }
}

public sealed record EvidenceSnapshotItem(
    Guid SecurityId,
    EvidenceSourceKind? SourceKind,
    string Provider,
    string ProviderRecordId,
    string DisplayText,
    DateTimeOffset PublishedAt,
    DateTimeOffset ObservedAt,
    EvidenceTrustClass TrustClass,
    string ContentFingerprint,
    int DuplicateSourceCount,
    bool CanVerifyCatalyst);

public sealed record EvidenceSnapshot(
    DateTimeOffset AsOf,
    string SchemaVersion,
    string ManifestSha256,
    IReadOnlyList<EvidenceSnapshotItem> Items);

public sealed record EvidenceSnapshotSaveResult(bool Inserted, bool Replayed);

public interface IEvidenceSnapshotStore
{
    Task<EvidenceSnapshotSaveResult> SaveAsync(
        EvidenceSnapshot snapshot,
        CancellationToken cancellationToken = default);

    Task<EvidenceSnapshot?> GetAsync(
        DateTimeOffset asOf,
        CancellationToken cancellationToken = default);
}

public sealed record EvidenceFingerprintObservation(
    Guid SecurityId,
    string Fingerprint,
    string CanonicalContent);

public static class EvidenceCollisionGuard
{
    public static void EnsureNoCollision(IEnumerable<EvidenceFingerprintObservation> observations)
    {
        ArgumentNullException.ThrowIfNull(observations);
        if (observations.GroupBy(item => (item.SecurityId, item.Fingerprint))
            .Any(group => group.Select(item => item.CanonicalContent)
                .Distinct(StringComparer.Ordinal).Skip(1).Any()))
            throw new InvalidOperationException(
                "A content fingerprint matched non-equivalent canonical evidence and must fail closed.");
    }
}

public static class EvidenceService
{
    private const string SnapshotSchemaVersion = "evidence-snapshot-v1";
    public const int MaximumSnapshotItems = 10_000;

    public static EvidenceSnapshot BuildSnapshot(
        IEnumerable<EvidenceDocument> documents,
        IEnumerable<SocialAttentionSignal> socialSignals,
        DateTimeOffset asOf,
        TimeSpan socialMaximumAge)
    {
        var normalizedDocuments = EvidenceNormalizer.Normalize(documents, asOf);
        var normalizedSocial = SocialSignalNormalizer.Normalize(socialSignals, asOf, socialMaximumAge);
        var candidates = normalizedDocuments.Select(FromDocument)
            .Concat(normalizedSocial.Select(FromSocial))
            .ToArray();
        if (candidates.Length > MaximumSnapshotItems)
            throw new InvalidOperationException($"Evidence snapshots cannot exceed {MaximumSnapshotItems} input items.");
        EvidenceCollisionGuard.EnsureNoCollision(candidates.Select(candidate => new EvidenceFingerprintObservation(
            candidate.Item.SecurityId,
            candidate.Item.ContentFingerprint,
            candidate.CanonicalContent)));

        var items = candidates
            .Select(candidate => candidate.Item)
            .GroupBy(item => (item.SecurityId, item.ContentFingerprint))
            .Select(SelectRepresentative)
            .OrderBy(item => item.SecurityId)
            .ThenByDescending(item => item.PublishedAt)
            .ThenBy(item => item.ContentFingerprint, StringComparer.Ordinal)
            .ToArray();

        return new EvidenceSnapshot(asOf, SnapshotSchemaVersion, ComputeManifestHash(asOf, items), items);
    }

    private static EvidenceSnapshotItem SelectRepresentative(
        IGrouping<(Guid SecurityId, string ContentFingerprint), EvidenceSnapshotItem> group)
    {
        var representative = group
            .OrderByDescending(item => item.TrustClass)
            .ThenBy(item => item.ObservedAt)
            .ThenBy(item => item.Provider, StringComparer.Ordinal)
            .ThenBy(item => item.ProviderRecordId, StringComparer.Ordinal)
            .First();
        var distinctProviderCount = group
            .Select(item => item.Provider)
            .Distinct(StringComparer.Ordinal)
            .Count();
        return representative with { DuplicateSourceCount = distinctProviderCount };
    }

    private static SnapshotCandidate FromDocument(EvidenceDocument document)
    {
        var trustClass = document.TrustState switch
        {
            EvidenceTrustState.PrimarySource => EvidenceTrustClass.Primary,
            EvidenceTrustState.PublisherAttributed => EvidenceTrustClass.Attributed,
            _ => EvidenceTrustClass.LowTrust,
        };
        var canonicalContent = Canonicalize(document.Headline);
        return new(new EvidenceSnapshotItem(
            document.SecurityId,
            document.SourceKind,
            document.Provenance.Provider,
            document.Provenance.ProviderRecordId,
            document.Headline,
            document.Provenance.PublishedAt,
            document.Provenance.ObservedAt,
            trustClass,
            Fingerprint(canonicalContent),
            1,
            false), canonicalContent);
    }

    private static SnapshotCandidate FromSocial(SocialAttentionSignal signal)
    {
        var canonicalContent = Canonicalize(
            $"social|{signal.Provenance.Provider}|{signal.Provenance.AggregateId}");
        return new(new EvidenceSnapshotItem(
            signal.SecurityId,
            null,
            signal.Provenance.Provider,
            signal.Provenance.AggregateId,
            signal.LimitationLabel,
            signal.Provenance.WindowEnd,
            signal.Provenance.ObservedAt,
            EvidenceTrustClass.LowTrust,
            Fingerprint(canonicalContent),
            1,
            false), canonicalContent);
    }

    private static string Canonicalize(string value) => string.Join(' ', value.Trim().ToUpperInvariant().Split(
            (char[]?)null, StringSplitOptions.RemoveEmptyEntries));

    private static string Fingerprint(string canonicalContent) =>
        Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonicalContent))).ToLowerInvariant();

    private sealed record SnapshotCandidate(EvidenceSnapshotItem Item, string CanonicalContent);

    private static string ComputeManifestHash(
        DateTimeOffset asOf,
        IEnumerable<EvidenceSnapshotItem> items)
    {
        var manifest = new StringBuilder()
            .Append(SnapshotSchemaVersion).Append('|')
            .Append(asOf.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        foreach (var item in items)
        {
            manifest.Append('\n')
                .Append(item.SecurityId.ToString("D")).Append('|')
                .Append(item.SourceKind?.ToString() ?? "SocialAttention").Append('|')
                .Append(item.Provider).Append('|')
                .Append(item.ProviderRecordId).Append('|')
                .Append(item.PublishedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture)).Append('|')
                .Append(item.ObservedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture)).Append('|')
                .Append(item.TrustClass).Append('|')
                .Append(item.ContentFingerprint).Append('|')
                .Append(item.DuplicateSourceCount.ToString(CultureInfo.InvariantCulture)).Append('|')
                .Append(item.CanVerifyCatalyst ? "1" : "0");
        }

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(manifest.ToString())))
            .ToLowerInvariant();
    }
}
