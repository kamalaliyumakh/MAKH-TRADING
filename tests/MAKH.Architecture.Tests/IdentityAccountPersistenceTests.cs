using MAKH.Infrastructure.Persistence;
using MAKH.Infrastructure.Persistence.IdentityAccount;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class IdentityAccountPersistenceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 26, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ExternalIdentityRequiresHttpsIssuerAndStableSubject()
    {
        Assert.Throws<ArgumentException>(() =>
            new ExternalIdentity(Guid.NewGuid(), Guid.NewGuid(), "http://identity.example", "subject", Now));
        Assert.Throws<ArgumentException>(() =>
            new ExternalIdentity(Guid.NewGuid(), Guid.NewGuid(), "https://identity.example", " ", Now));

        var identity = new ExternalIdentity(Guid.NewGuid(), Guid.NewGuid(),
            "https://identity.example/path", " subject ", Now);

        Assert.Equal("https://identity.example", identity.Issuer);
        Assert.Equal("subject", identity.Subject);
    }

    [Fact]
    public void IdentityAuthenticationTimeIsMonotonic()
    {
        var identity = new ExternalIdentity(Guid.NewGuid(), Guid.NewGuid(),
            "https://identity.example", "subject", Now);

        identity.RecordAuthentication(Now.AddMinutes(1));

        Assert.Equal(Now.AddMinutes(1), identity.LastAuthenticatedAt);
        Assert.Throws<ArgumentOutOfRangeException>(() => identity.RecordAuthentication(Now));
    }

    [Fact]
    public void ClosedTradingAccountCannotReopenAndVersionIsMonotonic()
    {
        var account = new TradingAccount(Guid.NewGuid(), " Synthetic-Paper ", " account-1 ",
            TradingAccountMode.Paper, Now);

        account.ChangeStatus(TradingAccountStatus.Active);
        account.ChangeStatus(TradingAccountStatus.Closed);

        Assert.Equal("synthetic-paper", account.Provider);
        Assert.Equal(3, account.Version);
        Assert.Throws<InvalidOperationException>(() => account.ChangeStatus(TradingAccountStatus.Active));
    }

    [Fact]
    public void EntitlementDefaultsToNoLiveAuthorityAndRequiresValidWindow()
    {
        var entitlement = new AccountEntitlement(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
            AccountAccess.Trade, Now, Now.AddHours(1));

        Assert.False(entitlement.AllowsLiveTrading);
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new AccountEntitlement(Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(),
                AccountAccess.Trade, Now, Now));
    }

    [Fact]
    public void UserSessionEnforcesWindowAndMonotonicLifecycle()
    {
        var session = new UserSession(Guid.NewGuid(), Guid.NewGuid(), Now, Now.AddHours(8), new byte[32], [1]);

        session.Touch(Now.AddMinutes(2));
        session.Touch(Now.AddMinutes(1));
        session.Revoke(Now.AddMinutes(3));
        session.Revoke(Now.AddMinutes(4));

        Assert.Equal(Now.AddMinutes(2), session.LastSeenAt);
        Assert.Equal(Now.AddMinutes(3), session.RevokedAt);
        Assert.Equal(3, session.Version);
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new UserSession(Guid.NewGuid(), Guid.NewGuid(), Now, Now, new byte[32], [1]));
    }

    [Fact]
    public void EfModelMapsApprovedSchemasKeysAndFailClosedConstraints()
    {
        using var context = Context();
        var model = context.GetService<IDesignTimeModel>().Model;

        AssertTable(model, typeof(PlatformUser), DatabaseSchemas.IdentityAndAccess, "users");
        AssertTable(model, typeof(ExternalIdentity), DatabaseSchemas.IdentityAndAccess, "external_identities");
        AssertTable(model, typeof(TradingAccount), DatabaseSchemas.Accounts, "trading_accounts");
        AssertTable(model, typeof(AccountEntitlement), DatabaseSchemas.Accounts, "account_entitlements");
        AssertTable(model, typeof(UserSession), DatabaseSchemas.IdentityAndAccess, "user_sessions");

        var identity = model.FindEntityType(typeof(ExternalIdentity))!;
        Assert.Contains(identity.GetIndexes(), index => index.IsUnique
            && index.Properties.Select(property => property.Name).SequenceEqual(["Issuer", "Subject"]));

        var account = model.FindEntityType(typeof(TradingAccount))!;
        Assert.Contains(account.GetIndexes(), index => index.IsUnique
            && index.Properties.Select(property => property.Name)
                .SequenceEqual(["Provider", "ProviderAccountReference", "Mode"]));
        Assert.True(account.FindProperty(nameof(TradingAccount.Version))!.IsConcurrencyToken);

        var entitlement = model.FindEntityType(typeof(AccountEntitlement))!;
        Assert.Contains(entitlement.GetCheckConstraints(), constraint =>
            constraint.Name == "ck_account_entitlements_no_live"
            && constraint.Sql == "allows_live_trading = FALSE");

        var session = model.FindEntityType(typeof(UserSession))!;
        Assert.True(session.FindProperty(nameof(UserSession.Version))!.IsConcurrencyToken);
        Assert.Contains(session.GetCheckConstraints(), constraint => constraint.Name == "ck_user_sessions_window");
    }

    private static PlatformDbContext Context()
    {
        var options = new DbContextOptionsBuilder<PlatformDbContext>()
            .UseNpgsql("Host=localhost;Database=model_only;Username=model_only")
            .Options;
        return new PlatformDbContext(options);
    }

    private static void AssertTable(IModel model, Type type, string schema, string table)
    {
        var entity = model.FindEntityType(type);
        Assert.NotNull(entity);
        Assert.Equal(schema, entity.GetSchema());
        Assert.Equal(table, entity.GetTableName());
    }
}
