using MAKH.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

const string connectionVariable = "MAKH_POSTGRES_MIGRATION_CONNECTION";
var connectionString = Environment.GetEnvironmentVariable(connectionVariable);

if (string.IsNullOrWhiteSpace(connectionString))
{
    Console.Error.WriteLine($"Set {connectionVariable} for the deployment-only migration identity.");
    return 2;
}

var options = new DbContextOptionsBuilder<PlatformDbContext>()
    .UseNpgsql(
        connectionString,
        npgsql => npgsql.MigrationsAssembly(typeof(Program).Assembly.GetName().Name)
            .MigrationsHistoryTable("__ef_migrations_history", DatabaseSchemas.Platform))
    .Options;

await using var context = new PlatformDbContext(options);
await context.Database.MigrateAsync();
Console.WriteLine("MAKH PostgreSQL migrations applied successfully.");
return 0;
