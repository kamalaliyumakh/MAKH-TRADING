using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class AddScannerCorrectionLineageAndEvidencePersistence : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "evidence");

        migrationBuilder.CreateTable(
            name: "documents",
            schema: "evidence",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                security_id = table.Column<Guid>(type: "uuid", nullable: false),
                source_kind = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                headline = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                publisher = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                accession_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                excerpt = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                trust_state = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                provider = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                provider_record_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                canonical_uri = table.Column<string>(type: "character varying(2048)", maxLength: 2048, nullable: false),
                published_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                observed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                version = table.Column<int>(type: "integer", nullable: false),
                content_right = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                supersedes_record_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                content_sha256 = table.Column<string>(type: "character(64)", fixedLength: true, maxLength: 64, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_evidence_documents", x => x.id);
                table.CheckConstraint("ck_evidence_documents_content_hash", "content_sha256 ~ '^[0-9a-f]{64}$'");
                table.CheckConstraint("ck_evidence_documents_deleted_excerpt", "NOT is_deleted OR excerpt IS NULL");
                table.CheckConstraint("ck_evidence_documents_observation_time", "observed_at >= published_at");
                table.CheckConstraint("ck_evidence_documents_version", "version > 0");
            });

        migrationBuilder.CreateTable(
            name: "outbox_messages",
            schema: "evidence",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                evidence_document_id = table.Column<Guid>(type: "uuid", nullable: false),
                event_type = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                schema_version = table.Column<int>(type: "integer", nullable: false),
                occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                payload = table.Column<string>(type: "jsonb", nullable: false),
                published_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                attempt_count = table.Column<int>(type: "integer", nullable: false),
                lease_owner = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true),
                lease_until = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                next_attempt_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                last_error = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_evidence_outbox_messages", x => x.id);
                table.CheckConstraint("ck_evidence_outbox_attempt_count", "attempt_count >= 0");
                table.CheckConstraint("ck_evidence_outbox_schema_version", "schema_version > 0");
                table.ForeignKey(
                    name: "FK_outbox_messages_documents_evidence_document_id",
                    column: x => x.evidence_document_id,
                    principalSchema: "evidence",
                    principalTable: "documents",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "ix_evidence_documents_content_hash",
            schema: "evidence",
            table: "documents",
            column: "content_sha256");

        migrationBuilder.CreateIndex(
            name: "ix_evidence_documents_security_published",
            schema: "evidence",
            table: "documents",
            columns: new[] { "security_id", "published_at" });

        migrationBuilder.CreateIndex(
            name: "ux_evidence_documents_provider_record_version",
            schema: "evidence",
            table: "documents",
            columns: new[] { "provider", "provider_record_id", "version" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ix_evidence_outbox_unpublished",
            schema: "evidence",
            table: "outbox_messages",
            columns: new[] { "published_at", "next_attempt_at", "occurred_at" });

        migrationBuilder.CreateIndex(
            name: "ux_evidence_outbox_document",
            schema: "evidence",
            table: "outbox_messages",
            column: "evidence_document_id",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "outbox_messages",
            schema: "evidence");

        migrationBuilder.DropTable(
            name: "documents",
            schema: "evidence");
    }
}
