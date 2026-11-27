using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class AddSocialRetentionDeletionAudit : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "audit");

        migrationBuilder.CreateTable(
            name: "social_retention_deletions",
            schema: "audit",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                aggregate_record_id = table.Column<Guid>(type: "uuid", nullable: false),
                provider = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                aggregate_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                version = table.Column<int>(type: "integer", nullable: false),
                retain_until = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                reason = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                content_sha256 = table.Column<string>(type: "character(64)", fixedLength: true, maxLength: 64, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_social_retention_deletions", x => x.id);
                table.CheckConstraint("ck_social_retention_audit_hash", "content_sha256 ~ '^[0-9a-f]{64}$'");
                table.CheckConstraint("ck_social_retention_audit_reason", "reason = 'RetentionExpired'");
                table.CheckConstraint("ck_social_retention_audit_time", "deleted_at >= retain_until");
                table.CheckConstraint("ck_social_retention_audit_version", "version > 0");
            });

        migrationBuilder.CreateIndex(
            name: "ix_social_retention_deletions_deleted_at",
            schema: "audit",
            table: "social_retention_deletions",
            column: "deleted_at");

        migrationBuilder.CreateIndex(
            name: "ux_social_retention_deletions_aggregate_record",
            schema: "audit",
            table: "social_retention_deletions",
            column: "aggregate_record_id",
            unique: true);

        migrationBuilder.Sql("""
            ALTER TABLE audit.social_retention_deletions OWNER TO makh_owner;
            GRANT SELECT, INSERT ON audit.social_retention_deletions TO makh_runtime;
            GRANT SELECT ON audit.social_retention_deletions TO makh_readonly;
            REVOKE UPDATE, DELETE, TRUNCATE ON audit.social_retention_deletions FROM makh_runtime;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "social_retention_deletions",
            schema: "audit");
    }
}
