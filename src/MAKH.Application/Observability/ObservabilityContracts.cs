namespace MAKH.Application.Observability;

public enum ServiceLevelState { Healthy, AtRisk, Breached, Unknown }
public enum OperationalSeverity { Warning, Critical }
public enum OperationalAlertState { Open, Acknowledged, Resolved }

public sealed record ServiceLevelObjective
{
    public ServiceLevelObjective(string code, string service, decimal targetPercent, TimeSpan window, string runbook)
    {
        Code = Required(code, nameof(code));
        Service = Required(service, nameof(service));
        Runbook = Required(runbook, nameof(runbook));
        if (targetPercent <= 0m || targetPercent > 100m) throw new ArgumentOutOfRangeException(nameof(targetPercent));
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(window, TimeSpan.Zero);
        TargetPercent = targetPercent;
        Window = window;
    }
    public string Code { get; }
    public string Service { get; }
    public decimal TargetPercent { get; }
    public TimeSpan Window { get; }
    public string Runbook { get; }
    private static string Required(string value, string name) => string.IsNullOrWhiteSpace(value) ? throw new ArgumentException("Value is required.", name) : value.Trim();
}

public sealed record ServiceLevelMeasurement(string Code, long TotalEvents, long GoodEvents, DateTimeOffset WindowStart, DateTimeOffset WindowEnd);
public sealed record ServiceLevelResult(string Code, decimal? AchievedPercent, decimal? ErrorBudgetRemainingPercent, ServiceLevelState State, string Runbook);

public sealed record OperationalSignal
{
    public OperationalSignal(string environment, string service, string signalCode, bool healthy, DateTimeOffset observedAt,
        string correlationId, string traceId, string summary)
    {
        Environment = Safe(environment, nameof(environment), 40);
        Service = Safe(service, nameof(service), 80);
        SignalCode = Safe(signalCode, nameof(signalCode), 80);
        CorrelationId = Safe(correlationId, nameof(correlationId), 100);
        TraceId = Safe(traceId, nameof(traceId), 100);
        Summary = Safe(summary, nameof(summary), 300);
        Healthy = healthy;
        ObservedAt = observedAt;
    }
    public string Environment { get; }
    public string Service { get; }
    public string SignalCode { get; }
    public bool Healthy { get; }
    public DateTimeOffset ObservedAt { get; }
    public string CorrelationId { get; }
    public string TraceId { get; }
    public string Summary { get; }
    private static string Safe(string value, string name, int maximum)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? throw new ArgumentException("Value is required.", name) : value.Trim();
        if (normalized.Length > maximum || normalized.Contains('@') || normalized.Contains("token", StringComparison.OrdinalIgnoreCase) || normalized.Contains("secret", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Operational evidence contains prohibited or excessive material.", name);
        return normalized;
    }
}

public sealed record OperationalAlert(
    Guid AlertId, string DeduplicationKey, string Environment, string Service, string SignalCode,
    OperationalSeverity Severity, OperationalAlertState State, DateTimeOffset FirstObservedAt,
    DateTimeOffset LastObservedAt, int Occurrences, string Owner, string Runbook,
    string CorrelationId, string TraceId, string Summary, DateTimeOffset? AcknowledgedAt,
    string? AcknowledgedBy, string? AcknowledgementReason, int Sequence)
{
    public bool CreatesTradingAuthority => Sequence < 0;
}

public interface IOperationalAlertStore { T Execute<T>(Func<OperationalAlertStateStore, T> operation); }
public sealed class OperationalAlertStateStore
{
    public Dictionary<string, OperationalAlert> Alerts { get; } = new(StringComparer.Ordinal);
    public List<OperationalAlert> Audit { get; } = [];
}
