using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class AddEvidenceSourceSnapshots : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "source_snapshots",
            schema: "evidence",
            columns: table => new
            {
                evidence_document_id = table.Column<Guid>(type: "uuid", nullable: false),
                payload_sha256 = table.Column<string>(type: "character(64)", fixedLength: true, maxLength: 64, nullable: false),
                byte_count = table.Column<int>(type: "integer", nullable: false),
                media_type = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                scanner_version = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                captured_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                retain_until = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_evidence_source_snapshots", x => x.evidence_document_id);
                table.CheckConstraint("ck_evidence_snapshots_byte_count", "byte_count BETWEEN 1 AND 1048576");
                table.CheckConstraint("ck_evidence_snapshots_payload_hash", "payload_sha256 ~ '^[0-9a-f]{64}$'");
                table.CheckConstraint("ck_evidence_snapshots_retention", "retain_until > captured_at");
                table.ForeignKey(
                    name: "FK_source_snapshots_documents_evidence_document_id",
                    column: x => x.evidence_document_id,
                    principalSchema: "evidence",
                    principalTable: "documents",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "ix_evidence_snapshots_payload_hash",
            schema: "evidence",
            table: "source_snapshots",
            column: "payload_sha256");

        migrationBuilder.CreateIndex(
            name: "ix_evidence_snapshots_retain_until",
            schema: "evidence",
            table: "source_snapshots",
            column: "retain_until");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "source_snapshots",
            schema: "evidence");
    }
}
