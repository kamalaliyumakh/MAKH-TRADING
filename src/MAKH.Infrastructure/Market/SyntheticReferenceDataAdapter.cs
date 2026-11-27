using MAKH.Application.Market;

namespace MAKH.Infrastructure.Market;

public sealed class SyntheticReferenceDataAdapter(
    IEnumerable<ShareMetricFact> shareMetrics,
    IEnumerable<CorporateActionFact> corporateActions) : IReferenceDataProvider
{
    private const string Provider = "synthetic-reference";
    private readonly IReadOnlyList<ShareMetricFact> shareMetrics = Validate(shareMetrics, fact => fact.SecurityId, fact => $"share:{fact.Kind}", fact => fact.Provenance);
    private readonly IReadOnlyList<CorporateActionFact> corporateActions = Validate(corporateActions, fact => fact.SecurityId, fact => $"action:{fact.Type}", fact => fact.Provenance);

    public string ProviderName => Provider;

    public Task<IReadOnlyList<ShareMetricFact>> GetShareMetricsAsync(
        IReadOnlyCollection<Guid> securityIds,
        CancellationToken cancellationToken = default) =>
        GetAsync(shareMetrics, securityIds, fact => fact.SecurityId, fact => fact.Provenance, cancellationToken);

    public Task<IReadOnlyList<CorporateActionFact>> GetCorporateActionsAsync(
        IReadOnlyCollection<Guid> securityIds,
        CancellationToken cancellationToken = default) =>
        GetAsync(corporateActions, securityIds, fact => fact.SecurityId, fact => fact.Provenance, cancellationToken);

    private static Task<IReadOnlyList<T>> GetAsync<T>(
        IReadOnlyList<T> facts,
        IReadOnlyCollection<Guid> securityIds,
        Func<T, Guid> securityId,
        Func<T, ReferenceFactProvenance> provenance,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(securityIds);
        cancellationToken.ThrowIfCancellationRequested();
        var requested = securityIds.ToHashSet();
        var result = facts
            .Where(fact => requested.Contains(securityId(fact)))
            .GroupBy(fact => provenance(fact).FactId, StringComparer.Ordinal)
            .Select(group => group.OrderByDescending(fact => provenance(fact).Revision).First())
            .OrderBy(fact => provenance(fact).AsOfDate)
            .ThenBy(fact => provenance(fact).FactId, StringComparer.Ordinal)
            .ToArray();
        return Task.FromResult<IReadOnlyList<T>>(result);
    }

    private static T[] Validate<T>(
        IEnumerable<T> facts,
        Func<T, Guid> securityId,
        Func<T, string> factKind,
        Func<T, ReferenceFactProvenance> provenance)
    {
        ArgumentNullException.ThrowIfNull(facts);
        var result = facts.ToArray();
        if (result.Any(fact => !string.Equals(provenance(fact).Provider, Provider, StringComparison.Ordinal)))
            throw new InvalidOperationException("Adapter cannot contain a fact attributed to another provider.");
        foreach (var group in result.GroupBy(fact => provenance(fact).FactId, StringComparer.Ordinal))
        {
            if (group.Select(fact => (securityId(fact), Kind: factKind(fact))).Distinct().Skip(1).Any())
                throw new InvalidOperationException("One fact ID cannot identify multiple securities or fact kinds.");
            if (group.GroupBy(fact => provenance(fact).Revision).Any(revisions => revisions.Count() > 1))
                throw new InvalidOperationException("One fact ID cannot contain duplicate revision numbers.");
        }
        return result;
    }
}
