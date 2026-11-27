namespace MAKH.Application.Market;

public enum ReferenceResolutionState
{
    Qualified,
    Missing,
    Stale,
    DefinitionUnapproved,
    Ambiguous,
}

public sealed record ReferenceResolution(
    ReferenceResolutionState State,
    ShareMetricFact? Fact,
    string Reason)
{
    public bool CanQualifyScannerCandidate => State == ReferenceResolutionState.Qualified;
}

public static class ReferenceDataResolver
{
    public static ReferenceResolution ResolveShareMetric(
        Guid securityId,
        ShareMetricKind kind,
        DateOnly evaluatedOn,
        int maximumAgeDays,
        IReadOnlySet<string> approvedDefinitions,
        IEnumerable<ShareMetricFact> facts)
    {
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(securityId));
        ArgumentOutOfRangeException.ThrowIfNegative(maximumAgeDays);
        ArgumentNullException.ThrowIfNull(approvedDefinitions);
        ArgumentNullException.ThrowIfNull(facts);

        var applicable = facts
            .Where(fact => fact.SecurityId == securityId && fact.Kind == kind && fact.Provenance.AsOfDate <= evaluatedOn)
            .ToArray();
        if (applicable.Length == 0)
            return new(ReferenceResolutionState.Missing, null, "No applicable reference fact exists.");

        var latestDate = applicable.Max(fact => fact.Provenance.AsOfDate);
        var latest = applicable.Where(fact => fact.Provenance.AsOfDate == latestDate).ToArray();
        var providerGroups = latest.GroupBy(fact => fact.Provenance.Provider, StringComparer.Ordinal).ToArray();
        if (providerGroups.Any(group =>
        {
            var maximumRevision = group.Max(fact => fact.Provenance.Revision);
            var competing = group.Where(fact => fact.Provenance.Revision == maximumRevision).ToArray();
            return competing.Select(fact => (fact.Shares, fact.Provenance.Definition)).Distinct().Skip(1).Any();
        }))
            return new(ReferenceResolutionState.Ambiguous, null, "One provider supplied conflicting facts at the same current revision.");

        var current = providerGroups
            .Select(group => group.OrderByDescending(fact => fact.Provenance.Revision).First())
            .ToArray();

        if (current.Select(fact => (fact.Shares, fact.Provenance.Definition)).Distinct().Skip(1).Any())
            return new(ReferenceResolutionState.Ambiguous, null, "Current providers disagree on value or definition; qualification must stop.");

        var selected = current.OrderBy(fact => fact.Provenance.Provider, StringComparer.Ordinal).First();
        if (!approvedDefinitions.Contains(selected.Provenance.Definition))
            return new(ReferenceResolutionState.DefinitionUnapproved, selected, "Reference definition is not approved for this metric.");
        if (evaluatedOn.DayNumber - selected.Provenance.AsOfDate.DayNumber > maximumAgeDays)
            return new(ReferenceResolutionState.Stale, selected, "Reference fact exceeds the approved maximum age.");

        return new(ReferenceResolutionState.Qualified, selected, "Current reference fact and definition are approved.");
    }
}
