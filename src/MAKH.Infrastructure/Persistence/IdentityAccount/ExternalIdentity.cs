namespace MAKH.Infrastructure.Persistence.IdentityAccount;

public sealed class ExternalIdentity
{
    private ExternalIdentity()
    {
    }

    public ExternalIdentity(Guid id, Guid userId, string issuer, string subject, DateTimeOffset linkedAt)
    {
        if (id == Guid.Empty) throw new ArgumentException("External identity ID is required.", nameof(id));
        if (userId == Guid.Empty) throw new ArgumentException("User ID is required.", nameof(userId));
        if (!Uri.TryCreate(issuer, UriKind.Absolute, out var issuerUri) || issuerUri.Scheme != Uri.UriSchemeHttps)
            throw new ArgumentException("Issuer must be an absolute HTTPS URI.", nameof(issuer));
        if (string.IsNullOrWhiteSpace(subject)) throw new ArgumentException("Subject is required.", nameof(subject));
        if (linkedAt == default) throw new ArgumentException("Linked time is required.", nameof(linkedAt));

        Id = id;
        UserId = userId;
        Issuer = issuerUri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
        Subject = subject.Trim();
        LinkedAt = linkedAt;
        LastAuthenticatedAt = linkedAt;
    }

    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    public string Issuer { get; private set; } = string.Empty;

    public string Subject { get; private set; } = string.Empty;

    public DateTimeOffset LinkedAt { get; private set; }

    public DateTimeOffset LastAuthenticatedAt { get; private set; }

    public PlatformUser User { get; private set; } = null!;

    public void RecordAuthentication(DateTimeOffset authenticatedAt)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(authenticatedAt, LastAuthenticatedAt);
        LastAuthenticatedAt = authenticatedAt;
    }
}
