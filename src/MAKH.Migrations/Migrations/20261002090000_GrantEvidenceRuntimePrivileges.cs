using MAKH.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

[DbContext(typeof(PlatformDbContext))]
[Migration("20261002090000_GrantEvidenceRuntimePrivileges")]
public sealed class GrantEvidenceRuntimePrivileges : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder) => migrationBuilder.Sql("""
        ALTER TABLE evidence.documents OWNER TO makh_owner;
        ALTER TABLE evidence.outbox_messages OWNER TO makh_owner;
        ALTER TABLE evidence.source_snapshots OWNER TO makh_owner;
        GRANT SELECT, INSERT, UPDATE, DELETE
            ON evidence.documents, evidence.outbox_messages, evidence.source_snapshots
            TO makh_runtime;
        GRANT SELECT
            ON evidence.documents, evidence.outbox_messages, evidence.source_snapshots
            TO makh_readonly;
        """);

    protected override void Down(MigrationBuilder migrationBuilder) =>
        throw new NotSupportedException(
            "Evidence table privileges are roll-forward only; revocation requires an approved replacement migration.");
}
