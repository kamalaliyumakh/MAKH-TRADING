using MAKH.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

[DbContext(typeof(PlatformDbContext))]
[Migration("20260917090342_AddScannerCorrectionLineage")]
public sealed class AddScannerCorrectionLineage : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "correction_reason",
            schema: "scanner",
            table: "runs",
            type: "character varying(500)",
            maxLength: 500,
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "supersedes_run_id",
            schema: "scanner",
            table: "runs",
            type: "uuid",
            nullable: true);

        migrationBuilder.AddCheckConstraint(
            name: "ck_scanner_runs_correction_lineage",
            schema: "scanner",
            table: "runs",
            sql: "(supersedes_run_id IS NULL AND correction_reason IS NULL) OR (supersedes_run_id IS NOT NULL AND correction_reason IS NOT NULL AND length(trim(correction_reason)) BETWEEN 1 AND 500)");

        migrationBuilder.CreateIndex(
            name: "ux_scanner_runs_supersedes_run_id",
            schema: "scanner",
            table: "runs",
            column: "supersedes_run_id",
            unique: true,
            filter: "supersedes_run_id IS NOT NULL");

        migrationBuilder.AddForeignKey(
            name: "FK_runs_runs_supersedes_run_id",
            schema: "scanner",
            table: "runs",
            column: "supersedes_run_id",
            principalSchema: "scanner",
            principalTable: "runs",
            principalColumn: "id",
            onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(
            name: "FK_runs_runs_supersedes_run_id",
            schema: "scanner",
            table: "runs");

        migrationBuilder.DropIndex(
            name: "ux_scanner_runs_supersedes_run_id",
            schema: "scanner",
            table: "runs");

        migrationBuilder.DropCheckConstraint(
            name: "ck_scanner_runs_correction_lineage",
            schema: "scanner",
            table: "runs");

        migrationBuilder.DropColumn(
            name: "correction_reason",
            schema: "scanner",
            table: "runs");

        migrationBuilder.DropColumn(
            name: "supersedes_run_id",
            schema: "scanner",
            table: "runs");
    }
}
