namespace MAKH.Infrastructure.Persistence.IdentityAccount;

public sealed class PlatformUser
{
    private PlatformUser()
    {
    }

    public PlatformUser(Guid id, string displayName, DateTimeOffset createdAt)
    {
        if (id == Guid.Empty) throw new ArgumentException("User ID is required.", nameof(id));
        if (string.IsNullOrWhiteSpace(displayName)) throw new ArgumentException("Display name is required.", nameof(displayName));
        if (createdAt == default) throw new ArgumentException("Created time is required.", nameof(createdAt));

        Id = id;
        DisplayName = displayName.Trim();
        CreatedAt = createdAt;
    }

    public Guid Id { get; private set; }

    public string DisplayName { get; private set; } = string.Empty;

    public DateTimeOffset CreatedAt { get; private set; }

    public DateTimeOffset? DisabledAt { get; private set; }

    public bool IsDisabled => DisabledAt.HasValue;

    public void Disable(DateTimeOffset disabledAt)
    {
        ArgumentOutOfRangeException.ThrowIfLessThan(disabledAt, CreatedAt);
        DisabledAt ??= disabledAt;
    }
}
