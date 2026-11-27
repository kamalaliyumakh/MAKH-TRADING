using MAKH.Infrastructure.Persistence;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class DatabaseConventionTests
{
    private static readonly string[] ExpectedSchemas =
    [
        "iam",
        "account",
        "market",
        "scanner",
        "evidence",
        "risk",
        "trading",
        "journal",
        "notification",
        "audit",
        "platform",
    ];

    [Fact]
    public void SchemaRegistryMatchesApprovedLogicalModel() =>
        Assert.Equal(ExpectedSchemas, DatabaseSchemas.All);

    [Fact]
    public void SchemaNamesAreUniqueLowercaseIdentifiers()
    {
        Assert.Equal(DatabaseSchemas.All.Count, DatabaseSchemas.All.Distinct(StringComparer.Ordinal).Count());
        Assert.All(
            DatabaseSchemas.All,
            schema => Assert.Matches("^[a-z][a-z0-9_]*$", schema));
    }

    [Fact]
    public void NamedSchemaConstantsMapToTheApprovedModuleBoundaries() =>
        Assert.Equal<string>(
            ExpectedSchemas,
            new[]
            {
                DatabaseSchemas.IdentityAndAccess,
                DatabaseSchemas.Accounts,
                DatabaseSchemas.Market,
                DatabaseSchemas.Scanner,
                DatabaseSchemas.Evidence,
                DatabaseSchemas.Risk,
                DatabaseSchemas.Trading,
                DatabaseSchemas.Journal,
                DatabaseSchemas.Notification,
                DatabaseSchemas.Audit,
                DatabaseSchemas.Platform,
            });
}
