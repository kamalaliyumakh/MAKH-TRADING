using MAKH.Application.Evidence;

namespace MAKH.Infrastructure.Evidence;

public sealed class SyntheticSocialAttentionAdapter(IEnumerable<SocialAttentionSignal> signals)
    : ISocialAttentionProvider
{
    private const string Provider = "synthetic-social-attention";
    private readonly IReadOnlyList<SocialAttentionSignal> signals = Validate(signals);

    public string ProviderName => Provider;

    public Task<IReadOnlyList<SocialAttentionSignal>> GetAttentionAsync(
        IReadOnlyCollection<Guid> securityIds,
        DateTimeOffset asOf,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(securityIds);
        cancellationToken.ThrowIfCancellationRequested();
        var requested = securityIds.ToHashSet();
        var result = signals
            .Where(signal => requested.Contains(signal.SecurityId))
            .Where(signal => signal.Provenance.ObservedAt <= asOf)
            .OrderBy(signal => signal.Provenance.WindowEnd)
            .ThenBy(signal => signal.Provenance.AggregateId, StringComparer.Ordinal)
            .ToArray();
        return Task.FromResult<IReadOnlyList<SocialAttentionSignal>>(result);
    }

    private static SocialAttentionSignal[] Validate(IEnumerable<SocialAttentionSignal> source)
    {
        ArgumentNullException.ThrowIfNull(source);
        var result = source.ToArray();
        if (result.Any(signal => !string.Equals(
            signal.Provenance.Provider,
            Provider,
            StringComparison.Ordinal)))
            throw new InvalidOperationException("Adapter cannot contain a signal attributed to another provider.");
        return result;
    }
}
