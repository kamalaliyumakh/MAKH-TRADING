using System.Globalization;
using MAKH.Application.Common.Ports;
using MAKH.Application.Security;
using Microsoft.AspNetCore.Authorization;

namespace MAKH.Api.Identity;

public sealed class FreshMfaHandler(IClock clock) : AuthorizationHandler<FreshMfaRequirement>
{
    protected override Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        FreshMfaRequirement requirement)
    {
        var usedMfa = context.User.Claims.Any(claim =>
            claim.Type == PlatformClaims.AuthenticationMethod
            && string.Equals(claim.Value, "mfa", StringComparison.OrdinalIgnoreCase));

        var authenticationTime = context.User.FindFirst(PlatformClaims.AuthenticationTime)?.Value;
        if (!usedMfa
            || !long.TryParse(authenticationTime, NumberStyles.None, CultureInfo.InvariantCulture, out var epochSeconds))
        {
            return Task.CompletedTask;
        }

        DateTimeOffset authenticatedAt;
        try
        {
            authenticatedAt = DateTimeOffset.FromUnixTimeSeconds(epochSeconds);
        }
        catch (ArgumentOutOfRangeException)
        {
            return Task.CompletedTask;
        }

        var age = clock.UtcNow - authenticatedAt;
        if (age >= TimeSpan.Zero && age <= requirement.MaximumAge)
        {
            context.Succeed(requirement);
        }

        return Task.CompletedTask;
    }
}
