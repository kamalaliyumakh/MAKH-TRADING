namespace MAKH.Infrastructure.Persistence.IdentityAccount;

public sealed class UserSession
{
    private UserSession()
    {
    }

    public UserSession(Guid id, Guid userId, DateTimeOffset issuedAt, DateTimeOffset expiresAt,
        byte[] ticketKeyHash, byte[] protectedTicket)
    {
        if (id == Guid.Empty) throw new ArgumentException("Session ID is required.", nameof(id));
        if (userId == Guid.Empty) throw new ArgumentException("User ID is required.", nameof(userId));
        if (issuedAt == default) throw new ArgumentException("Issued time is required.", nameof(issuedAt));
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(expiresAt, issuedAt);
        ArgumentNullException.ThrowIfNull(ticketKeyHash);
        ArgumentNullException.ThrowIfNull(protectedTicket);
        if (ticketKeyHash.Length != 32) throw new ArgumentException("Ticket key hash must be SHA-256.", nameof(ticketKeyHash));
        if (protectedTicket.Length is 0 or > 65536) throw new ArgumentOutOfRangeException(nameof(protectedTicket));

        Id = id;
        UserId = userId;
        IssuedAt = issuedAt;
        LastSeenAt = issuedAt;
        ExpiresAt = expiresAt;
        TicketKeyHash = [.. ticketKeyHash];
        ProtectedTicket = [.. protectedTicket];
        Version = 1;
    }

    public Guid Id { get; private set; }
    public Guid UserId { get; private set; }
    public DateTimeOffset IssuedAt { get; private set; }
    public DateTimeOffset LastSeenAt { get; private set; }
    public DateTimeOffset ExpiresAt { get; private set; }
    public DateTimeOffset? RevokedAt { get; private set; }
    public byte[] TicketKeyHash { get; private set; } = [];
    public byte[] ProtectedTicket { get; private set; } = [];
    public long Version { get; private set; }
    public PlatformUser User { get; private set; } = null!;

    public void Touch(DateTimeOffset seenAt)
    {
        if (seenAt <= LastSeenAt) return;
        LastSeenAt = seenAt;
        Version++;
    }

    public void Revoke(DateTimeOffset revokedAt)
    {
        if (RevokedAt is not null) return;
        ArgumentOutOfRangeException.ThrowIfLessThan(revokedAt, IssuedAt);
        RevokedAt = revokedAt;
        Version++;
    }
}
