using System.Runtime.CompilerServices;
using MAKH.Application.Market;

namespace MAKH.Infrastructure.Market;

public sealed class SyntheticMarketDataAdapter(IEnumerable<NormalizedMarketEvent> events) : IMarketDataProvider
{
    private readonly IReadOnlyList<NormalizedMarketEvent> events = events?.ToArray()
        ?? throw new ArgumentNullException(nameof(events));

    public string ProviderName => "synthetic";

    public async IAsyncEnumerable<NormalizedMarketEvent> StreamAsync(
        IReadOnlyCollection<Guid> securityIds,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(securityIds);
        var requested = securityIds.ToHashSet();
        var seen = new HashSet<string>(StringComparer.Ordinal);
        var sequenceOwners = new Dictionary<long, string>();

        foreach (var marketEvent in events.OrderBy(item => item.Provenance.Sequence))
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (!string.Equals(marketEvent.Provenance.Provider, ProviderName, StringComparison.Ordinal))
                throw new InvalidOperationException("Adapter cannot emit an event attributed to another provider.");
            if (!requested.Contains(marketEvent.SecurityId)) continue;
            if (sequenceOwners.TryGetValue(marketEvent.Provenance.Sequence, out var sequenceOwner)
                && !string.Equals(sequenceOwner, marketEvent.Provenance.EventId, StringComparison.Ordinal))
                throw new InvalidOperationException("One provider sequence cannot identify multiple events.");
            sequenceOwners[marketEvent.Provenance.Sequence] = marketEvent.Provenance.EventId;
            if (!seen.Add(marketEvent.Provenance.EventId)) continue;
            if (marketEvent.Provenance.CorrectsEventId is { } correctedId && !seen.Contains(correctedId))
                throw new InvalidOperationException("A correction must reference an earlier emitted event in the requested stream.");
            await Task.Yield();
            yield return marketEvent;
        }
    }
}
