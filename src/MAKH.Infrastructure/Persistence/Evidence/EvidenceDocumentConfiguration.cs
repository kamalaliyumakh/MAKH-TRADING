using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MAKH.Infrastructure.Persistence.Evidence;

internal sealed class EvidenceDocumentRecordConfiguration : IEntityTypeConfiguration<EvidenceDocumentRecord>
{
    public void Configure(EntityTypeBuilder<EvidenceDocumentRecord> builder)
    {
        builder.ToTable("documents", DatabaseSchemas.Evidence, table =>
        {
            table.HasCheckConstraint("ck_evidence_documents_version", "version > 0");
            table.HasCheckConstraint("ck_evidence_documents_content_hash", "content_sha256 ~ '^[0-9a-f]{64}$'");
            table.HasCheckConstraint("ck_evidence_documents_observation_time", "observed_at >= published_at");
            table.HasCheckConstraint("ck_evidence_documents_deleted_excerpt", "NOT is_deleted OR excerpt IS NULL");
        });
        builder.HasKey(document => document.Id).HasName("pk_evidence_documents");
        builder.Property(document => document.Id).HasColumnName("id");
        builder.Property(document => document.SecurityId).HasColumnName("security_id");
        builder.Property(document => document.SourceKind).HasColumnName("source_kind")
            .HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(document => document.Headline).HasColumnName("headline").HasMaxLength(500).IsRequired();
        builder.Property(document => document.Publisher).HasColumnName("publisher").HasMaxLength(200).IsRequired();
        builder.Property(document => document.AccessionNumber).HasColumnName("accession_number").HasMaxLength(20);
        builder.Property(document => document.Excerpt).HasColumnName("excerpt").HasMaxLength(2_000);
        builder.Property(document => document.TrustState).HasColumnName("trust_state")
            .HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(document => document.Provider).HasColumnName("provider").HasMaxLength(100).IsRequired();
        builder.Property(document => document.ProviderRecordId).HasColumnName("provider_record_id").HasMaxLength(200).IsRequired();
        builder.Property(document => document.CanonicalUri).HasColumnName("canonical_uri").HasMaxLength(2_048).IsRequired();
        builder.Property(document => document.PublishedAt).HasColumnName("published_at").IsRequired();
        builder.Property(document => document.ObservedAt).HasColumnName("observed_at").IsRequired();
        builder.Property(document => document.Version).HasColumnName("version").IsRequired();
        builder.Property(document => document.ContentRight).HasColumnName("content_right")
            .HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(document => document.SupersedesRecordId).HasColumnName("supersedes_record_id").HasMaxLength(200);
        builder.Property(document => document.IsDeleted).HasColumnName("is_deleted").IsRequired();
        builder.Property(document => document.ContentSha256).HasColumnName("content_sha256")
            .HasMaxLength(64).IsFixedLength().IsRequired();
        builder.HasIndex(document => new { document.Provider, document.ProviderRecordId, document.Version })
            .IsUnique().HasDatabaseName("ux_evidence_documents_provider_record_version");
        builder.HasIndex(document => new { document.SecurityId, document.PublishedAt })
            .HasDatabaseName("ix_evidence_documents_security_published");
        builder.HasIndex(document => document.ContentSha256)
            .HasDatabaseName("ix_evidence_documents_content_hash");
    }
}
