using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

/// <inheritdoc />
public partial class AddTransactionalOutbox : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.EnsureSchema(
            name: "platform");

        migrationBuilder.CreateTable(
            name: "outbox_messages",
            schema: "platform",
            columns: table => new
            {
                id = table.Column<Guid>(type: "uuid", nullable: false),
                account_id = table.Column<Guid>(type: "uuid", nullable: false),
                aggregate_id = table.Column<Guid>(type: "uuid", nullable: false),
                event_type = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                schema_version = table.Column<int>(type: "integer", nullable: false),
                stream_sequence = table.Column<long>(type: "bigint", nullable: false),
                occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                payload = table.Column<string>(type: "jsonb", nullable: false),
                published_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                attempt_count = table.Column<int>(type: "integer", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("pk_outbox_messages", x => x.id);
                table.CheckConstraint("ck_outbox_messages_attempt_count", "attempt_count >= 0");
                table.CheckConstraint("ck_outbox_messages_schema_version", "schema_version > 0");
                table.CheckConstraint("ck_outbox_messages_stream_sequence", "stream_sequence > 0");
                table.ForeignKey(
                    name: "FK_outbox_messages_trading_accounts_account_id",
                    column: x => x.account_id,
                    principalSchema: "account",
                    principalTable: "trading_accounts",
                    principalColumn: "id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "ix_outbox_unpublished",
            schema: "platform",
            table: "outbox_messages",
            columns: new[] { "published_at", "occurred_at" });

        migrationBuilder.CreateIndex(
            name: "ux_outbox_account_event_sequence",
            schema: "platform",
            table: "outbox_messages",
            columns: new[] { "account_id", "event_type", "stream_sequence" },
            unique: true);

        migrationBuilder.Sql("""
            ALTER TABLE platform.outbox_messages OWNER TO makh_owner;
            GRANT SELECT, INSERT, UPDATE, DELETE ON platform.outbox_messages TO makh_runtime;
            GRANT SELECT ON platform.outbox_messages TO makh_readonly;
            """);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "outbox_messages",
            schema: "platform");
    }
}
