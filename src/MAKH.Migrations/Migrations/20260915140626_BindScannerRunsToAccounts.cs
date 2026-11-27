using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class BindScannerRunsToAccounts : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "account_id",
            schema: "scanner",
            table: "runs",
            type: "uuid",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "ix_scanner_runs_account_id",
            schema: "scanner",
            table: "runs",
            columns: new[] { "account_id", "id" });

        migrationBuilder.AddForeignKey(
            name: "FK_runs_trading_accounts_account_id",
            schema: "scanner",
            table: "runs",
            column: "account_id",
            principalSchema: "account",
            principalTable: "trading_accounts",
            principalColumn: "id",
            onDelete: ReferentialAction.Restrict);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_runs_trading_accounts_account_id",
            schema: "scanner",
            table: "runs");

        migrationBuilder.DropIndex(
            name: "ix_scanner_runs_account_id",
            schema: "scanner",
            table: "runs");

        migrationBuilder.DropColumn(
            name: "account_id",
            schema: "scanner",
            table: "runs");
    }
}
