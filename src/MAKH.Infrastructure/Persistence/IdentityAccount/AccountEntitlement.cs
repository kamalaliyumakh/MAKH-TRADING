namespace MAKH.Infrastructure.Persistence.IdentityAccount;

public enum AccountAccess
{
    View,
    Trade,
    ManageRisk,
}

public sealed class AccountEntitlement
{
    private AccountEntitlement()
    {
    }

    public AccountEntitlement(Guid id, Guid userId, Guid accountId, AccountAccess permission,
        DateTimeOffset effectiveFrom, DateTimeOffset? effectiveTo = null)
    {
        if (id == Guid.Empty) throw new ArgumentException("Entitlement ID is required.", nameof(id));
        if (userId == Guid.Empty) throw new ArgumentException("User ID is required.", nameof(userId));
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        if (effectiveFrom == default) throw new ArgumentException("Effective-from time is required.", nameof(effectiveFrom));
        if (effectiveTo.HasValue && effectiveTo <= effectiveFrom)
            throw new ArgumentOutOfRangeException(nameof(effectiveTo), "Effective-to must be after effective-from.");

        Id = id;
        UserId = userId;
        AccountId = accountId;
        Permission = permission;
        EffectiveFrom = effectiveFrom;
        EffectiveTo = effectiveTo;
        AllowsLiveTrading = false;
    }

    public Guid Id { get; private set; }

    public Guid UserId { get; private set; }

    public Guid AccountId { get; private set; }

    public AccountAccess Permission { get; private set; }

    public DateTimeOffset EffectiveFrom { get; private set; }

    public DateTimeOffset? EffectiveTo { get; private set; }

    public bool AllowsLiveTrading { get; private set; }

    public PlatformUser User { get; private set; } = null!;

    public TradingAccount Account { get; private set; } = null!;
}
