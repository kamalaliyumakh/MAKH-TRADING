using System.Security.Cryptography;
using System.Text;
using MAKH.Application.Common.Ports;
using MAKH.Application.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Options;

namespace MAKH.Api.Identity;

public sealed class DistributedCacheTicketStore(
    IOptions<IdentityOptions> identityOptions,
    IClock clock,
    IServerSessionRegistry registry,
    IDataProtectionProvider dataProtectionProvider) : ITicketStore
{
    private readonly IDataProtector protector = dataProtectionProvider.CreateProtector(
        "MAKH.Api.Identity.ServerTicket.v1");

    public Task<string> StoreAsync(AuthenticationTicket ticket) =>
        StoreAsync(ticket, CancellationToken.None);

    public async Task<string> StoreAsync(AuthenticationTicket ticket, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(ticket);
        var key = Convert.ToHexString(RandomNumberGenerator.GetBytes(32));
        var (sessionId, userId) = RequireSessionIdentity(ticket);
        var issuedAt = ticket.Properties.IssuedUtc ?? clock.UtcNow;
        var expiresAt = issuedAt.AddMinutes(identityOptions.Value.AbsoluteMinutes);
        var protectedTicket = protector.Protect(TicketSerializer.Default.Serialize(ticket));
        await registry.RegisterAsync(sessionId, userId, issuedAt, expiresAt,
            HashKey(key), protectedTicket, cancellationToken);
        return key;
    }

    public Task RenewAsync(string key, AuthenticationTicket ticket) =>
        RenewAsync(key, ticket, CancellationToken.None);

    public async Task RenewAsync(string key, AuthenticationTicket ticket, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        ArgumentNullException.ThrowIfNull(ticket);

        RequireSessionIdentity(ticket);
        var protectedTicket = protector.Protect(TicketSerializer.Default.Serialize(ticket));
        if (!await registry.RenewTicketAsync(HashKey(key), protectedTicket, clock.UtcNow, cancellationToken))
            throw new InvalidOperationException("Revoked, expired or unknown session cannot be renewed.");
    }

    public Task<AuthenticationTicket?> RetrieveAsync(string key) =>
        RetrieveAsync(key, CancellationToken.None);

    public async Task<AuthenticationTicket?> RetrieveAsync(string key, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        var stored = await registry.RetrieveTicketAsync(HashKey(key), clock.UtcNow, cancellationToken);
        if (stored is null) return null;
        AuthenticationTicket? ticket;
        try
        {
            ticket = TicketSerializer.Default.Deserialize(protector.Unprotect(stored.Payload));
        }
        catch (CryptographicException)
        {
            await registry.RevokeAsync(stored.SessionId, stored.UserId, clock.UtcNow, cancellationToken);
            return null;
        }
        if (ticket is null)
        {
            await registry.RevokeAsync(stored.SessionId, stored.UserId, clock.UtcNow, cancellationToken);
            return null;
        }
        if (!TryGetSessionIdentity(ticket, out var sessionId, out var userId))
        {
            await registry.RevokeAsync(stored.SessionId, stored.UserId, clock.UtcNow, cancellationToken);
            return null;
        }
        if (sessionId != stored.SessionId || userId != stored.UserId)
        {
            await registry.RevokeAsync(stored.SessionId, stored.UserId, clock.UtcNow, cancellationToken);
            return null;
        }

        await registry.TouchAsync(sessionId, userId, clock.UtcNow, cancellationToken);
        return ticket;
    }

    public Task RemoveAsync(string key) => RemoveAsync(key, CancellationToken.None);

    public async Task RemoveAsync(string key, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(key);
        await registry.RevokeByTicketKeyAsync(HashKey(key), clock.UtcNow, cancellationToken);
    }

    private static (Guid SessionId, Guid UserId) RequireSessionIdentity(AuthenticationTicket ticket)
    {
        if (!TryGetSessionIdentity(ticket, out var sessionId, out var userId))
            throw new InvalidOperationException("Server session requires normalized session and user identifiers.");
        return (sessionId, userId);
    }

    private static bool TryGetSessionIdentity(AuthenticationTicket ticket, out Guid sessionId, out Guid userId)
    {
        sessionId = default;
        userId = default;
        return Guid.TryParse(ticket.Principal.FindFirst(PlatformClaims.SessionId)?.Value, out sessionId)
               && Guid.TryParse(ticket.Principal.FindFirst(PlatformClaims.Subject)?.Value, out userId);
    }

    private static byte[] HashKey(string key) => SHA256.HashData(Encoding.UTF8.GetBytes(key));
}
