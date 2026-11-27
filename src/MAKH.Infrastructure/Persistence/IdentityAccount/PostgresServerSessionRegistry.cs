using MAKH.Application.Security;
using Microsoft.EntityFrameworkCore;

namespace MAKH.Infrastructure.Persistence.IdentityAccount;

public sealed class PostgresServerSessionRegistry(IDbContextFactory<PlatformDbContext> contextFactory)
    : IServerSessionRegistry
{
    public async Task RegisterAsync(Guid sessionId, Guid userId, DateTimeOffset issuedAt,
        DateTimeOffset expiresAt, byte[] ticketKeyHash, byte[] protectedTicket,
        CancellationToken cancellationToken = default)
    {
        await using var dbContext = await contextFactory.CreateDbContextAsync(cancellationToken);
        dbContext.UserSessions.Add(new UserSession(sessionId, userId, issuedAt, expiresAt,
            ticketKeyHash, protectedTicket));
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task<ProtectedServerTicket?> RetrieveTicketAsync(byte[] ticketKeyHash,
        DateTimeOffset checkedAt, CancellationToken cancellationToken = default)
    {
        await using var dbContext = await contextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.UserSessions.AsNoTracking()
            .Where(session => session.TicketKeyHash == ticketKeyHash && session.RevokedAt == null
                              && checkedAt < session.ExpiresAt)
            .Select(session => new ProtectedServerTicket(session.Id, session.UserId, session.ProtectedTicket))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> RenewTicketAsync(byte[] ticketKeyHash, byte[] protectedTicket,
        DateTimeOffset seenAt, CancellationToken cancellationToken = default)
    {
        await using var dbContext = await contextFactory.CreateDbContextAsync(cancellationToken);
        var affected = await dbContext.UserSessions
            .Where(session => session.TicketKeyHash == ticketKeyHash && session.RevokedAt == null
                              && seenAt < session.ExpiresAt)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(session => session.ProtectedTicket, protectedTicket)
                .SetProperty(session => session.LastSeenAt, session =>
                    session.LastSeenAt < seenAt ? seenAt : session.LastSeenAt)
                .SetProperty(session => session.Version, session => session.Version + 1), cancellationToken);
        return affected == 1;
    }

    public async Task RevokeByTicketKeyAsync(byte[] ticketKeyHash, DateTimeOffset revokedAt,
        CancellationToken cancellationToken = default)
    {
        await using var dbContext = await contextFactory.CreateDbContextAsync(cancellationToken);
        await dbContext.UserSessions
            .Where(session => session.TicketKeyHash == ticketKeyHash && session.RevokedAt == null
                              && revokedAt >= session.IssuedAt)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(session => session.RevokedAt, revokedAt)
                .SetProperty(session => session.Version, session => session.Version + 1), cancellationToken);
    }

    public async Task<bool> IsActiveAsync(Guid sessionId, Guid userId, DateTimeOffset checkedAt,
        CancellationToken cancellationToken = default)
    {
        await using var dbContext = await contextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.UserSessions.AsNoTracking().AnyAsync(session =>
            session.Id == sessionId && session.UserId == userId && session.RevokedAt == null
            && checkedAt < session.ExpiresAt, cancellationToken);
    }

    public async Task TouchAsync(Guid sessionId, Guid userId, DateTimeOffset seenAt,
        CancellationToken cancellationToken = default)
    {
        await using var dbContext = await contextFactory.CreateDbContextAsync(cancellationToken);
        await dbContext.UserSessions
            .Where(session => session.Id == sessionId && session.UserId == userId
                              && session.RevokedAt == null && seenAt < session.ExpiresAt
                              && session.LastSeenAt < seenAt)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(session => session.LastSeenAt, seenAt)
                .SetProperty(session => session.Version, session => session.Version + 1), cancellationToken);
    }

    public async Task<bool> RevokeAsync(Guid sessionId, Guid userId, DateTimeOffset revokedAt,
        CancellationToken cancellationToken = default)
    {
        await using var dbContext = await contextFactory.CreateDbContextAsync(cancellationToken);
        var affected = await dbContext.UserSessions
            .Where(session => session.Id == sessionId && session.UserId == userId
                              && session.RevokedAt == null && revokedAt >= session.IssuedAt)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(session => session.RevokedAt, revokedAt)
                .SetProperty(session => session.Version, session => session.Version + 1), cancellationToken);
        return affected == 1;
    }

    public async Task<IReadOnlyCollection<ServerSessionView>> ListAsync(Guid userId,
        DateTimeOffset checkedAt, CancellationToken cancellationToken = default)
    {
        await using var dbContext = await contextFactory.CreateDbContextAsync(cancellationToken);
        return await dbContext.UserSessions.AsNoTracking()
            .Where(session => session.UserId == userId)
            .OrderByDescending(session => session.LastSeenAt)
            .Select(session => new ServerSessionView(session.Id, session.UserId, session.IssuedAt,
                session.LastSeenAt, session.ExpiresAt,
                session.RevokedAt != null || checkedAt >= session.ExpiresAt))
            .ToArrayAsync(cancellationToken);
    }
}
