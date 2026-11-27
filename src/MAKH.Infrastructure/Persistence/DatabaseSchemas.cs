namespace MAKH.Infrastructure.Persistence;

public static class DatabaseSchemas
{
    public const string IdentityAndAccess = "iam";
    public const string Accounts = "account";
    public const string Market = "market";
    public const string Scanner = "scanner";
    public const string Evidence = "evidence";
    public const string Risk = "risk";
    public const string Trading = "trading";
    public const string Journal = "journal";
    public const string Notification = "notification";
    public const string Audit = "audit";
    public const string Platform = "platform";

    public static readonly IReadOnlyList<string> All =
    [
        IdentityAndAccess,
        Accounts,
        Market,
        Scanner,
        Evidence,
        Risk,
        Trading,
        Journal,
        Notification,
        Audit,
        Platform,
    ];
}
