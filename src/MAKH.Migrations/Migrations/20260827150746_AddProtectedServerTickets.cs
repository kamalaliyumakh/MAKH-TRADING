using MAKH.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

[DbContext(typeof(PlatformDbContext))]
[Migration("20260827150746_AddProtectedServerTickets")]
public sealed class AddProtectedServerTickets : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.Sql("DELETE FROM iam.user_sessions;");

        migrationBuilder.AddColumn<byte[]>(
            name: "protected_ticket", schema: "iam", table: "user_sessions",
            type: "bytea", nullable: false, defaultValue: Array.Empty<byte>());

        migrationBuilder.AddColumn<byte[]>(
            name: "ticket_key_hash", schema: "iam", table: "user_sessions",
            type: "bytea", nullable: false, defaultValue: Array.Empty<byte>());

        migrationBuilder.CreateIndex(
            name: "ux_user_sessions_ticket_key_hash", schema: "iam",
            table: "user_sessions", column: "ticket_key_hash", unique: true);

        migrationBuilder.AddCheckConstraint(
            name: "ck_user_sessions_ticket_key_hash", schema: "iam",
            table: "user_sessions", sql: "octet_length(ticket_key_hash) = 32");

        migrationBuilder.AddCheckConstraint(
            name: "ck_user_sessions_ticket_payload", schema: "iam",
            table: "user_sessions", sql: "octet_length(protected_ticket) BETWEEN 1 AND 65536");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ux_user_sessions_ticket_key_hash", schema: "iam", table: "user_sessions");
        migrationBuilder.DropCheckConstraint(
            name: "ck_user_sessions_ticket_key_hash", schema: "iam", table: "user_sessions");
        migrationBuilder.DropCheckConstraint(
            name: "ck_user_sessions_ticket_payload", schema: "iam", table: "user_sessions");
        migrationBuilder.DropColumn(
            name: "protected_ticket", schema: "iam", table: "user_sessions");
        migrationBuilder.DropColumn(
            name: "ticket_key_hash", schema: "iam", table: "user_sessions");
    }
}
