using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MAKH.Infrastructure.Persistence.Evidence;

internal sealed class SocialRetentionDeletionAuditConfiguration
    : IEntityTypeConfiguration<SocialRetentionDeletionAuditRecord>
{
    public void Configure(EntityTypeBuilder<SocialRetentionDeletionAuditRecord> builder)
    {
        builder.ToTable("social_retention_deletions", DatabaseSchemas.Audit, table =>
        {
            table.HasCheckConstraint("ck_social_retention_audit_version", "version > 0");
            table.HasCheckConstraint("ck_social_retention_audit_time", "deleted_at >= retain_until");
            table.HasCheckConstraint("ck_social_retention_audit_hash", "content_sha256 ~ '^[0-9a-f]{64}$'");
            table.HasCheckConstraint("ck_social_retention_audit_reason", "reason = 'RetentionExpired'");
        });
        builder.HasKey(record => record.Id).HasName("pk_social_retention_deletions");
        builder.Property(record => record.Id).HasColumnName("id");
        builder.Property(record => record.AggregateRecordId).HasColumnName("aggregate_record_id");
        builder.Property(record => record.Provider).HasColumnName("provider").HasMaxLength(100);
        builder.Property(record => record.AggregateId).HasColumnName("aggregate_id").HasMaxLength(200);
        builder.Property(record => record.Version).HasColumnName("version");
        builder.Property(record => record.RetainUntil).HasColumnName("retain_until");
        builder.Property(record => record.DeletedAt).HasColumnName("deleted_at");
        builder.Property(record => record.Reason).HasColumnName("reason").HasMaxLength(40);
        builder.Property(record => record.ContentSha256).HasColumnName("content_sha256").HasMaxLength(64).IsFixedLength();
        builder.HasIndex(record => record.AggregateRecordId).IsUnique()
            .HasDatabaseName("ux_social_retention_deletions_aggregate_record");
        builder.HasIndex(record => record.DeletedAt)
            .HasDatabaseName("ix_social_retention_deletions_deleted_at");
    }
}
