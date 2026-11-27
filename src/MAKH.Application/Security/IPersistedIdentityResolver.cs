namespace MAKH.Application.Security;

public interface IPersistedIdentityResolver
{
    Task<PersistedIdentityResolution?> ResolveAsync(
        string issuer,
        string subject,
        DateTimeOffset authenticatedAt,
        CancellationToken cancellationToken = default);
}

public sealed record PersistedIdentityResolution(
    Guid UserId,
    Guid AccountId,
    string AccountMode,
    IReadOnlyCollection<string> Roles);
