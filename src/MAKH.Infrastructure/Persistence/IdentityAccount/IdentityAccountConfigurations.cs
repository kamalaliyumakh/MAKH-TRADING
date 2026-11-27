using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MAKH.Infrastructure.Persistence.IdentityAccount;

internal sealed class PlatformUserConfiguration : IEntityTypeConfiguration<PlatformUser>
{
    public void Configure(EntityTypeBuilder<PlatformUser> builder)
    {
        builder.ToTable("users", DatabaseSchemas.IdentityAndAccess, table =>
            table.HasCheckConstraint("ck_users_disabled_at", "disabled_at IS NULL OR disabled_at >= created_at"));
        builder.HasKey(user => user.Id).HasName("pk_users");
        builder.Property(user => user.Id).HasColumnName("id");
        builder.Property(user => user.DisplayName).HasColumnName("display_name").HasMaxLength(200).IsRequired();
        builder.Property(user => user.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(user => user.DisabledAt).HasColumnName("disabled_at");
        builder.Ignore(user => user.IsDisabled);
    }
}

internal sealed class ExternalIdentityConfiguration : IEntityTypeConfiguration<ExternalIdentity>
{
    public void Configure(EntityTypeBuilder<ExternalIdentity> builder)
    {
        builder.ToTable("external_identities", DatabaseSchemas.IdentityAndAccess, table =>
            table.HasCheckConstraint("ck_external_identities_auth_time", "last_authenticated_at >= linked_at"));
        builder.HasKey(identity => identity.Id).HasName("pk_external_identities");
        builder.Property(identity => identity.Id).HasColumnName("id");
        builder.Property(identity => identity.UserId).HasColumnName("user_id");
        builder.Property(identity => identity.Issuer).HasColumnName("issuer").HasMaxLength(500).IsRequired();
        builder.Property(identity => identity.Subject).HasColumnName("subject").HasMaxLength(255).IsRequired();
        builder.Property(identity => identity.LinkedAt).HasColumnName("linked_at").IsRequired();
        builder.Property(identity => identity.LastAuthenticatedAt).HasColumnName("last_authenticated_at").IsRequired();
        builder.HasIndex(identity => new { identity.Issuer, identity.Subject })
            .IsUnique().HasDatabaseName("ux_external_identities_issuer_subject");
        builder.HasOne(identity => identity.User).WithMany().HasForeignKey(identity => identity.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class TradingAccountConfiguration : IEntityTypeConfiguration<TradingAccount>
{
    public void Configure(EntityTypeBuilder<TradingAccount> builder)
    {
        builder.ToTable("trading_accounts", DatabaseSchemas.Accounts, table =>
            table.HasCheckConstraint("ck_trading_accounts_version", "version > 0"));
        builder.HasKey(account => account.Id).HasName("pk_trading_accounts");
        builder.Property(account => account.Id).HasColumnName("id");
        builder.Property(account => account.Provider).HasColumnName("provider").HasMaxLength(100).IsRequired();
        builder.Property(account => account.ProviderAccountReference).HasColumnName("provider_account_reference").HasMaxLength(255).IsRequired();
        builder.Property(account => account.Mode).HasColumnName("mode").HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.Property(account => account.Status).HasColumnName("status").HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.Property(account => account.CreatedAt).HasColumnName("created_at").IsRequired();
        builder.Property(account => account.Version).HasColumnName("version").IsConcurrencyToken();
        builder.HasIndex(account => new { account.Provider, account.ProviderAccountReference, account.Mode })
            .IsUnique().HasDatabaseName("ux_trading_accounts_provider_reference_mode");
    }
}

internal sealed class AccountEntitlementConfiguration : IEntityTypeConfiguration<AccountEntitlement>
{
    public void Configure(EntityTypeBuilder<AccountEntitlement> builder)
    {
        builder.ToTable("account_entitlements", DatabaseSchemas.Accounts, table =>
        {
            table.HasCheckConstraint("ck_account_entitlements_window", "effective_to IS NULL OR effective_to > effective_from");
            table.HasCheckConstraint("ck_account_entitlements_no_live", "allows_live_trading = FALSE");
        });
        builder.HasKey(entitlement => entitlement.Id).HasName("pk_account_entitlements");
        builder.Property(entitlement => entitlement.Id).HasColumnName("id");
        builder.Property(entitlement => entitlement.UserId).HasColumnName("user_id");
        builder.Property(entitlement => entitlement.AccountId).HasColumnName("account_id");
        builder.Property(entitlement => entitlement.Permission).HasColumnName("permission").HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(entitlement => entitlement.EffectiveFrom).HasColumnName("effective_from").IsRequired();
        builder.Property(entitlement => entitlement.EffectiveTo).HasColumnName("effective_to");
        builder.Property(entitlement => entitlement.AllowsLiveTrading).HasColumnName("allows_live_trading").HasDefaultValue(false).IsRequired();
        builder.HasIndex(entitlement => new
        { entitlement.UserId, entitlement.AccountId, entitlement.Permission, entitlement.EffectiveFrom })
            .IsUnique().HasDatabaseName("ux_account_entitlements_effective_grant");
        builder.HasOne(entitlement => entitlement.User).WithMany().HasForeignKey(entitlement => entitlement.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(entitlement => entitlement.Account).WithMany().HasForeignKey(entitlement => entitlement.AccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
{
    public void Configure(EntityTypeBuilder<UserSession> builder)
    {
        builder.ToTable("user_sessions", DatabaseSchemas.IdentityAndAccess, table =>
        {
            table.HasCheckConstraint("ck_user_sessions_window", "expires_at > issued_at");
            table.HasCheckConstraint("ck_user_sessions_last_seen", "last_seen_at >= issued_at AND last_seen_at <= expires_at");
            table.HasCheckConstraint("ck_user_sessions_revoked", "revoked_at IS NULL OR revoked_at >= issued_at");
            table.HasCheckConstraint("ck_user_sessions_version", "version > 0");
            table.HasCheckConstraint("ck_user_sessions_ticket_key_hash", "octet_length(ticket_key_hash) = 32");
            table.HasCheckConstraint("ck_user_sessions_ticket_payload", "octet_length(protected_ticket) BETWEEN 1 AND 65536");
        });
        builder.HasKey(session => session.Id).HasName("pk_user_sessions");
        builder.Property(session => session.Id).HasColumnName("id");
        builder.Property(session => session.UserId).HasColumnName("user_id");
        builder.Property(session => session.IssuedAt).HasColumnName("issued_at");
        builder.Property(session => session.LastSeenAt).HasColumnName("last_seen_at");
        builder.Property(session => session.ExpiresAt).HasColumnName("expires_at");
        builder.Property(session => session.RevokedAt).HasColumnName("revoked_at");
        builder.Property(session => session.TicketKeyHash).HasColumnName("ticket_key_hash").IsRequired();
        builder.Property(session => session.ProtectedTicket).HasColumnName("protected_ticket").IsRequired();
        builder.Property(session => session.Version).HasColumnName("version").IsConcurrencyToken();
        builder.HasIndex(session => new { session.UserId, session.ExpiresAt })
            .HasDatabaseName("ix_user_sessions_user_expiry");
        builder.HasIndex(session => session.TicketKeyHash).IsUnique()
            .HasDatabaseName("ux_user_sessions_ticket_key_hash");
        builder.HasOne(session => session.User).WithMany().HasForeignKey(session => session.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
