using MAKH.Application.Risk;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class RiskEngineTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 13, 9, 30, 0, TimeSpan.Zero);

    [Fact]
    public void PolicyRejectsInvalidLimitsAndRanges()
    {
        Assert.Throws<ArgumentException>(() => Policy(effectiveFrom: Now, effectiveTo: Now));
        Assert.Throws<ArgumentException>(() => Policy(maximumSymbolExposure: 20_000m, maximumGrossExposure: 10_000m));
        Assert.Throws<ArgumentException>(() => Policy(maximumPositionNotional: 6_000m, maximumSymbolExposure: 5_000m));
    }

    [Fact]
    public void CatalogRejectsDuplicateVersionsAndOverlaps()
    {
        Assert.Throws<ArgumentException>(() => new RiskPolicyCatalog([Policy(), Policy()]));
        Assert.Throws<ArgumentException>(() => new RiskPolicyCatalog([
            Policy(version: "v1", effectiveTo: Now.AddDays(2)),
            Policy(version: "v2", effectiveFrom: Now.AddDays(1)),
        ]));
    }

    [Fact]
    public void MissingEffectivePolicyFailsClosed()
    {
        var decision = Engine(Policy(effectiveFrom: Now.AddDays(1))).Evaluate(Request());

        Assert.Equal(RiskDecisionOutcome.Rejected, decision.Outcome);
        Assert.Equal("unresolved", decision.PolicyVersion);
        Assert.False(decision.Rules.Single().Passed);
    }

    [Fact]
    public void EffectiveBoundaryIsStartInclusiveAndEndExclusive()
    {
        var policy = Policy(effectiveFrom: Now, effectiveTo: Now.AddDays(1));
        Assert.Equal("v1", new RiskPolicyCatalog([policy]).Resolve(Now).Version);
        Assert.Throws<InvalidOperationException>(() => new RiskPolicyCatalog([policy]).Resolve(Now.AddDays(1)));
    }

    [Fact]
    public void HealthyPaperRequestIsApprovedOnlyForProposal()
    {
        var decision = Engine().Evaluate(Request());

        Assert.Equal(RiskDecisionOutcome.ApprovedForProposal, decision.Outcome);
        Assert.True(decision.CanCreatePaperOrderProposal);
        Assert.False(decision.CanSubmitBrokerOrder);
        Assert.False(decision.CanAuthorizeLiveTrading);
        Assert.All(decision.Rules, rule => Assert.True(rule.Passed));
    }

    [Fact]
    public void PositionSizeUsesTightestCapacityAndFloorsShares()
    {
        var decision = Engine().Evaluate(Request(requestedQuantity: 1_000, entryPrice: 6m, stopPrice: 5.51m));

        Assert.Equal(204, decision.ApprovedQuantity);
        Assert.Equal(1_224m, decision.ApprovedNotional);
        Assert.Equal(99.96m, decision.MaximumLossAtStop);
    }

    [Fact]
    public void RequestedQuantityAndPolicyCapAreRespected()
    {
        Assert.Equal(25, Engine().Evaluate(Request(requestedQuantity: 25)).ApprovedQuantity);
        Assert.Equal(300, Engine(Policy(maximumRiskPerTrade: 1_000m, maximumOrderQuantity: 300)).Evaluate(Request(requestedQuantity: 1_000)).ApprovedQuantity);
    }

    [Theory]
    [InlineData(false, true, true, true, true, RiskRuleCode.PaperMode)]
    [InlineData(true, false, true, true, true, RiskRuleCode.SystemHealth)]
    [InlineData(true, true, false, true, true, RiskRuleCode.AccountState)]
    [InlineData(true, true, true, false, true, RiskRuleCode.StrategyAllowed)]
    [InlineData(true, true, true, true, false, RiskRuleCode.MarketDataFresh)]
    public void AuthorityAndFreshnessUncertaintyFailClosed(
        bool paper, bool healthy, bool accountKnown, bool strategyAllowed, bool fresh, RiskRuleCode failedRule)
    {
        var decision = Engine().Evaluate(Request(paper: paper, healthy: healthy, accountKnown: accountKnown, strategyAllowed: strategyAllowed, fresh: fresh));

        Assert.Equal(RiskDecisionOutcome.Rejected, decision.Outcome);
        Assert.Equal(0, decision.ApprovedQuantity);
        Assert.False(decision.Rules.Single(rule => rule.Code == failedRule).Passed);
    }

    [Theory]
    [InlineData(0, 5)]
    [InlineData(-1, 5)]
    [InlineData(5, 5)]
    [InlineData(5, 6)]
    public void InvalidEntryOrStopFailsClosed(decimal entry, decimal stop)
    {
        Assert.Equal(RiskDecisionOutcome.Rejected, Engine().Evaluate(Request(entryPrice: entry, stopPrice: stop)).Outcome);
    }

    [Fact]
    public void ExhaustedDailyLossCapacityRejectsNewExposure()
    {
        var decision = Engine().Evaluate(Request(realizedDailyPnl: -500m));

        Assert.Equal(RiskDecisionOutcome.Rejected, decision.Outcome);
        Assert.False(decision.Rules.Single(rule => rule.Code == RiskRuleCode.DailyLossCapacity).Passed);
    }

    [Theory]
    [InlineData(10000, 1000, 1000)]
    [InlineData(1000, 5000, 1000)]
    [InlineData(1000, 1000, 0)]
    public void ExhaustedExposureOrBuyingPowerRejects(decimal gross, decimal symbol, decimal buyingPower)
    {
        var decision = Engine().Evaluate(Request(grossExposure: gross, symbolExposure: symbol, buyingPower: buyingPower));
        Assert.Equal(RiskDecisionOutcome.Rejected, decision.Outcome);
        Assert.Equal(0, decision.ApprovedNotional);
    }

    [Fact]
    public void EvidenceHashIsDeterministicAndChangesWithInputs()
    {
        var first = Engine().Evaluate(Request());
        var replay = Engine().Evaluate(Request());
        var changed = Engine().Evaluate(Request(requestedQuantity: 99));

        Assert.Equal(first.EvidenceSha256, replay.EvidenceSha256);
        Assert.NotEqual(first.EvidenceSha256, changed.EvidenceSha256);
        Assert.Equal(64, first.EvidenceSha256.Length);
    }

    [Fact]
    public void EvidenceHashBindsCompleteDecisionContext()
    {
        var baseline = Engine().Evaluate(Request());
        var changedStrategy = Engine().Evaluate(Request(strategy: "alternate"));
        var changedPnl = Engine().Evaluate(Request(realizedDailyPnl: -1m));
        var changedGross = Engine().Evaluate(Request(grossExposure: 1_001m));
        var changedSymbol = Engine().Evaluate(Request(symbolExposure: 501m));
        var changedBuyingPower = Engine().Evaluate(Request(buyingPower: 3_999m));

        Assert.All(
            new[] { changedStrategy, changedPnl, changedGross, changedSymbol, changedBuyingPower },
            changed => Assert.NotEqual(baseline.EvidenceSha256, changed.EvidenceSha256));
    }

    [Fact]
    public void ImpossibleExposureStateFailsClosed()
    {
        var decision = Engine().Evaluate(Request(grossExposure: 100m, symbolExposure: 101m));

        Assert.Equal(RiskDecisionOutcome.Rejected, decision.Outcome);
        Assert.Equal(0, decision.ApprovedQuantity);
        Assert.False(decision.CanCreatePaperOrderProposal);
    }

    [Fact]
    public void DecisionPreservesScopePolicyAndCorrelation()
    {
        var request = Request();
        var decision = Engine().Evaluate(request);

        Assert.Equal(request.DecisionId, decision.DecisionId);
        Assert.Equal(request.AccountId, decision.AccountId);
        Assert.Equal(request.UserId, decision.UserId);
        Assert.Equal(request.SecurityId, decision.SecurityId);
        Assert.Equal(request.CorrelationId, decision.CorrelationId);
        Assert.Equal("v1", decision.PolicyVersion);
    }

    private static RiskEngine Engine(RiskPolicy? policy = null) => new(new RiskPolicyCatalog([policy ?? Policy()]));

    private static RiskPolicy Policy(
        string version = "v1",
        DateTimeOffset? effectiveFrom = null,
        DateTimeOffset? effectiveTo = null,
        decimal maximumRiskPerTrade = 100m,
        decimal maximumDailyLoss = 500m,
        decimal maximumGrossExposure = 10_000m,
        decimal maximumSymbolExposure = 5_000m,
        decimal maximumPositionNotional = 3_000m,
        long maximumOrderQuantity = 500) =>
        new(version, effectiveFrom ?? Now.AddDays(-1), effectiveTo, maximumRiskPerTrade, maximumDailyLoss,
            maximumGrossExposure, maximumSymbolExposure, maximumPositionNotional, maximumOrderQuantity);

    private static RiskEvaluationRequest Request(
        long requestedQuantity = 100,
        decimal entryPrice = 6m,
        decimal stopPrice = 5m,
        decimal realizedDailyPnl = 0m,
        decimal grossExposure = 1_000m,
        decimal symbolExposure = 500m,
        decimal buyingPower = 4_000m,
        bool paper = true,
        bool healthy = true,
        bool accountKnown = true,
        bool strategyAllowed = true,
        bool fresh = true,
        string strategy = "momentum") =>
        new(
            Guid.Parse("10000000-0000-0000-0000-000000000001"),
            Guid.Parse("20000000-0000-0000-0000-000000000002"),
            Guid.Parse("30000000-0000-0000-0000-000000000003"),
            Guid.Parse("40000000-0000-0000-0000-000000000004"),
            Now, strategy, requestedQuantity, entryPrice, stopPrice, realizedDailyPnl, grossExposure,
            symbolExposure, buyingPower, paper, healthy, accountKnown, strategyAllowed, fresh, "corr-risk-1");
}
