namespace MAKH.Application.Evidence;

public static class SocialSignalNormalizer
{
    public static IReadOnlyList<SocialAttentionSignal> Normalize(
        IEnumerable<SocialAttentionSignal> signals,
        DateTimeOffset asOf,
        TimeSpan maximumAge)
    {
        ArgumentNullException.ThrowIfNull(signals);
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(maximumAge, TimeSpan.Zero);
        var materialized = signals.ToArray();
        if (materialized.Any(signal => signal.Provenance.ObservedAt > asOf))
            throw new InvalidOperationException("A social aggregate observed after the as-of time is not permitted.");

        var latest = materialized
            .GroupBy(signal => (signal.Provenance.Provider, signal.Provenance.AggregateId))
            .Select(group => group
                .OrderByDescending(signal => signal.Provenance.Version)
                .ThenByDescending(signal => signal.Provenance.ObservedAt)
                .First())
            .ToDictionary(signal => (signal.Provenance.Provider, signal.Provenance.AggregateId));

        var superseded = latest.Values
            .Where(signal => signal.Provenance.SupersedesAggregateId is not null)
            .Select(signal => (signal.Provenance.Provider, signal.Provenance.SupersedesAggregateId!))
            .ToHashSet();

        var deleted = latest.Values
            .Where(signal => signal.IsDeleted)
            .Select(signal => (signal.Provenance.Provider, signal.Provenance.AggregateId))
            .ToHashSet();

        return latest.Values
            .Where(signal => !signal.IsDeleted)
            .Where(signal => !deleted.Contains(
                (signal.Provenance.Provider, signal.Provenance.AggregateId)))
            .Where(signal => !superseded.Contains(
                (signal.Provenance.Provider, signal.Provenance.AggregateId)))
            .Where(signal => asOf - signal.Provenance.WindowEnd <= maximumAge)
            .OrderBy(signal => signal.SecurityId)
            .ThenByDescending(signal => signal.Provenance.WindowEnd)
            .ToArray();
    }
}
