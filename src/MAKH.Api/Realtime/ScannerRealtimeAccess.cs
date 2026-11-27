using System.Security.Claims;
using MAKH.Application.Common.Ports;
using MAKH.Application.Security;

namespace MAKH.Api.Realtime;

public sealed class ScannerRealtimeAccess(IServerSessionRegistry sessions, IClock clock)
{
    public async Task<ScannerRealtimeIdentity?> AuthorizeAsync(
        ClaimsPrincipal principal, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(principal);
        if (!Guid.TryParse(principal.FindFirst(PlatformClaims.Subject)?.Value, out var userId)
            || userId == Guid.Empty
            || !Guid.TryParse(principal.FindFirst(PlatformClaims.AccountId)?.Value, out var accountId)
            || accountId == Guid.Empty
            || !Guid.TryParse(principal.FindFirst(PlatformClaims.SessionId)?.Value, out var sessionId)
            || sessionId == Guid.Empty)
        {
            return null;
        }

        return await sessions.IsActiveAsync(sessionId, userId, clock.UtcNow, cancellationToken)
            ? new ScannerRealtimeIdentity(userId, accountId, sessionId)
            : null;
    }
}

public sealed record ScannerRealtimeIdentity(Guid UserId, Guid AccountId, Guid SessionId);

public static class ScannerRealtimeGroups
{
    public static string ForAccount(Guid accountId)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        return $"scanner:account:{accountId:N}";
    }
}
