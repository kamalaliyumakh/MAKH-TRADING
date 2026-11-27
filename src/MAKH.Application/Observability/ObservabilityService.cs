using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace MAKH.Application.Observability;

public sealed class ObservabilityService(IOperationalAlertStore store)
{
    private static readonly Dictionary<string, (OperationalSeverity Severity, string Owner, string Runbook)> Routes =
        new Dictionary<string, (OperationalSeverity, string, string)>(StringComparer.Ordinal)
        {
            ["api.unavailable"] = (OperationalSeverity.Critical, "Operations", "RB-API-001"),
            ["database.unavailable"] = (OperationalSeverity.Critical, "Data/Operations", "RB-DB-001"),
            ["market.stale"] = (OperationalSeverity.Critical, "Data Operations", "RB-MARKET-001"),
            ["broker.unknown"] = (OperationalSeverity.Critical, "Trading Operations", "RB-BROKER-001"),
            ["reconciliation.mismatch"] = (OperationalSeverity.Critical, "Trading Operations", "RB-RECON-001"),
            ["risk.failure"] = (OperationalSeverity.Critical, "Risk/Operations", "RB-RISK-001"),
            ["auth.denial-surge"] = (OperationalSeverity.Warning, "Security", "RB-AUTH-001"),
            ["telemetry.gap"] = (OperationalSeverity.Warning, "Platform Operations", "RB-OTEL-001"),
        };

    public static ServiceLevelResult Evaluate(ServiceLevelObjective objective, ServiceLevelMeasurement measurement)
    {
        ArgumentNullException.ThrowIfNull(objective);
        ArgumentNullException.ThrowIfNull(measurement);
        if (!StringComparer.Ordinal.Equals(objective.Code, measurement.Code)) throw new ArgumentException("SLO and measurement codes must match.");
        if (measurement.TotalEvents < 0 || measurement.GoodEvents < 0 || measurement.GoodEvents > measurement.TotalEvents) throw new ArgumentException("Measurement counts are invalid.");
        if (measurement.WindowStart == default || measurement.WindowStart.Offset != TimeSpan.Zero ||
            measurement.WindowEnd == default || measurement.WindowEnd.Offset != TimeSpan.Zero)
            throw new ArgumentException("Measurement window must use non-default UTC timestamps.");
        if (measurement.WindowEnd <= measurement.WindowStart || measurement.WindowEnd - measurement.WindowStart > objective.Window) throw new ArgumentException("Measurement window is invalid.");
        if (measurement.TotalEvents == 0) return new(objective.Code, null, null, ServiceLevelState.Unknown, objective.Runbook);
        var achieved = decimal.Round(100m * measurement.GoodEvents / measurement.TotalEvents, 4, MidpointRounding.ToEven);
        var allowedFailure = 100m - objective.TargetPercent;
        var actualFailure = 100m - achieved;
        var remaining = allowedFailure == 0m ? (actualFailure == 0m ? 100m : 0m) : decimal.Round(100m * (allowedFailure - actualFailure) / allowedFailure, 2, MidpointRounding.ToEven);
        var state = achieved < objective.TargetPercent ? ServiceLevelState.Breached : remaining <= 25m ? ServiceLevelState.AtRisk : ServiceLevelState.Healthy;
        return new(objective.Code, achieved, remaining, state, objective.Runbook);
    }

    public OperationalAlert Record(OperationalSignal signal)
    {
        ArgumentNullException.ThrowIfNull(signal);
        if (signal.Healthy) throw new InvalidOperationException("Healthy signals do not create alerts.");
        if (signal.ObservedAt == default || signal.ObservedAt.Offset != TimeSpan.Zero)
            throw new ArgumentException("Operational signal time must be non-default UTC.", nameof(signal));
        if (!Routes.TryGetValue(signal.SignalCode, out var route)) throw new InvalidOperationException("Unknown signal is not routable and fails closed.");
        var key = Key(signal.Environment, signal.Service, signal.SignalCode);
        return store.Execute(state =>
        {
            if (state.Alerts.TryGetValue(key, out var existing) && existing.State != OperationalAlertState.Resolved)
            {
                if (signal.ObservedAt < existing.LastObservedAt)
                    throw new InvalidOperationException("Stale operational signal cannot replace newer alert evidence.");
                if (signal.ObservedAt == existing.LastObservedAt)
                {
                    if (StringComparer.Ordinal.Equals(signal.CorrelationId, existing.CorrelationId) &&
                        StringComparer.Ordinal.Equals(signal.TraceId, existing.TraceId) &&
                        StringComparer.Ordinal.Equals(signal.Summary, existing.Summary))
                        return existing;
                    throw new InvalidOperationException("Conflicting operational signal exists at the observed timestamp.");
                }
                var repeated = existing with
                {
                    State = OperationalAlertState.Open,
                    LastObservedAt = signal.ObservedAt,
                    Occurrences = checked(existing.Occurrences + 1),
                    CorrelationId = signal.CorrelationId,
                    TraceId = signal.TraceId,
                    Summary = signal.Summary,
                    AcknowledgedAt = null,
                    AcknowledgedBy = null,
                    AcknowledgementReason = null,
                    Sequence = state.Audit.Count + 1,
                };
                state.Alerts[key] = repeated;
                state.Audit.Add(repeated);
                return repeated;
            }
            var created = new OperationalAlert(Guid.NewGuid(), key, signal.Environment, signal.Service, signal.SignalCode,
                route.Severity, OperationalAlertState.Open, signal.ObservedAt, signal.ObservedAt, 1, route.Owner, route.Runbook,
                signal.CorrelationId, signal.TraceId, signal.Summary, null, null, null, state.Audit.Count + 1);
            state.Alerts[key] = created;
            state.Audit.Add(created);
            return created;
        });
    }

    public OperationalAlert Acknowledge(string deduplicationKey, string actor, string reason, DateTimeOffset at) => store.Execute(state =>
    {
        if (!state.Alerts.TryGetValue(deduplicationKey, out var alert) || alert.State == OperationalAlertState.Resolved) throw new InvalidOperationException("Open alert is required.");
        if (at == default || at.Offset != TimeSpan.Zero) throw new ArgumentException("Acknowledgement time must be non-default UTC.", nameof(at));
        if (at < alert.LastObservedAt) throw new InvalidOperationException("Acknowledgement cannot predate the latest alert evidence.");
        var safeActor = Safe(actor, nameof(actor)); var safeReason = Safe(reason, nameof(reason));
        if (alert.State == OperationalAlertState.Acknowledged)
        {
            if (alert.AcknowledgedAt == at && StringComparer.Ordinal.Equals(alert.AcknowledgedBy, safeActor) &&
                StringComparer.Ordinal.Equals(alert.AcknowledgementReason, safeReason)) return alert;
            throw new InvalidOperationException("Acknowledgement evidence is immutable after acceptance.");
        }
        var acknowledged = alert with { State = OperationalAlertState.Acknowledged, AcknowledgedAt = at, AcknowledgedBy = safeActor, AcknowledgementReason = safeReason, Sequence = state.Audit.Count + 1 };
        state.Alerts[deduplicationKey] = acknowledged; state.Audit.Add(acknowledged); return acknowledged;
    });

    public IReadOnlyList<OperationalAlert> Audit() => store.Execute(state => state.Audit.ToArray());
    private static string Key(string environment, string service, string code)
    {
        var canonical = string.Create(CultureInfo.InvariantCulture, $"{environment.Length}:{environment}{service.Length}:{service}{code.Length}:{code}");
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)));
    }

    private static string Safe(string value, string name)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? throw new ArgumentException("Acknowledgement evidence is invalid.", name) : value.Trim();
        if (normalized.Length > 300 || normalized.Contains('@') || normalized.Any(char.IsControl) ||
            normalized.Contains("token", StringComparison.OrdinalIgnoreCase) || normalized.Contains("secret", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Acknowledgement evidence is invalid.", name);
        return normalized;
    }
}
