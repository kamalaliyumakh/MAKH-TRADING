using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class AddDurableUserSessions : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "user_sessions",
            schema: "iam",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                issued_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                last_seen_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                version = table.Column<long>(type: "bigint", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_user_sessions", x => x.id);
                table.CheckConstraint("ck_user_sessions_last_seen", "last_seen_at >= issued_at AND last_seen_at <= expires_at");
                table.CheckConstraint("ck_user_sessions_revoked", "revoked_at IS NULL OR revoked_at >= issued_at");
                table.CheckConstraint("ck_user_sessions_version", "version > 0");
                table.CheckConstraint("ck_user_sessions_window", "expires_at > issued_at");
                table.ForeignKey(
                    name: "FK_user_sessions_users_user_id",
                    column: x => x.user_id,
                    principalSchema: "iam",
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "ix_user_sessions_user_expiry",
            schema: "iam",
            table: "user_sessions",
            columns: new[] { "user_id", "expires_at" });

        migrationBuilder.Sql("ALTER TABLE iam.user_sessions OWNER TO makh_owner;");
        migrationBuilder.Sql("GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE iam.user_sessions TO makh_runtime;");
        migrationBuilder.Sql("GRANT SELECT ON TABLE iam.user_sessions TO makh_readonly;");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "user_sessions",
            schema: "iam");
    }
}
