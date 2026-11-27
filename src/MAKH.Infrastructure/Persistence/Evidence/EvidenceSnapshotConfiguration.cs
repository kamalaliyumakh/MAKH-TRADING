using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MAKH.Infrastructure.Persistence.Evidence;

internal sealed class EvidenceSnapshotConfiguration : IEntityTypeConfiguration<EvidenceSnapshotRecord>
{
    public void Configure(EntityTypeBuilder<EvidenceSnapshotRecord> builder)
    {
        builder.ToTable("combined_snapshots", DatabaseSchemas.Evidence, table =>
        {
            table.HasCheckConstraint("ck_evidence_combined_snapshots_schema", "schema_version = 'evidence-snapshot-v1'");
            table.HasCheckConstraint("ck_evidence_combined_snapshots_hash", "manifest_sha256 ~ '^[0-9a-f]{64}$'");
            table.HasCheckConstraint("ck_evidence_combined_snapshots_count", "item_count BETWEEN 0 AND 10000");
            table.HasCheckConstraint("ck_evidence_combined_snapshots_items",
                "jsonb_typeof(items_json) = 'array' AND jsonb_array_length(items_json) = item_count");
        });
        builder.HasKey(snapshot => snapshot.Id).HasName("pk_evidence_combined_snapshots");
        builder.Property(snapshot => snapshot.Id).HasColumnName("id");
        builder.Property(snapshot => snapshot.AsOf).HasColumnName("as_of").IsRequired();
        builder.Property(snapshot => snapshot.SchemaVersion).HasColumnName("schema_version").HasMaxLength(40).IsRequired();
        builder.Property(snapshot => snapshot.ManifestSha256).HasColumnName("manifest_sha256").HasMaxLength(64).IsFixedLength().IsRequired();
        builder.Property(snapshot => snapshot.ItemCount).HasColumnName("item_count").IsRequired();
        builder.Property(snapshot => snapshot.ItemsJson).HasColumnName("items_json").HasColumnType("jsonb").IsRequired();
        builder.HasIndex(snapshot => snapshot.AsOf).IsUnique().HasDatabaseName("ux_evidence_combined_snapshots_as_of");
        builder.HasIndex(snapshot => snapshot.ManifestSha256).IsUnique().HasDatabaseName("ux_evidence_combined_snapshots_manifest");
    }
}
