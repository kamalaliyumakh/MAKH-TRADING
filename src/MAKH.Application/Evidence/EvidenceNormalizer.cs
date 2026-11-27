namespace MAKH.Application.Evidence;

public static class EvidenceNormalizer
{
    public static IReadOnlyList<EvidenceDocument> Normalize(
        IEnumerable<EvidenceDocument> documents,
        DateTimeOffset asOf)
    {
        ArgumentNullException.ThrowIfNull(documents);
        var materialized = documents.ToArray();
        if (materialized.Any(document => document.Provenance.ObservedAt > asOf))
            throw new InvalidOperationException("Evidence observed after the normalization as-of time is not permitted.");

        var identities = materialized
            .GroupBy(document => (document.Provenance.Provider, document.Provenance.ProviderRecordId))
            .Select(group => group
                .OrderByDescending(document => document.Provenance.Version)
                .ThenByDescending(document => document.Provenance.ObservedAt)
                .First())
            .ToDictionary(
                document => (document.Provenance.Provider, document.Provenance.ProviderRecordId));

        var superseded = identities.Values
            .Where(document => document.Provenance.SupersedesRecordId is not null)
            .Select(document => (document.Provenance.Provider, document.Provenance.SupersedesRecordId!))
            .ToHashSet();

        return identities.Values
            .Where(document => !superseded.Contains(
                (document.Provenance.Provider, document.Provenance.ProviderRecordId)))
            .Where(document => !document.IsDeleted)
            .OrderByDescending(document => document.Provenance.PublishedAt)
            .ThenBy(document => document.Provenance.Provider, StringComparer.Ordinal)
            .ThenBy(document => document.Provenance.ProviderRecordId, StringComparer.Ordinal)
            .ToArray();
    }
}
