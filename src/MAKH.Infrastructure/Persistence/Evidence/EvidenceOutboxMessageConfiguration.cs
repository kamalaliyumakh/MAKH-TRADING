using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MAKH.Infrastructure.Persistence.Evidence;

internal sealed class EvidenceOutboxMessageRecordConfiguration : IEntityTypeConfiguration<EvidenceOutboxMessageRecord>
{
    public void Configure(EntityTypeBuilder<EvidenceOutboxMessageRecord> builder)
    {
        builder.ToTable("outbox_messages", DatabaseSchemas.Evidence, table =>
        {
            table.HasCheckConstraint("ck_evidence_outbox_schema_version", "schema_version > 0");
            table.HasCheckConstraint("ck_evidence_outbox_attempt_count", "attempt_count >= 0");
        });
        builder.HasKey(message => message.Id).HasName("pk_evidence_outbox_messages");
        builder.Property(message => message.Id).HasColumnName("id");
        builder.Property(message => message.EvidenceDocumentId).HasColumnName("evidence_document_id");
        builder.Property(message => message.EventType).HasColumnName("event_type").HasMaxLength(120).IsRequired();
        builder.Property(message => message.SchemaVersion).HasColumnName("schema_version");
        builder.Property(message => message.OccurredAt).HasColumnName("occurred_at");
        builder.Property(message => message.Payload).HasColumnName("payload").HasColumnType("jsonb").IsRequired();
        builder.Property(message => message.PublishedAt).HasColumnName("published_at");
        builder.Property(message => message.AttemptCount).HasColumnName("attempt_count");
        builder.Property(message => message.LeaseOwner).HasColumnName("lease_owner").HasMaxLength(160);
        builder.Property(message => message.LeaseUntil).HasColumnName("lease_until");
        builder.Property(message => message.NextAttemptAt).HasColumnName("next_attempt_at");
        builder.Property(message => message.LastError).HasColumnName("last_error").HasMaxLength(160);
        builder.HasOne(message => message.EvidenceDocument).WithMany()
            .HasForeignKey(message => message.EvidenceDocumentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(message => message.EvidenceDocumentId).IsUnique()
            .HasDatabaseName("ux_evidence_outbox_document");
        builder.HasIndex(message => new { message.PublishedAt, message.NextAttemptAt, message.OccurredAt })
            .HasDatabaseName("ix_evidence_outbox_unpublished");
    }
}
