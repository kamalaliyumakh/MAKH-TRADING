using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class AddSocialAttentionPersistence : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "social_attention_aggregates",
            schema: "evidence",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                security_id = table.Column<Guid>(type: "uuid", nullable: false),
                mention_count = table.Column<long>(type: "bigint", nullable: false),
                distinct_author_estimate = table.Column<long>(type: "bigint", nullable: false),
                attention_change_percent = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                confidence = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                manipulation_risk = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                limitation_label = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                provider = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                aggregate_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                window_start = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                window_end = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                observed_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                version = table.Column<int>(type: "integer", nullable: false),
                method = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                supersedes_aggregate_id = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                is_deleted = table.Column<bool>(type: "boolean", nullable: false),
                retain_until = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                content_sha256 = table.Column<string>(type: "character(64)", fixedLength: true, maxLength: 64, nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_social_attention_aggregates", x => x.id);
                table.CheckConstraint("ck_social_attention_authors", "distinct_author_estimate <= mention_count");
                table.CheckConstraint("ck_social_attention_content_hash", "content_sha256 ~ '^[0-9a-f]{64}$'");
                table.CheckConstraint("ck_social_attention_deleted_metrics", "NOT is_deleted OR (mention_count = 0 AND distinct_author_estimate = 0 AND attention_change_percent = 0)");
                table.CheckConstraint("ck_social_attention_nonnegative", "mention_count >= 0 AND distinct_author_estimate >= 0");
                table.CheckConstraint("ck_social_attention_observation", "observed_at >= window_end");
                table.CheckConstraint("ck_social_attention_retention", "retain_until > observed_at");
                table.CheckConstraint("ck_social_attention_version", "version > 0");
                table.CheckConstraint("ck_social_attention_window", "window_end > window_start");
            });

        migrationBuilder.CreateIndex(
            name: "ix_social_attention_retain_until",
            schema: "evidence",
            table: "social_attention_aggregates",
            column: "retain_until");

        migrationBuilder.CreateIndex(
            name: "ix_social_attention_security_window",
            schema: "evidence",
            table: "social_attention_aggregates",
            columns: new[] { "security_id", "window_end" });

        migrationBuilder.CreateIndex(
            name: "ux_social_attention_provider_aggregate_version",
            schema: "evidence",
            table: "social_attention_aggregates",
            columns: new[] { "provider", "aggregate_id", "version" },
            unique: true);

        migrationBuilder.Sql("""
            ALTER TABLE evidence.social_attention_aggregates OWNER TO makh_owner;
            GRANT SELECT, INSERT, UPDATE, DELETE
                ON evidence.social_attention_aggregates TO makh_runtime;
            GRANT SELECT ON evidence.social_attention_aggregates TO makh_readonly;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "social_attention_aggregates",
            schema: "evidence");
    }
}
