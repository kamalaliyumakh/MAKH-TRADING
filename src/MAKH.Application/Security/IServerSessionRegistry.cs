namespace MAKH.Application.Security;

public sealed record ServerSessionView(
    Guid SessionId,
    Guid UserId,
    DateTimeOffset IssuedAt,
    DateTimeOffset LastSeenAt,
    DateTimeOffset ExpiresAt,
    bool Revoked);

public sealed record ProtectedServerTicket(
    Guid SessionId,
    Guid UserId,
    byte[] Payload);

public interface IServerSessionRegistry
{
    Task RegisterAsync(Guid sessionId, Guid userId, DateTimeOffset issuedAt, DateTimeOffset expiresAt,
        byte[] ticketKeyHash, byte[] protectedTicket,
        CancellationToken cancellationToken = default);
    Task<ProtectedServerTicket?> RetrieveTicketAsync(byte[] ticketKeyHash, DateTimeOffset checkedAt,
        CancellationToken cancellationToken = default);
    Task<bool> RenewTicketAsync(byte[] ticketKeyHash, byte[] protectedTicket, DateTimeOffset seenAt,
        CancellationToken cancellationToken = default);
    Task RevokeByTicketKeyAsync(byte[] ticketKeyHash, DateTimeOffset revokedAt,
        CancellationToken cancellationToken = default);
    Task<bool> IsActiveAsync(Guid sessionId, Guid userId, DateTimeOffset checkedAt,
        CancellationToken cancellationToken = default);
    Task TouchAsync(Guid sessionId, Guid userId, DateTimeOffset seenAt,
        CancellationToken cancellationToken = default);
    Task<bool> RevokeAsync(Guid sessionId, Guid userId, DateTimeOffset revokedAt,
        CancellationToken cancellationToken = default);
    Task<IReadOnlyCollection<ServerSessionView>> ListAsync(Guid userId, DateTimeOffset checkedAt,
        CancellationToken cancellationToken = default);
}
