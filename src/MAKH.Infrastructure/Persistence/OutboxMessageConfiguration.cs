using MAKH.Infrastructure.Persistence.IdentityAccount;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MAKH.Infrastructure.Persistence;

internal sealed class OutboxMessageRecordConfiguration : IEntityTypeConfiguration<OutboxMessageRecord>
{
    public void Configure(EntityTypeBuilder<OutboxMessageRecord> builder)
    {
        builder.ToTable("outbox_messages", DatabaseSchemas.Platform, table =>
        {
            table.HasCheckConstraint("ck_outbox_messages_schema_version", "schema_version > 0");
            table.HasCheckConstraint("ck_outbox_messages_stream_sequence", "stream_sequence > 0");
            table.HasCheckConstraint("ck_outbox_messages_attempt_count", "attempt_count >= 0");
        });
        builder.HasKey(message => message.Id).HasName("pk_outbox_messages");
        builder.Property(message => message.Id).HasColumnName("id");
        builder.Property(message => message.AccountId).HasColumnName("account_id");
        builder.Property(message => message.AggregateId).HasColumnName("aggregate_id");
        builder.Property(message => message.EventType).HasColumnName("event_type").HasMaxLength(120).IsRequired();
        builder.Property(message => message.SchemaVersion).HasColumnName("schema_version");
        builder.Property(message => message.StreamSequence).HasColumnName("stream_sequence");
        builder.Property(message => message.OccurredAt).HasColumnName("occurred_at");
        builder.Property(message => message.Payload).HasColumnName("payload").HasColumnType("jsonb").IsRequired();
        builder.Property(message => message.PublishedAt).HasColumnName("published_at");
        builder.Property(message => message.AttemptCount).HasColumnName("attempt_count");
        builder.Property(message => message.LeaseOwner).HasColumnName("lease_owner").HasMaxLength(160);
        builder.Property(message => message.LeaseUntil).HasColumnName("lease_until");
        builder.Property(message => message.NextAttemptAt).HasColumnName("next_attempt_at");
        builder.Property(message => message.LastError).HasColumnName("last_error").HasMaxLength(160);
        builder.HasOne<TradingAccount>().WithMany().HasForeignKey(message => message.AccountId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(message => new { message.AccountId, message.EventType, message.StreamSequence })
            .IsUnique().HasDatabaseName("ux_outbox_account_event_sequence");
        builder.HasIndex(message => new { message.PublishedAt, message.NextAttemptAt, message.OccurredAt })
            .HasDatabaseName("ix_outbox_unpublished");
    }
}
