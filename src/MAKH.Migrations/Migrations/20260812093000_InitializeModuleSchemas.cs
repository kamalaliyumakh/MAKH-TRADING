using MAKH.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MAKH.Migrations.Migrations;

[DbContext(typeof(PlatformDbContext))]
[Migration("20260812093000_InitializeModuleSchemas")]
public sealed class InitializeModuleSchemas : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        foreach (var schema in DatabaseSchemas.All)
        {
            migrationBuilder.EnsureSchema(schema);
            migrationBuilder.Sql($$"""
                ALTER SCHEMA "{{schema}}" OWNER TO makh_owner;
                REVOKE ALL ON SCHEMA "{{schema}}" FROM PUBLIC;
                GRANT USAGE ON SCHEMA "{{schema}}" TO makh_runtime, makh_readonly;
                ALTER DEFAULT PRIVILEGES FOR ROLE makh_owner IN SCHEMA "{{schema}}"
                    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO makh_runtime;
                ALTER DEFAULT PRIVILEGES FOR ROLE makh_owner IN SCHEMA "{{schema}}"
                    GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO makh_runtime;
                ALTER DEFAULT PRIVILEGES FOR ROLE makh_owner IN SCHEMA "{{schema}}"
                    GRANT SELECT ON TABLES TO makh_readonly;
                """);
        }
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        throw new NotSupportedException("The schema foundation is roll-forward only; dropping module schemas could destroy data.");
}
