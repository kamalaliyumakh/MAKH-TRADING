using System.Security.Claims;
using MAKH.Application.Security;

namespace MAKH.Api.Identity;

public sealed class OidcPersistedIdentityClaimsMapper(
    IPersistedIdentityResolver resolver,
    TimeProvider timeProvider)
{
    public async Task<bool> MapAsync(
        ClaimsPrincipal principal,
        string issuer,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(principal);

        var subject = principal.FindFirst(PlatformClaims.Subject)?.Value;
        if (string.IsNullOrWhiteSpace(subject))
        {
            return false;
        }

        var authenticatedAt = timeProvider.GetUtcNow();
        var resolution = await resolver.ResolveAsync(
            issuer,
            subject,
            authenticatedAt,
            cancellationToken);
        if (resolution is null)
        {
            return false;
        }

        if (principal.Identity is not ClaimsIdentity identity)
        {
            return false;
        }

        RemoveClaims(identity, PlatformClaims.Subject);
        RemoveClaims(identity, PlatformClaims.Role);
        RemoveClaims(identity, PlatformClaims.AccountId);
        RemoveClaims(identity, PlatformClaims.AccountMode);
        RemoveClaims(identity, PlatformClaims.SessionId);

        identity.AddClaim(new Claim(PlatformClaims.Subject, resolution.UserId.ToString("D")));
        identity.AddClaim(new Claim(PlatformClaims.AccountId, resolution.AccountId.ToString("D")));
        identity.AddClaim(new Claim(PlatformClaims.AccountMode, resolution.AccountMode));
        identity.AddClaim(new Claim(PlatformClaims.SessionId, Guid.NewGuid().ToString("D")));
        foreach (var role in resolution.Roles)
        {
            identity.AddClaim(new Claim(PlatformClaims.Role, role));
        }

        return true;
    }

    private static void RemoveClaims(ClaimsIdentity identity, string claimType)
    {
        foreach (var claim in identity.FindAll(claimType).ToArray())
        {
            identity.RemoveClaim(claim);
        }
    }
}
