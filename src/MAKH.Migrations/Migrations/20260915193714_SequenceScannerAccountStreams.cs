using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class SequenceScannerAccountStreams : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<long>(
            name: "stream_sequence",
            schema: "scanner",
            table: "runs",
            type: "bigint",
            nullable: true);

        migrationBuilder.CreateTable(
            name: "account_streams",
            schema: "scanner",
            columns: table => new
            {
                account_id = table.Column<Guid>(type: "uuid", nullable: false),
                last_sequence = table.Column<long>(type: "bigint", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_scanner_account_streams", x => x.account_id);
                table.CheckConstraint("ck_scanner_account_streams_last_sequence", "last_sequence > 0");
                table.ForeignKey(
                    name: "FK_account_streams_trading_accounts_account_id",
                    column: x => x.account_id,
                    principalSchema: "account",
                    principalTable: "trading_accounts",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "ux_scanner_runs_account_sequence",
            schema: "scanner",
            table: "runs",
            columns: new[] { "account_id", "stream_sequence" },
            unique: true,
            filter: "account_id IS NOT NULL AND stream_sequence IS NOT NULL");

        migrationBuilder.AddCheckConstraint(
            name: "ck_scanner_runs_stream_sequence",
            schema: "scanner",
            table: "runs",
            sql: "stream_sequence IS NULL OR (account_id IS NOT NULL AND stream_sequence > 0)");

        migrationBuilder.Sql("""
            ALTER TABLE scanner.account_streams OWNER TO makh_owner;
            GRANT SELECT, INSERT, UPDATE, DELETE ON scanner.account_streams TO makh_runtime;
            GRANT SELECT ON scanner.account_streams TO makh_readonly;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "account_streams",
            schema: "scanner");

        migrationBuilder.DropIndex(
            name: "ux_scanner_runs_account_sequence",
            schema: "scanner",
            table: "runs");

        migrationBuilder.DropCheckConstraint(
            name: "ck_scanner_runs_stream_sequence",
            schema: "scanner",
            table: "runs");

        migrationBuilder.DropColumn(
            name: "stream_sequence",
            schema: "scanner",
            table: "runs");
    }
}
