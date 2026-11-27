using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MAKH.Infrastructure.Persistence.Evidence;

internal sealed class EvidenceSourceSnapshotRecordConfiguration : IEntityTypeConfiguration<EvidenceSourceSnapshotRecord>
{
    public void Configure(EntityTypeBuilder<EvidenceSourceSnapshotRecord> builder)
    {
        builder.ToTable("source_snapshots", DatabaseSchemas.Evidence, table =>
        {
            table.HasCheckConstraint("ck_evidence_snapshots_payload_hash", "payload_sha256 ~ '^[0-9a-f]{64}$'");
            table.HasCheckConstraint("ck_evidence_snapshots_byte_count", "byte_count BETWEEN 1 AND 1048576");
            table.HasCheckConstraint("ck_evidence_snapshots_retention", "retain_until > captured_at");
        });
        builder.HasKey(snapshot => snapshot.EvidenceDocumentId).HasName("pk_evidence_source_snapshots");
        builder.Property(snapshot => snapshot.EvidenceDocumentId).HasColumnName("evidence_document_id");
        builder.Property(snapshot => snapshot.PayloadSha256).HasColumnName("payload_sha256")
            .HasMaxLength(64).IsFixedLength().IsRequired();
        builder.Property(snapshot => snapshot.ByteCount).HasColumnName("byte_count").IsRequired();
        builder.Property(snapshot => snapshot.MediaType).HasColumnName("media_type").HasMaxLength(100).IsRequired();
        builder.Property(snapshot => snapshot.ScannerVersion).HasColumnName("scanner_version").HasMaxLength(100).IsRequired();
        builder.Property(snapshot => snapshot.CapturedAt).HasColumnName("captured_at").IsRequired();
        builder.Property(snapshot => snapshot.RetainUntil).HasColumnName("retain_until").IsRequired();
        builder.HasOne(snapshot => snapshot.EvidenceDocument).WithOne()
            .HasForeignKey<EvidenceSourceSnapshotRecord>(snapshot => snapshot.EvidenceDocumentId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(snapshot => snapshot.PayloadSha256).HasDatabaseName("ix_evidence_snapshots_payload_hash");
        builder.HasIndex(snapshot => snapshot.RetainUntil).HasDatabaseName("ix_evidence_snapshots_retain_until");
    }
}
