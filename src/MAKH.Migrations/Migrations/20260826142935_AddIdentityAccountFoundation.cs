using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class AddIdentityAccountFoundation : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "account");

        migrationBuilder.EnsureSchema(
            name: "iam");

        migrationBuilder.CreateTable(
            name: "trading_accounts",
            schema: "account",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                provider = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                provider_account_reference = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                mode = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                status = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                version = table.Column<long>(type: "bigint", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_trading_accounts", x => x.id);
                table.CheckConstraint("ck_trading_accounts_version", "version > 0");
            });

        migrationBuilder.CreateTable(
            name: "users",
            schema: "iam",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                disabled_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_users", x => x.id);
                table.CheckConstraint("ck_users_disabled_at", "disabled_at IS NULL OR disabled_at >= created_at");
            });

        migrationBuilder.CreateTable(
            name: "account_entitlements",
            schema: "account",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                account_id = table.Column<Guid>(type: "uuid", nullable: false),
                permission = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                effective_from = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                effective_to = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                allows_live_trading = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_account_entitlements", x => x.id);
                table.CheckConstraint("ck_account_entitlements_no_live", "allows_live_trading = FALSE");
                table.CheckConstraint("ck_account_entitlements_window", "effective_to IS NULL OR effective_to > effective_from");
                table.ForeignKey(
                    name: "FK_account_entitlements_trading_accounts_account_id",
                    column: x => x.account_id,
                    principalSchema: "account",
                    principalTable: "trading_accounts",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_account_entitlements_users_user_id",
                    column: x => x.user_id,
                    principalSchema: "iam",
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "external_identities",
            schema: "iam",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                user_id = table.Column<Guid>(type: "uuid", nullable: false),
                issuer = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                subject = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                linked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                last_authenticated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_external_identities", x => x.id);
                table.CheckConstraint("ck_external_identities_auth_time", "last_authenticated_at >= linked_at");
                table.ForeignKey(
                    name: "FK_external_identities_users_user_id",
                    column: x => x.user_id,
                    principalSchema: "iam",
                    principalTable: "users",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_account_entitlements_account_id",
            schema: "account",
            table: "account_entitlements",
            column: "account_id");

        migrationBuilder.CreateIndex(
            name: "ux_account_entitlements_effective_grant",
            schema: "account",
            table: "account_entitlements",
            columns: new[] { "user_id", "account_id", "permission", "effective_from" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_external_identities_user_id",
            schema: "iam",
            table: "external_identities",
            column: "user_id");

        migrationBuilder.CreateIndex(
            name: "ux_external_identities_issuer_subject",
            schema: "iam",
            table: "external_identities",
            columns: new[] { "issuer", "subject" },
            unique: true);

        migrationBuilder.CreateIndex(
            name: "ux_trading_accounts_provider_reference_mode",
            schema: "account",
            table: "trading_accounts",
            columns: new[] { "provider", "provider_account_reference", "mode" },
            unique: true);

        migrationBuilder.Sql("""
            ALTER TABLE iam.users OWNER TO makh_owner;
            ALTER TABLE iam.external_identities OWNER TO makh_owner;
            ALTER TABLE account.trading_accounts OWNER TO makh_owner;
            ALTER TABLE account.account_entitlements OWNER TO makh_owner;

            GRANT SELECT, INSERT, UPDATE, DELETE ON
                iam.users,
                iam.external_identities,
                account.trading_accounts,
                account.account_entitlements
            TO makh_runtime;

            GRANT SELECT ON
                iam.users,
                iam.external_identities,
                account.trading_accounts,
                account.account_entitlements
            TO makh_readonly;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "account_entitlements",
            schema: "account");

        migrationBuilder.DropTable(
            name: "external_identities",
            schema: "iam");

        migrationBuilder.DropTable(
            name: "trading_accounts",
            schema: "account");

        migrationBuilder.DropTable(
            name: "users",
            schema: "iam");
    }
}
