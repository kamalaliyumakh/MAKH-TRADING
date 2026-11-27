using MAKH.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace MAKH.Migrations;

public sealed class PlatformDbContextFactory : IDesignTimeDbContextFactory<PlatformDbContext>
{
    public PlatformDbContext CreateDbContext(string[] args)
    {
        var connectionString = args.FirstOrDefault()
            ?? "Host=localhost;Database=makh_design;Username=makh_migrator;Password=design-time-only";

        var options = new DbContextOptionsBuilder<PlatformDbContext>()
            .UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsAssembly(typeof(PlatformDbContextFactory).Assembly.GetName().Name)
                    .MigrationsHistoryTable("__ef_migrations_history", DatabaseSchemas.Platform))
            .Options;

        return new PlatformDbContext(options);
    }
}
