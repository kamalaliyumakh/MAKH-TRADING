using MAKH.Application.Security;
using Microsoft.EntityFrameworkCore;

namespace MAKH.Infrastructure.Persistence.IdentityAccount;

public sealed class PostgresPersistedIdentityResolver(IDbContextFactory<PlatformDbContext> contextFactory)
    : IPersistedIdentityResolver
{
    public async Task<PersistedIdentityResolution?> ResolveAsync(
        string issuer,
        string subject,
        DateTimeOffset authenticatedAt,
        CancellationToken cancellationToken = default)
    {
        if (!TryNormalizeIssuer(issuer, out var normalizedIssuer)
            || string.IsNullOrWhiteSpace(subject)
            || authenticatedAt == default)
        {
            return null;
        }

        await using var dbContext = await contextFactory.CreateDbContextAsync(cancellationToken);
        var normalizedSubject = subject.Trim();
        var identity = await dbContext.ExternalIdentities
            .SingleOrDefaultAsync(candidate =>
                    candidate.Issuer == normalizedIssuer
                    && candidate.Subject == normalizedSubject,
                cancellationToken);

        if (identity is null)
        {
            return null;
        }

        var userIsActive = await dbContext.Users
            .AnyAsync(user => user.Id == identity.UserId && user.DisabledAt == null, cancellationToken);
        if (!userIsActive)
        {
            return null;
        }

        var grants = await (
                from entitlement in dbContext.AccountEntitlements
                join account in dbContext.TradingAccounts on entitlement.AccountId equals account.Id
                where entitlement.UserId == identity.UserId
                      && entitlement.EffectiveFrom <= authenticatedAt
                      && (entitlement.EffectiveTo == null || entitlement.EffectiveTo > authenticatedAt)
                      && !entitlement.AllowsLiveTrading
                      && account.Status == TradingAccountStatus.Active
                      && account.Mode == TradingAccountMode.Paper
                select new { account.Id, entitlement.Permission })
            .ToListAsync(cancellationToken);

        var accountIds = grants.Select(grant => grant.Id).Distinct().ToArray();
        if (accountIds.Length != 1)
        {
            return null;
        }

        var roles = grants.Select(grant => grant.Permission)
            .SelectMany(ToRoles)
            .Distinct(StringComparer.Ordinal)
            .Order(StringComparer.Ordinal)
            .ToArray();

        identity.RecordAuthentication(authenticatedAt);
        await dbContext.SaveChangesAsync(cancellationToken);

        return new PersistedIdentityResolution(
            identity.UserId,
            accountIds[0],
            "paper",
            roles);
    }

    private static IEnumerable<string> ToRoles(AccountAccess permission) => permission switch
    {
        AccountAccess.Trade => [PlatformRoles.Trader],
        AccountAccess.ManageRisk => [PlatformRoles.RiskAdministrator],
        _ => [],
    };

    private static bool TryNormalizeIssuer(string issuer, out string normalizedIssuer)
    {
        normalizedIssuer = string.Empty;
        if (!Uri.TryCreate(issuer, UriKind.Absolute, out var issuerUri)
            || issuerUri.Scheme != Uri.UriSchemeHttps)
        {
            return false;
        }

        normalizedIssuer = issuerUri.GetLeftPart(UriPartial.Authority).TrimEnd('/');
        return true;
    }
}
