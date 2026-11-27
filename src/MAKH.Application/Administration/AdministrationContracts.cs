namespace MAKH.Application.Administration;

public enum AdministrativeResource { UserAccess, Provider, MarketCalendar, RiskPolicy, Diagnostics }
public enum AdministrativeAction { View, CreateDraft, Publish, Disable, RunDiagnostic }

public sealed record AdministrativeContext
{
    public AdministrativeContext(Guid actorUserId, string role, bool freshMfa, DateTimeOffset elevatedAt,
        DateTimeOffset elevationExpiresAt, string reason, string correlationId)
    {
        if (actorUserId == Guid.Empty) throw new ArgumentException("Actor ID is required.", nameof(actorUserId));
        Role = Required(role, nameof(role));
        Reason = Required(reason, nameof(reason), 500);
        CorrelationId = Required(correlationId, nameof(correlationId), 100);
        if (elevatedAt == default || elevatedAt.Offset != TimeSpan.Zero
            || elevationExpiresAt == default || elevationExpiresAt.Offset != TimeSpan.Zero)
            throw new ArgumentException("Administrative elevation times must be non-default UTC values.");
        if (elevationExpiresAt <= elevatedAt || elevationExpiresAt > elevatedAt.AddHours(1))
            throw new ArgumentException("Administrative elevation must expire within one hour.");
        ActorUserId = actorUserId;
        FreshMfa = freshMfa;
        ElevatedAt = elevatedAt;
        ElevationExpiresAt = elevationExpiresAt;
    }

    public Guid ActorUserId { get; }
    public string Role { get; }
    public bool FreshMfa { get; }
    public DateTimeOffset ElevatedAt { get; }
    public DateTimeOffset ElevationExpiresAt { get; }
    public string Reason { get; }
    public string CorrelationId { get; }

    private static string Required(string value, string name, int maximum = 80)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? throw new ArgumentException("Value is required.", name) : value.Trim();
        if (normalized.Length > maximum || normalized.Contains('@') || normalized.Any(char.IsControl)
            || normalized.Contains("token", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("secret", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Value is excessive or contains prohibited material.", name);
        return normalized;
    }
}

public sealed record AdministrativeCommand
{
    public AdministrativeCommand(Guid commandId, AdministrativeResource resource, AdministrativeAction action,
        string resourceId, string expectedVersion, string proposedVersion, string proposedSummary)
    {
        if (commandId == Guid.Empty) throw new ArgumentException("Command ID is required.", nameof(commandId));
        if (!Enum.IsDefined(resource)) throw new ArgumentOutOfRangeException(nameof(resource));
        if (!Enum.IsDefined(action)) throw new ArgumentOutOfRangeException(nameof(action));
        ResourceId = Required(resourceId, nameof(resourceId));
        ExpectedVersion = Required(expectedVersion, nameof(expectedVersion));
        ProposedVersion = Required(proposedVersion, nameof(proposedVersion));
        ProposedSummary = Required(proposedSummary, nameof(proposedSummary), 500);
        CommandId = commandId;
        Resource = resource;
        Action = action;
    }

    public Guid CommandId { get; }
    public AdministrativeResource Resource { get; }
    public AdministrativeAction Action { get; }
    public string ResourceId { get; }
    public string ExpectedVersion { get; }
    public string ProposedVersion { get; }
    public string ProposedSummary { get; }

    private static string Required(string value, string name, int maximum = 120)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? throw new ArgumentException("Value is required.", name) : value.Trim();
        if (normalized.Length > maximum || normalized.Contains('@') || normalized.Any(char.IsControl)
            || normalized.Contains("token", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("secret", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Administrative evidence contains prohibited or excessive material.", name);
        return normalized;
    }
}

public sealed record AdministrativeResult(
    Guid CommandId, AdministrativeResource Resource, AdministrativeAction Action, string ResourceId,
    string BeforeSha256, string AfterSha256, Guid ActorUserId, DateTimeOffset OccurredAt,
    string Reason, string CorrelationId, int Sequence)
{
    public bool CreatesTradingAuthority => Sequence < 0;
    public bool ContainsCredentials => Sequence < 0;
}

public interface IAdministrationStore
{
    T Execute<T>(Func<AdministrationState, T> operation);
}

public sealed class AdministrationState
{
    public Dictionary<(AdministrativeResource Resource, string Id), (string Version, string Summary)> Resources { get; } = [];
    public Dictionary<Guid, (AdministrativeCommand Command, Guid ActorUserId, AdministrativeResult Result)> Commands { get; } = [];
    public List<AdministrativeResult> Audit { get; } = [];
}
