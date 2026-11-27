using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MAKH.Infrastructure.Persistence.Evidence;

internal sealed class SocialAttentionAggregateConfiguration
    : IEntityTypeConfiguration<SocialAttentionAggregateRecord>
{
    public void Configure(EntityTypeBuilder<SocialAttentionAggregateRecord> builder)
    {
        builder.ToTable("social_attention_aggregates", DatabaseSchemas.Evidence, table =>
        {
            table.HasCheckConstraint("ck_social_attention_version", "version > 0");
            table.HasCheckConstraint("ck_social_attention_window", "window_end > window_start");
            table.HasCheckConstraint("ck_social_attention_observation", "observed_at >= window_end");
            table.HasCheckConstraint("ck_social_attention_authors", "distinct_author_estimate <= mention_count");
            table.HasCheckConstraint("ck_social_attention_nonnegative", "mention_count >= 0 AND distinct_author_estimate >= 0");
            table.HasCheckConstraint("ck_social_attention_deleted_metrics", "NOT is_deleted OR (mention_count = 0 AND distinct_author_estimate = 0 AND attention_change_percent = 0)");
            table.HasCheckConstraint("ck_social_attention_retention", "retain_until > observed_at");
            table.HasCheckConstraint("ck_social_attention_content_hash", "content_sha256 ~ '^[0-9a-f]{64}$'");
        });
        builder.HasKey(record => record.Id).HasName("pk_social_attention_aggregates");
        builder.Property(record => record.Id).HasColumnName("id");
        builder.Property(record => record.SecurityId).HasColumnName("security_id");
        builder.Property(record => record.MentionCount).HasColumnName("mention_count");
        builder.Property(record => record.DistinctAuthorEstimate).HasColumnName("distinct_author_estimate");
        builder.Property(record => record.AttentionChangePercent).HasColumnName("attention_change_percent").HasPrecision(18, 4);
        builder.Property(record => record.Confidence).HasColumnName("confidence").HasConversion<string>().HasMaxLength(16);
        builder.Property(record => record.ManipulationRisk).HasColumnName("manipulation_risk").HasConversion<string>().HasMaxLength(16);
        builder.Property(record => record.LimitationLabel).HasColumnName("limitation_label").HasMaxLength(500);
        builder.Property(record => record.Provider).HasColumnName("provider").HasMaxLength(100);
        builder.Property(record => record.AggregateId).HasColumnName("aggregate_id").HasMaxLength(200);
        builder.Property(record => record.WindowStart).HasColumnName("window_start");
        builder.Property(record => record.WindowEnd).HasColumnName("window_end");
        builder.Property(record => record.ObservedAt).HasColumnName("observed_at");
        builder.Property(record => record.Version).HasColumnName("version");
        builder.Property(record => record.Method).HasColumnName("method").HasMaxLength(500);
        builder.Property(record => record.SupersedesAggregateId).HasColumnName("supersedes_aggregate_id").HasMaxLength(200);
        builder.Property(record => record.IsDeleted).HasColumnName("is_deleted");
        builder.Property(record => record.RetainUntil).HasColumnName("retain_until");
        builder.Property(record => record.ContentSha256).HasColumnName("content_sha256").HasMaxLength(64).IsFixedLength();
        builder.HasIndex(record => new { record.Provider, record.AggregateId, record.Version })
            .IsUnique().HasDatabaseName("ux_social_attention_provider_aggregate_version");
        builder.HasIndex(record => new { record.SecurityId, record.WindowEnd })
            .HasDatabaseName("ix_social_attention_security_window");
        builder.HasIndex(record => record.RetainUntil).HasDatabaseName("ix_social_attention_retain_until");
    }
}
