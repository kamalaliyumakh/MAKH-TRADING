using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class AddCombinedEvidenceSnapshots : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "combined_snapshots",
            schema: "evidence",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                as_of = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                schema_version = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                manifest_sha256 = table.Column<string>(type: "character(64)", fixedLength: true, maxLength: 64, nullable: false),
                item_count = table.Column<int>(type: "integer", nullable: false),
                items_json = table.Column<string>(type: "jsonb", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_evidence_combined_snapshots", x => x.id);
                table.CheckConstraint("ck_evidence_combined_snapshots_count", "item_count BETWEEN 0 AND 10000");
                table.CheckConstraint("ck_evidence_combined_snapshots_hash", "manifest_sha256 ~ '^[0-9a-f]{64}$'");
                table.CheckConstraint("ck_evidence_combined_snapshots_items", "jsonb_typeof(items_json) = 'array' AND jsonb_array_length(items_json) = item_count");
                table.CheckConstraint("ck_evidence_combined_snapshots_schema", "schema_version = 'evidence-snapshot-v1'");
            });

        migrationBuilder.CreateIndex(
            name: "ux_evidence_combined_snapshots_as_of",
            schema: "evidence",
            table: "combined_snapshots",
            column: "as_of",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_evidence_combined_snapshots_manifest",
            schema: "evidence",
            table: "combined_snapshots",
            column: "manifest_sha256",
            unique: true);

        migrationBuilder.Sql("""
            ALTER TABLE evidence.combined_snapshots OWNER TO makh_owner;
            GRANT SELECT, INSERT ON evidence.combined_snapshots TO makh_runtime;
            GRANT SELECT ON evidence.combined_snapshots TO makh_readonly;
            REVOKE UPDATE, DELETE, TRUNCATE ON evidence.combined_snapshots FROM makh_runtime;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "combined_snapshots",
            schema: "evidence");
    }
}
