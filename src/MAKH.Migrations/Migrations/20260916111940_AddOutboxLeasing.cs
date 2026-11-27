using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class AddOutboxLeasing : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ix_outbox_unpublished",
            schema: "platform",
            table: "outbox_messages");

        migrationBuilder.AddColumn<string>(
            name: "last_error",
            schema: "platform",
            table: "outbox_messages",
            type: "character varying(160)",
            maxLength: 160,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "lease_owner",
            schema: "platform",
            table: "outbox_messages",
            type: "character varying(160)",
            maxLength: 160,
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "lease_until",
            schema: "platform",
            table: "outbox_messages",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.AddColumn<DateTimeOffset>(
            name: "next_attempt_at",
            schema: "platform",
            table: "outbox_messages",
            type: "timestamp with time zone",
            nullable: true);

        migrationBuilder.Sql("""
            UPDATE platform.outbox_messages
            SET next_attempt_at = occurred_at
            WHERE next_attempt_at IS NULL;
            """);

        migrationBuilder.AlterColumn<DateTimeOffset>(
            name: "next_attempt_at",
            schema: "platform",
            table: "outbox_messages",
            type: "timestamp with time zone",
            nullable: false,
            oldClrType: typeof(DateTimeOffset),
            oldType: "timestamp with time zone",
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "ix_outbox_unpublished",
            schema: "platform",
            table: "outbox_messages",
            columns: new[] { "published_at", "next_attempt_at", "occurred_at" });
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "ix_outbox_unpublished",
            schema: "platform",
            table: "outbox_messages");

        migrationBuilder.DropColumn(
            name: "last_error",
            schema: "platform",
            table: "outbox_messages");

        migrationBuilder.DropColumn(
            name: "lease_owner",
            schema: "platform",
            table: "outbox_messages");

        migrationBuilder.DropColumn(
            name: "lease_until",
            schema: "platform",
            table: "outbox_messages");

        migrationBuilder.DropColumn(
            name: "next_attempt_at",
            schema: "platform",
            table: "outbox_messages");

        migrationBuilder.CreateIndex(
            name: "ix_outbox_unpublished",
            schema: "platform",
            table: "outbox_messages",
            columns: new[] { "published_at", "occurred_at" });
    }
}
