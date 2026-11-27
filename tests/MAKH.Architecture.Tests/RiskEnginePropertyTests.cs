using MAKH.Application.Risk;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class RiskEnginePropertyTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 6, 12, 0, 0, TimeSpan.Zero);
    private static readonly RiskPolicy Policy = new(
        "property-v1", Now.AddDays(-1), Now.AddDays(1),
        maximumRiskPerTrade: 500m,
        maximumDailyLoss: 1_000m,
        maximumGrossExposure: 25_000m,
        maximumSymbolExposure: 5_000m,
        maximumPositionNotional: 4_000m,
        maximumOrderQuantity: 500_000);

    [Fact]
    public void RandomizedApprovedSizingNeverExceedsAnyCapacity()
    {
        var random = new Random(71001);
        var engine = new RiskEngine(new RiskPolicyCatalog([Policy]));

        for (var index = 0; index < 5_000; index++)
        {
            var entry = Decimal(random, 3m, 7m);
            var stop = Decimal(random, 0.01m, entry - 0.01m);
            var requested = random.NextInt64(1, 750_001);
            var gross = Decimal(random, 0m, 26_000m);
            var symbol = Decimal(random, 0m, 5_500m);
            var buyingPower = Decimal(random, 0m, 30_000m);
            var result = engine.Evaluate(Request(requested, entry, stop, gross, symbol, buyingPower));

            if (result.Outcome != RiskDecisionOutcome.ApprovedForProposal) continue;

            Assert.InRange(result.ApprovedQuantity, 1, Math.Min(requested, Policy.MaximumOrderQuantity));
            Assert.True(result.ApprovedNotional <= Policy.MaximumPositionNotional);
            Assert.True(result.ApprovedNotional <= Policy.MaximumSymbolExposure - symbol);
            Assert.True(result.ApprovedNotional <= Policy.MaximumGrossExposure - gross);
            Assert.True(result.ApprovedNotional <= buyingPower);
            Assert.True(result.MaximumLossAtStop <= Policy.MaximumRiskPerTrade);
            Assert.Equal(result.ApprovedQuantity * entry, result.ApprovedNotional);
            Assert.Equal(result.ApprovedQuantity * (entry - stop), result.MaximumLossAtStop);
            Assert.False(result.CanSubmitBrokerOrder);
            Assert.False(result.CanAuthorizeLiveTrading);
        }
    }

    [Fact]
    public void RandomizedUnknownOrDegradedAuthorityAlwaysRejects()
    {
        var random = new Random(71002);
        var engine = new RiskEngine(new RiskPolicyCatalog([Policy]));

        for (var index = 0; index < 2_000; index++)
        {
            var failedAuthority = random.Next(5);
            var request = Request(100, 5m, 4.5m, 0m, 0m, 10_000m,
                isPaperMode: failedAuthority != 0,
                systemHealthy: failedAuthority != 1,
                accountStateKnown: failedAuthority != 2,
                strategyAllowed: failedAuthority != 3,
                marketDataFresh: failedAuthority != 4);

            var result = engine.Evaluate(request);

            Assert.Equal(RiskDecisionOutcome.Rejected, result.Outcome);
            Assert.Equal(0, result.ApprovedQuantity);
            Assert.False(result.CanCreatePaperOrderProposal);
            Assert.False(result.CanSubmitBrokerOrder);
            Assert.False(result.CanAuthorizeLiveTrading);
        }
    }

    [Fact]
    public void RandomizedPolicyTimelineHasExactlyOneOrNoEffectivePolicy()
    {
        var catalog = new RiskPolicyCatalog([
            TimelinePolicy("timeline-v1", Now.AddDays(-2), Now),
            TimelinePolicy("timeline-v2", Now, Now.AddDays(2)),
        ]);
        var random = new Random(71003);

        for (var index = 0; index < 2_000; index++)
        {
            var at = Now.AddMinutes(random.Next(-4_000, 4_001));
            var expected = at >= Now.AddDays(-2) && at < Now.AddDays(2);
            if (!expected)
            {
                Assert.Throws<InvalidOperationException>(() => catalog.Resolve(at));
                continue;
            }

            var policy = catalog.Resolve(at);
            Assert.Equal(at < Now ? "timeline-v1" : "timeline-v2", policy.Version);
        }
    }

    private static RiskEvaluationRequest Request(long quantity, decimal entry, decimal stop,
        decimal gross, decimal symbol, decimal buyingPower, bool isPaperMode = true,
        bool systemHealthy = true, bool accountStateKnown = true, bool strategyAllowed = true,
        bool marketDataFresh = true) => new(
            Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Guid.NewGuid(), Now, "momentum",
            quantity, entry, stop, 0m, gross, symbol, buyingPower,
            isPaperMode, systemHealthy, accountStateKnown, strategyAllowed, marketDataFresh,
            correlationId: "property-test");

    private static decimal Decimal(Random random, decimal minimum, decimal maximum) =>
        minimum + (decimal)random.NextDouble() * (maximum - minimum);

    private static RiskPolicy TimelinePolicy(string version, DateTimeOffset from, DateTimeOffset to) =>
        new(version, from, to, Policy.MaximumRiskPerTrade, Policy.MaximumDailyLoss,
            Policy.MaximumGrossExposure, Policy.MaximumSymbolExposure,
            Policy.MaximumPositionNotional, Policy.MaximumOrderQuantity);
}
