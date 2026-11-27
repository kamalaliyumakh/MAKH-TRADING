using MAKH.Infrastructure.Persistence.IdentityAccount;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace MAKH.Infrastructure.Persistence.Scanner;

internal sealed class ScannerAccountStreamRecordConfiguration : IEntityTypeConfiguration<ScannerAccountStreamRecord>
{
    public void Configure(EntityTypeBuilder<ScannerAccountStreamRecord> builder)
    {
        builder.ToTable("account_streams", DatabaseSchemas.Scanner, table =>
            table.HasCheckConstraint("ck_scanner_account_streams_last_sequence", "last_sequence > 0"));
        builder.HasKey(stream => stream.AccountId).HasName("pk_scanner_account_streams");
        builder.Property(stream => stream.AccountId).HasColumnName("account_id");
        builder.Property(stream => stream.LastSequence).HasColumnName("last_sequence").IsRequired();
        builder.HasOne<TradingAccount>().WithMany().HasForeignKey(stream => stream.AccountId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class ScannerRunRecordConfiguration : IEntityTypeConfiguration<ScannerRunRecord>
{
    public void Configure(EntityTypeBuilder<ScannerRunRecord> builder)
    {
        builder.ToTable("runs", DatabaseSchemas.Scanner, table =>
        {
            table.HasCheckConstraint("ck_scanner_runs_snapshot_hash", "input_snapshot_hash ~ '^[0-9a-f]{64}$'");
            table.HasCheckConstraint("ck_scanner_runs_preset_version", "length(preset_version_key) BETWEEN 3 AND 160");
            table.HasCheckConstraint("ck_scanner_runs_stream_sequence", "stream_sequence IS NULL OR (account_id IS NOT NULL AND stream_sequence > 0)");
            table.HasCheckConstraint("ck_scanner_runs_correction_lineage", "(supersedes_run_id IS NULL AND correction_reason IS NULL) OR (supersedes_run_id IS NOT NULL AND correction_reason IS NOT NULL AND length(trim(correction_reason)) BETWEEN 1 AND 500)");
        });
        builder.HasKey(run => run.Id).HasName("pk_scanner_runs");
        builder.Property(run => run.Id).HasColumnName("id");
        builder.Property(run => run.AccountId).HasColumnName("account_id");
        builder.Property(run => run.StreamSequence).HasColumnName("stream_sequence");
        builder.Property(run => run.SupersedesRunId).HasColumnName("supersedes_run_id");
        builder.Property(run => run.CorrectionReason).HasColumnName("correction_reason").HasMaxLength(500);
        builder.HasOne<TradingAccount>().WithMany().HasForeignKey(run => run.AccountId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasIndex(run => new { run.AccountId, run.Id }).HasDatabaseName("ix_scanner_runs_account_id");
        builder.HasIndex(run => new { run.AccountId, run.StreamSequence }).IsUnique()
            .HasFilter("account_id IS NOT NULL AND stream_sequence IS NOT NULL")
            .HasDatabaseName("ux_scanner_runs_account_sequence");
        builder.HasIndex(run => run.SupersedesRunId).IsUnique()
            .HasFilter("supersedes_run_id IS NOT NULL")
            .HasDatabaseName("ux_scanner_runs_supersedes_run_id");
        builder.HasOne<ScannerRunRecord>().WithMany().HasForeignKey(run => run.SupersedesRunId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.Property(run => run.PresetVersionKey).HasColumnName("preset_version_key").HasMaxLength(160).IsRequired();
        builder.Property(run => run.AsOf).HasColumnName("as_of").IsRequired();
        builder.Property(run => run.InputSnapshotHash).HasColumnName("input_snapshot_hash").HasMaxLength(64).IsFixedLength().IsRequired();
        builder.Property(run => run.DataQuality).HasColumnName("data_quality").HasConversion<string>().HasMaxLength(16).IsRequired();
        builder.HasIndex(run => new { run.PresetVersionKey, run.AsOf }).HasDatabaseName("ix_scanner_runs_preset_as_of");
        builder.HasIndex(run => run.InputSnapshotHash).HasDatabaseName("ix_scanner_runs_snapshot_hash");
    }
}

internal sealed class ScannerCandidateRecordConfiguration : IEntityTypeConfiguration<ScannerCandidateRecord>
{
    public void Configure(EntityTypeBuilder<ScannerCandidateRecord> builder)
    {
        builder.ToTable("run_candidates", DatabaseSchemas.Scanner, table =>
        {
            table.HasCheckConstraint("ck_scanner_candidates_rank", "rank IS NULL OR rank > 0");
            table.HasCheckConstraint("ck_scanner_candidates_qualified_rank", "(qualified AND rank IS NOT NULL) OR (NOT qualified AND rank IS NULL)");
            table.HasCheckConstraint("ck_scanner_candidates_float", "public_float IS NULL OR public_float >= 0");
        });
        builder.HasKey(candidate => new { candidate.RunId, candidate.SecurityId }).HasName("pk_scanner_run_candidates");
        builder.Property(candidate => candidate.RunId).HasColumnName("run_id");
        builder.Property(candidate => candidate.SecurityId).HasColumnName("security_id");
        builder.Property(candidate => candidate.Symbol).HasColumnName("symbol").HasMaxLength(32).IsRequired();
        builder.Property(candidate => candidate.Rank).HasColumnName("rank");
        builder.Property(candidate => candidate.Qualified).HasColumnName("qualified");
        builder.Property(candidate => candidate.ExtremeMoveRisk).HasColumnName("extreme_move_risk");
        builder.Property(candidate => candidate.Price).HasColumnName("price").HasPrecision(20, 8);
        builder.Property(candidate => candidate.GainPercent).HasColumnName("gain_percent").HasPrecision(20, 8);
        builder.Property(candidate => candidate.RelativeVolume).HasColumnName("relative_volume").HasPrecision(20, 8);
        builder.Property(candidate => candidate.PublicFloat).HasColumnName("public_float");
        builder.Property(candidate => candidate.SpreadPercent).HasColumnName("spread_percent").HasPrecision(20, 8);
        builder.Property(candidate => candidate.DollarVolume).HasColumnName("dollar_volume").HasPrecision(24, 4);
        builder.Property(candidate => candidate.ExclusionReason).HasColumnName("exclusion_reason").HasMaxLength(500).IsRequired();
        builder.HasIndex(candidate => new { candidate.RunId, candidate.Rank }).IsUnique()
            .HasFilter("rank IS NOT NULL").HasDatabaseName("ux_scanner_candidates_run_rank");
        builder.HasOne(candidate => candidate.Run).WithMany(run => run.Candidates)
            .HasForeignKey(candidate => candidate.RunId).OnDelete(DeleteBehavior.Restrict);
    }
}
