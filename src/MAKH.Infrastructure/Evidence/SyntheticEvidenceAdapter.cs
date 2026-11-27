using MAKH.Application.Evidence;

namespace MAKH.Infrastructure.Evidence;

public sealed class SyntheticEvidenceAdapter(IEnumerable<EvidenceDocument> documents) : IEvidenceProvider
{
    private const string Provider = "synthetic-evidence";
    private readonly IReadOnlyList<EvidenceDocument> documents = Validate(documents);

    public string ProviderName => Provider;

    public Task<IReadOnlyList<EvidenceDocument>> GetEvidenceAsync(
        IReadOnlyCollection<Guid> securityIds,
        DateTimeOffset publishedAfter,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(securityIds);
        cancellationToken.ThrowIfCancellationRequested();
        var requested = securityIds.ToHashSet();
        var result = documents
            .Where(document => requested.Contains(document.SecurityId))
            .Where(document => document.Provenance.PublishedAt >= publishedAfter)
            .OrderBy(document => document.Provenance.PublishedAt)
            .ThenBy(document => document.Provenance.ProviderRecordId, StringComparer.Ordinal)
            .ToArray();
        return Task.FromResult<IReadOnlyList<EvidenceDocument>>(result);
    }

    private static EvidenceDocument[] Validate(IEnumerable<EvidenceDocument> source)
    {
        ArgumentNullException.ThrowIfNull(source);
        var result = source.ToArray();
        if (result.Any(document => !string.Equals(
            document.Provenance.Provider,
            Provider,
            StringComparison.Ordinal)))
            throw new InvalidOperationException("Adapter cannot contain evidence attributed to another provider.");
        return result;
    }
}
