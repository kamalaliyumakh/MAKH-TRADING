namespace MAKH.Infrastructure.Persistence.IdentityAccount;

public enum TradingAccountMode
{
    Paper,
    Live,
}

public enum TradingAccountStatus
{
    Pending,
    Active,
    Suspended,
    Closed,
}

public sealed class TradingAccount
{
    private TradingAccount()
    {
    }

    public TradingAccount(Guid id, string provider, string providerAccountReference,
        TradingAccountMode mode, DateTimeOffset createdAt)
    {
        if (id == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(id));
        if (string.IsNullOrWhiteSpace(provider)) throw new ArgumentException("Provider is required.", nameof(provider));
        if (string.IsNullOrWhiteSpace(providerAccountReference))
            throw new ArgumentException("Provider account reference is required.", nameof(providerAccountReference));
        if (createdAt == default) throw new ArgumentException("Created time is required.", nameof(createdAt));

        Id = id;
        Provider = provider.Trim().ToLowerInvariant();
        ProviderAccountReference = providerAccountReference.Trim();
        Mode = mode;
        Status = TradingAccountStatus.Pending;
        CreatedAt = createdAt;
        Version = 1;
    }

    public Guid Id { get; private set; }

    public string Provider { get; private set; } = string.Empty;

    public string ProviderAccountReference { get; private set; } = string.Empty;

    public TradingAccountMode Mode { get; private set; }

    public TradingAccountStatus Status { get; private set; }

    public DateTimeOffset CreatedAt { get; private set; }

    public long Version { get; private set; }

    public void ChangeStatus(TradingAccountStatus status)
    {
        if (Status == TradingAccountStatus.Closed && status != TradingAccountStatus.Closed)
            throw new InvalidOperationException("A closed trading account cannot be reopened.");
        if (status == Status) return;

        Status = status;
        Version++;
    }
}
