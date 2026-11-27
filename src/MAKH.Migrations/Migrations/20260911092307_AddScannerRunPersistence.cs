using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class AddScannerRunPersistence : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "scanner");

        migrationBuilder.CreateTable(
            name: "runs",
            schema: "scanner",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                preset_version_key = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                as_of = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                input_snapshot_hash = table.Column<string>(type: "character(64)", fixedLength: true, maxLength: 64, nullable: false),
                data_quality = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_scanner_runs", x => x.id);
                table.CheckConstraint("ck_scanner_runs_preset_version", "length(preset_version_key) BETWEEN 3 AND 160");
                table.CheckConstraint("ck_scanner_runs_snapshot_hash", "input_snapshot_hash ~ '^[0-9a-f]{64}$'");
            });

        migrationBuilder.CreateTable(
            name: "run_candidates",
            schema: "scanner",
            columns: table => new
            {
                run_id = table.Column<Guid>(type: "uuid", nullable: false),
                security_id = table.Column<Guid>(type: "uuid", nullable: false),
                symbol = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                rank = table.Column<int>(type: "integer", nullable: true),
                qualified = table.Column<bool>(type: "boolean", nullable: false),
                extreme_move_risk = table.Column<bool>(type: "boolean", nullable: false),
                price = table.Column<decimal>(type: "numeric(20,8)", precision: 20, scale: 8, nullable: true),
                gain_percent = table.Column<decimal>(type: "numeric(20,8)", precision: 20, scale: 8, nullable: true),
                relative_volume = table.Column<decimal>(type: "numeric(20,8)", precision: 20, scale: 8, nullable: true),
                public_float = table.Column<long>(type: "bigint", nullable: true),
                spread_percent = table.Column<decimal>(type: "numeric(20,8)", precision: 20, scale: 8, nullable: true),
                dollar_volume = table.Column<decimal>(type: "numeric(24,4)", precision: 24, scale: 4, nullable: true),
                exclusion_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_scanner_run_candidates", x => new { x.run_id, x.security_id });
                table.CheckConstraint("ck_scanner_candidates_float", "public_float IS NULL OR public_float >= 0");
                table.CheckConstraint("ck_scanner_candidates_qualified_rank", "(qualified AND rank IS NOT NULL) OR (NOT qualified AND rank IS NULL)");
                table.CheckConstraint("ck_scanner_candidates_rank", "rank IS NULL OR rank > 0");
                table.ForeignKey(
                    name: "FK_run_candidates_runs_run_id",
                    column: x => x.run_id,
                    principalSchema: "scanner",
                    principalTable: "runs",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "ux_scanner_candidates_run_rank",
            schema: "scanner",
            table: "run_candidates",
            columns: new[] { "run_id", "rank" },
            unique: true,
            filter: "rank IS NOT NULL");

        migrationBuilder.CreateIndex(
            name: "ix_scanner_runs_preset_as_of",
            schema: "scanner",
            table: "runs",
            columns: new[] { "preset_version_key", "as_of" });

        migrationBuilder.CreateIndex(
            name: "ix_scanner_runs_snapshot_hash",
            schema: "scanner",
            table: "runs",
            column: "input_snapshot_hash");

        migrationBuilder.Sql("""
            ALTER TABLE scanner.runs OWNER TO makh_owner;
            ALTER TABLE scanner.run_candidates OWNER TO makh_owner;
            GRANT SELECT, INSERT, UPDATE, DELETE ON scanner.runs, scanner.run_candidates TO makh_runtime;
            GRANT SELECT ON scanner.runs, scanner.run_candidates TO makh_readonly;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "run_candidates",
            schema: "scanner");

        migrationBuilder.DropTable(
            name: "runs",
            schema: "scanner");
    }
}
