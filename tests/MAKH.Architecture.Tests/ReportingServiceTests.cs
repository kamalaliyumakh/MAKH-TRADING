using MAKH.Application.Reporting;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class ReportingServiceTests
{
    private readonly Guid account = Guid.NewGuid();
    private readonly Guid security = Guid.NewGuid();
    private static readonly DateTimeOffset Noon = new(2026, 8, 13, 12, 0, 0, TimeSpan.Zero);

    [Fact] public void ReconcilesDailyExecutionTotals() { var report = Build([Execution("e1", "Momentum", 10, 50m, 1m, 5m), Execution("e2", "Momentum", 20, 120m, 2m, -3m)]); Assert.Equal((2, 30L, 170m, 3m, 2m), (report.ExecutionCount, report.Quantity, report.GrossAmount, report.Fees, report.RealizedPnl)); }
    [Fact] public void AggregatesStrategiesDeterministically() { var report = Build([Execution("e2", "Reversal", 4, 20m, 1m, -2m), Execution("e1", "Momentum", 5, 30m, 1m, 3m)]); Assert.Equal(["Momentum", "Reversal"], report.Strategies.Select(x => x.Strategy)); }
    [Fact] public void FiltersOtherAccounts() { var other = new ReportExecution("other", Guid.NewGuid(), security, "Momentum", 10, 50m, 1m, 2m, Noon); Assert.Empty(Build([other]).Executions); }
    [Fact] public void FiltersOutsideTradingDate() { var prior = new ReportExecution("prior", account, security, "Momentum", 10, 50m, 1m, 2m, Noon.AddDays(-1)); Assert.Empty(Build([prior]).Executions); }
    [Fact] public void AppliesTradingTimezoneBoundary() { var nearMidnight = new ReportExecution("e1", account, security, "Momentum", 1, 5m, 0m, 1m, new(2026, 8, 12, 23, 30, 0, TimeSpan.Zero)); var report = ReportingService.BuildDaily(Guid.NewGuid(), account, new(2026, 8, 13), TimeZoneInfo.CreateCustomTimeZone("WAT", TimeSpan.FromHours(1), "WAT", "WAT"), Noon, [nearMidnight], [], [Quality("feed", ReportQuality.Complete)]); Assert.Single(report.Executions); }
    [Fact] public void RejectsDuplicateExecutionIdentity() { var item = Execution("same", "Momentum", 1, 5m, 0m, 1m); Assert.Throws<InvalidOperationException>(() => Build([item, item])); }
    [Fact] public void RejectsDuplicateDecisionIdentity() { var item = Adherence("same", "PRICE", AdherenceOutcome.Passed); Assert.Throws<InvalidOperationException>(() => Build([], [item, item])); }
    [Fact] public void CountsAdherenceOutcomes() { var report = Build([], [Adherence("d1", "PRICE", AdherenceOutcome.Passed), Adherence("d2", "PRICE", AdherenceOutcome.Breached), Adherence("d3", "RVOL", AdherenceOutcome.Unknown)]); Assert.Equal((3, 1), (report.AdherenceEvaluations, report.Breaches)); Assert.Equal(2, report.Adherence.Count); }
    [Fact] public void FailedSourceFailsOverallQuality() { Assert.Equal(ReportQuality.Failed, Build([], [], [Quality("feed", ReportQuality.Complete), Quality("broker", ReportQuality.Failed)]).DataQuality); }
    [Fact] public void PartialSourceMakesOverallPartial() { Assert.Equal(ReportQuality.Partial, Build([], [], [Quality("feed", ReportQuality.Partial)]).DataQuality); }
    [Fact] public void MissingQualityFailsClosed() { Assert.Equal(ReportQuality.Failed, Build([], [], []).DataQuality); }
    [Fact] public void RejectsDuplicateDailySource() { var item = Quality("feed", ReportQuality.Complete); Assert.Throws<InvalidOperationException>(() => Build([], [], [item, item])); }
    [Fact] public void HashIsStableAcrossInputOrder() { var a = Execution("a", "Momentum", 1, 5m, 0m, 1m); var b = Execution("b", "Momentum", 2, 10m, 0m, 2m); Assert.Equal(Build([a, b]).EvidenceHash, Build([b, a]).EvidenceHash); }
    [Fact] public void HashChangesWhenExecutionIdentityScopeStrategyOrTimeChanges() { var original = Execution("a", "Momentum", 1, 5m, 0m, 1m); var changed = new ReportExecution("a", account, Guid.NewGuid(), "Reversal", 1, 5m, 0m, 1m, Noon.AddMinutes(1)); Assert.NotEqual(Build([original]).EvidenceHash, Build([changed]).EvidenceHash); }
    [Fact] public void HashChangesWhenAdherenceReasonOrEvaluationTimeChanges() { var original = Adherence("d1", "PRICE", AdherenceOutcome.Passed); var changed = new ReportAdherenceFact("d1", account, "PRICE", AdherenceOutcome.Passed, Noon.AddMinutes(1), "corrected evidence"); Assert.NotEqual(Build([], [original]).EvidenceHash, Build([], [changed]).EvidenceHash); }
    [Fact] public void HashChangesWhenQualityAsOfChanges() { var original = Quality("feed", ReportQuality.Complete); var changed = new ReportDataQualityFact("feed", ReportQuality.Complete, Noon.AddMinutes(1), 10, 0); Assert.NotEqual(Build([], [], [original]).EvidenceHash, Build([], [], [changed]).EvidenceHash); }
    [Fact] public void HashIncludesTradingTimezoneIdentity() { var execution = Execution("a", "Momentum", 1, 5m, 0m, 1m); var utc = ReportingService.BuildDaily(Guid.NewGuid(), account, new(2026, 8, 13), TimeZoneInfo.Utc, Noon, [execution], [], [Quality("feed", ReportQuality.Complete)]); var wat = ReportingService.BuildDaily(Guid.NewGuid(), account, new(2026, 8, 13), TimeZoneInfo.CreateCustomTimeZone("WAT", TimeSpan.FromHours(1), "WAT", "WAT"), Noon, [execution], [], [Quality("feed", ReportQuality.Complete)]); Assert.NotEqual(utc.EvidenceHash, wat.EvidenceHash); }
    [Fact] public void RejectsUndefinedAdherenceAndQualityEnums() { Assert.Throws<ArgumentOutOfRangeException>(() => new ReportAdherenceFact("d1", account, "PRICE", (AdherenceOutcome)99, Noon, "evidence")); Assert.Throws<ArgumentOutOfRangeException>(() => new ReportDataQualityFact("feed", (ReportQuality)99, Noon, 1, 0)); }
    [Fact] public void ReportHasNoTradingOrBrokerAuthority() { Assert.False(DailyTradingReport.CreatesOrderAuthority); Assert.False(DailyTradingReport.IsBrokerStatement); }

    private DailyTradingReport Build(IEnumerable<ReportExecution>? executions = null, IEnumerable<ReportAdherenceFact>? adherence = null, IEnumerable<ReportDataQualityFact>? quality = null) => ReportingService.BuildDaily(Guid.NewGuid(), account, new(2026, 8, 13), TimeZoneInfo.Utc, Noon, executions ?? [], adherence ?? [], quality ?? [Quality("feed", ReportQuality.Complete)]);
    private ReportExecution Execution(string id, string strategy, long quantity, decimal gross, decimal fees, decimal pnl) => new(id, account, security, strategy, quantity, gross, fees, pnl, Noon);
    private ReportAdherenceFact Adherence(string id, string rule, AdherenceOutcome outcome) => new(id, account, rule, outcome, Noon, "synthetic evidence");
    private static ReportDataQualityFact Quality(string source, ReportQuality quality) => new(source, quality, Noon, 10, quality == ReportQuality.Complete ? 0 : 1);
}
