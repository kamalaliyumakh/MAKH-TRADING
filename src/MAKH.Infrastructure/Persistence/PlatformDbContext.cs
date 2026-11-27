using MAKH.Infrastructure.Persistence.Evidence;
using MAKH.Infrastructure.Persistence.IdentityAccount;
using MAKH.Infrastructure.Persistence.Scanner;
using Microsoft.EntityFrameworkCore;

namespace MAKH.Infrastructure.Persistence;

public sealed class PlatformDbContext(DbContextOptions<PlatformDbContext> options) : DbContext(options)
{
    public DbSet<PlatformUser> Users => Set<PlatformUser>();

    public DbSet<ExternalIdentity> ExternalIdentities => Set<ExternalIdentity>();

    public DbSet<TradingAccount> TradingAccounts => Set<TradingAccount>();

    public DbSet<AccountEntitlement> AccountEntitlements => Set<AccountEntitlement>();

    public DbSet<UserSession> UserSessions => Set<UserSession>();

    public DbSet<ScannerRunRecord> ScannerRuns => Set<ScannerRunRecord>();

    public DbSet<ScannerAccountStreamRecord> ScannerAccountStreams => Set<ScannerAccountStreamRecord>();

    public DbSet<ScannerCandidateRecord> ScannerCandidates => Set<ScannerCandidateRecord>();

    public DbSet<OutboxMessageRecord> OutboxMessages => Set<OutboxMessageRecord>();

    public DbSet<EvidenceDocumentRecord> EvidenceDocuments => Set<EvidenceDocumentRecord>();

    public DbSet<EvidenceOutboxMessageRecord> EvidenceOutboxMessages => Set<EvidenceOutboxMessageRecord>();

    public DbSet<EvidenceSourceSnapshotRecord> EvidenceSourceSnapshots => Set<EvidenceSourceSnapshotRecord>();

    public DbSet<EvidenceSnapshotRecord> EvidenceSnapshots => Set<EvidenceSnapshotRecord>();

    public DbSet<SocialAttentionAggregateRecord> SocialAttentionAggregates => Set<SocialAttentionAggregateRecord>();

    public DbSet<SocialRetentionDeletionAuditRecord> SocialRetentionDeletionAudits =>
        Set<SocialRetentionDeletionAuditRecord>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ArgumentNullException.ThrowIfNull(modelBuilder);
        modelBuilder.HasDefaultSchema(DatabaseSchemas.Platform);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(PlatformDbContext).Assembly);
    }
}
