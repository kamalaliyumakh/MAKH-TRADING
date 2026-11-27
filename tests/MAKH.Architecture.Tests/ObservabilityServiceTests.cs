using MAKH.Application.Observability;
using MAKH.Infrastructure.Observability;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class ObservabilityServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 13, 17, 0, 0, TimeSpan.Zero);
    private readonly ObservabilityService service = new(new InMemoryOperationalAlertStore());

    [Fact] public void HealthySloHasRemainingBudget() { var result = Evaluate(1000, 1000); Assert.Equal(ServiceLevelState.Healthy, result.State); Assert.Equal(100m, result.AchievedPercent); Assert.Equal(100m, result.ErrorBudgetRemainingPercent); }
    [Fact] public void ExactTargetIsAtRiskAfterBudgetConsumption() => Assert.Equal(ServiceLevelState.AtRisk, Evaluate(999, 1000).State);
    [Fact] public void BreachedSloIsDetected() { var result = Evaluate(998, 1000); Assert.Equal(ServiceLevelState.Breached, result.State); Assert.Equal(99.8m, result.AchievedPercent); }
    [Fact] public void EmptyMeasurementIsUnknown() => Assert.Equal(ServiceLevelState.Unknown, Evaluate(0, 0).State);
    [Fact] public void InvalidCountsRejected() => Assert.Throws<ArgumentException>(() => Evaluate(11, 10));
    [Fact] public void MismatchedSloCodeRejected() => Assert.Throws<ArgumentException>(() => ObservabilityService.Evaluate(Objective(), new("other", 10, 10, Now.AddHours(-1), Now)));
    [Fact] public void InvalidWindowRejected() => Assert.Throws<ArgumentException>(() => ObservabilityService.Evaluate(Objective(), new("api.availability", 10, 10, Now.AddDays(-40), Now)));
    [Fact] public void CriticalDependencyAlertIsRouted() { var alert = service.Record(Signal("broker.unknown")); Assert.Equal(OperationalSeverity.Critical, alert.Severity); Assert.Equal("RB-BROKER-001", alert.Runbook); Assert.Equal("Trading Operations", alert.Owner); }
    [Fact] public void SecurityAlertIsWarningRouted() { var alert = service.Record(Signal("auth.denial-surge")); Assert.Equal(OperationalSeverity.Warning, alert.Severity); Assert.Equal("Security", alert.Owner); }
    [Fact] public void HealthySignalCannotCreateAlert() => Assert.Throws<InvalidOperationException>(() => service.Record(new("test", "api", "api.unavailable", true, Now, "corr", "trace", "healthy")));
    [Fact] public void UnknownSignalFailsClosed() => Assert.Throws<InvalidOperationException>(() => service.Record(Signal("unknown.signal")));
    [Fact] public void DuplicateSignalDeduplicatesAndCounts() { var first = service.Record(Signal("api.unavailable")); var second = service.Record(Signal("api.unavailable", Now.AddMinutes(1))); Assert.Equal(first.AlertId, second.AlertId); Assert.Equal(2, second.Occurrences); Assert.Equal(2, service.Audit().Count); }
    [Fact] public void ExactSignalReplayIsIdempotent() { var first = service.Record(Signal("api.unavailable")); var replay = service.Record(Signal("api.unavailable")); Assert.Equal(first, replay); Assert.Single(service.Audit()); }
    [Fact] public void StaleSignalCannotReplaceNewerEvidence() { var latest = service.Record(Signal("api.unavailable", Now.AddMinutes(2))); Assert.Throws<InvalidOperationException>(() => service.Record(Signal("api.unavailable", Now))); Assert.Equal(latest, service.Audit().Single()); }
    [Fact] public void SameTimeConflictingSignalFailsClosed() { service.Record(Signal("api.unavailable")); var conflicting = new OperationalSignal("test", "api", "api.unavailable", false, Now, "other-corr", "other-trace", "different failure"); Assert.Throws<InvalidOperationException>(() => service.Record(conflicting)); Assert.Single(service.Audit()); }
    [Fact] public void DifferentEnvironmentDoesNotDeduplicate() { var first = service.Record(Signal("api.unavailable")); var second = service.Record(new("staging", "api", "api.unavailable", false, Now, "corr", "trace", "unavailable")); Assert.NotEqual(first.AlertId, second.AlertId); }
    [Fact] public void AcknowledgementRecordsActorReasonAndTime() { var alert = service.Record(Signal("risk.failure")); var ack = service.Acknowledge(alert.DeduplicationKey, "operator-1", "incident opened", Now.AddMinutes(2)); Assert.Equal(OperationalAlertState.Acknowledged, ack.State); Assert.Equal("operator-1", ack.AcknowledgedBy); Assert.Equal("incident opened", ack.AcknowledgementReason); }
    [Fact] public void AcknowledgementCannotPredateLatestSignal() { var alert = service.Record(Signal("risk.failure", Now.AddMinutes(2))); Assert.Throws<InvalidOperationException>(() => service.Acknowledge(alert.DeduplicationKey, "operator-1", "incident opened", Now)); Assert.Single(service.Audit()); }
    [Fact] public void AcknowledgementSecretRejected() { var alert = service.Record(Signal("risk.failure")); Assert.Throws<ArgumentException>(() => service.Acknowledge(alert.DeduplicationKey, "operator", "token copied", Now)); }
    [Fact] public void SignalSecretAndAddressRejected() { Assert.Throws<ArgumentException>(() => new OperationalSignal("test", "api", "risk.failure", false, Now, "corr", "trace", "secret value")); Assert.Throws<ArgumentException>(() => new OperationalSignal("test", "api", "risk.failure", false, Now, "corr", "trace", "person@example.com")); }
    [Fact] public void AlertHasCorrelationTraceAndFalseAuthority() { var alert = service.Record(Signal("reconciliation.mismatch")); Assert.Equal("corr", alert.CorrelationId); Assert.Equal("trace", alert.TraceId); Assert.False(alert.CreatesTradingAuthority); }
    [Fact] public void NonUtcMeasurementAndSignalTimesFailClosed() { Assert.Throws<ArgumentException>(() => ObservabilityService.Evaluate(Objective(), new("api.availability", 10, 10, Now.AddHours(-1).ToOffset(TimeSpan.FromHours(1)), Now.ToOffset(TimeSpan.FromHours(1))))); Assert.Throws<ArgumentException>(() => service.Record(new("test", "api", "api.unavailable", false, Now.ToOffset(TimeSpan.FromHours(1)), "corr", "trace", "failure"))); }
    [Fact] public void LengthPrefixedDeduplicationSeparatesFieldBoundaries() { var first = service.Record(new("test|api", "worker", "api.unavailable", false, Now, "corr", "trace", "failure")); var second = service.Record(new("test", "api|worker", "api.unavailable", false, Now, "corr", "trace", "failure")); Assert.NotEqual(first.DeduplicationKey, second.DeduplicationKey); }
    [Fact] public void ExactAcknowledgementReplayIsIdempotentAndChangedEvidenceConflicts() { var alert = service.Record(Signal("risk.failure")); var first = service.Acknowledge(alert.DeduplicationKey, "operator-1", "incident opened", Now.AddMinutes(1)); var replay = service.Acknowledge(alert.DeduplicationKey, "operator-1", "incident opened", Now.AddMinutes(1)); Assert.Equal(first, replay); Assert.Equal(2, service.Audit().Count); Assert.Throws<InvalidOperationException>(() => service.Acknowledge(alert.DeduplicationKey, "operator-2", "incident reassigned", Now.AddMinutes(2))); Assert.Equal(2, service.Audit().Count); }
    [Fact] public void NewEvidenceReopensAcknowledgedAlertAndClearsStaleAcknowledgement() { var alert = service.Record(Signal("risk.failure")); service.Acknowledge(alert.DeduplicationKey, "operator-1", "incident opened", Now.AddMinutes(1)); var reopened = service.Record(Signal("risk.failure", Now.AddMinutes(2))); Assert.Equal(OperationalAlertState.Open, reopened.State); Assert.Null(reopened.AcknowledgedAt); Assert.Null(reopened.AcknowledgedBy); Assert.Null(reopened.AcknowledgementReason); }
    [Fact] public void AcknowledgementRequiresUtcAndRejectsControlOrAddressMaterial() { var alert = service.Record(Signal("risk.failure")); Assert.Throws<ArgumentException>(() => service.Acknowledge(alert.DeduplicationKey, "operator", "incident opened", Now.AddMinutes(1).ToOffset(TimeSpan.FromHours(1)))); Assert.Throws<ArgumentException>(() => service.Acknowledge(alert.DeduplicationKey, "operator\nforged", "incident opened", Now.AddMinutes(1))); Assert.Throws<ArgumentException>(() => service.Acknowledge(alert.DeduplicationKey, "operator@example.com", "incident opened", Now.AddMinutes(1))); }

    private static ServiceLevelObjective Objective() => new("api.availability", "api", 99.9m, TimeSpan.FromDays(30), "RB-API-001");
    private static ServiceLevelResult Evaluate(long good, long total) => ObservabilityService.Evaluate(Objective(), new("api.availability", total, good, Now.AddDays(-1), Now));
    private static OperationalSignal Signal(string code, DateTimeOffset? at = null) => new("test", "api", code, false, at ?? Now, "corr", "trace", "synthetic failure");
}
