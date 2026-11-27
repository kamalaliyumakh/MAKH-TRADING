using MAKH.Application.Broker;
using MAKH.Application.Positions;
using MAKH.Infrastructure.Positions;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class PositionLedgerServiceTests
{
    private static readonly Guid AccountId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly Guid SecurityId = Guid.Parse("20000000-0000-0000-0000-000000000002");
    private static readonly Guid OrderId = Guid.Parse("30000000-0000-0000-0000-000000000003");
    private static readonly DateTimeOffset Now = new(2026, 8, 13, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ExecutionValidatesIdentityQuantityPriceAndCorrectionLineage()
    {
        Assert.Throws<ArgumentException>(() => Fact("", 10, 5m));
        Assert.Throws<ArgumentOutOfRangeException>(() => Fact("e1", 0, 5m));
        Assert.Throws<ArgumentOutOfRangeException>(() => Fact("e1", 10, 0m));
        Assert.Throws<ArgumentException>(() => Fact("e1", 10, 5m, kind: ExecutionFactKind.Correction));
        Assert.Throws<ArgumentException>(() => Fact("e1", 10, 5m, corrects: "old"));
        Assert.Throws<ArgumentOutOfRangeException>(() => Fact("e1", 10, 5m, side: (CanonicalOrderSide)99));
        Assert.Throws<ArgumentOutOfRangeException>(() => Fact("e1", 10, 5m, kind: (ExecutionFactKind)99));
        Assert.Throws<ArgumentException>(() => new ExecutionFact("synthetic-paper", "paper-account", "e1",
            AccountId, SecurityId, OrderId, CanonicalOrderSide.Buy, 10, 5m, 0m,
            Now.ToOffset(TimeSpan.FromHours(1))));
    }

    [Fact]
    public void BuyFillsRollUpQuantityAverageCostAndFees()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("e1", 40, 5m, fee: 1m));
        var position = ledger.Apply(Fact("e2", 60, 6m, fee: 2m));

        Assert.Equal(100, position.Quantity);
        Assert.Equal(563m, position.CostBasis);
        Assert.Equal(5.63m, position.AverageCost);
        Assert.Equal(3m, position.Fees);
        Assert.Equal(2, position.Version);
    }

    [Fact]
    public void DuplicateExecutionHasExactlyOneEffect()
    {
        var ledger = Ledger();
        var fact = Fact("e1", 40, 5m, fee: 1m);
        var first = ledger.Apply(fact);
        var replay = ledger.Apply(fact);

        Assert.Equal(first, replay);
        Assert.Equal(40, replay.Quantity);
        Assert.Single(replay.AppliedExecutionIds);
    }

    [Fact]
    public void DuplicateExecutionIdentityWithDifferentPayloadConflicts()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("e1", 40, 5m));
        Assert.Throws<InvalidOperationException>(() => ledger.Apply(Fact("e1", 41, 5m)));
    }

    [Fact]
    public void PartialSellRealizesPnlAndRetainsAverageCost()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 100, 5m, fee: 1m));
        var position = ledger.Apply(Fact("sell", 40, 6m, CanonicalOrderSide.Sell, fee: 1m));

        Assert.Equal(60, position.Quantity);
        Assert.Equal(5.01m, position.AverageCost);
        Assert.Equal(300.6m, position.CostBasis);
        Assert.Equal(38.6m, position.RealizedPnl);
    }

    [Fact]
    public void SellCannotCreateShortPosition()
    {
        Assert.Throws<InvalidOperationException>(() => Ledger().Apply(Fact("sell", 1, 5m, CanonicalOrderSide.Sell)));
    }

    [Fact]
    public void FullExitClearsQuantityCostAndAverageButKeepsRealizedPnl()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m));
        var position = ledger.Apply(Fact("sell", 10, 6m, CanonicalOrderSide.Sell));
        Assert.Equal(0, position.Quantity);
        Assert.Equal(0m, position.CostBasis);
        Assert.Equal(0m, position.AverageCost);
        Assert.Equal(10m, position.RealizedPnl);
    }

    [Fact]
    public void MarkProducesTimestampedUnrealizedPnlAndIgnoresOlderMark()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m));
        var marked = ledger.Mark(AccountId, SecurityId, 6m, Now.AddMinutes(1));
        var stale = ledger.Mark(AccountId, SecurityId, 4m, Now);
        Assert.Equal(10m, marked.UnrealizedPnl);
        Assert.Equal(Now.AddMinutes(1), marked.MarkAsOf);
        Assert.Equal(marked, stale);
    }

    [Fact]
    public void MarkReplayIsIdempotentAndSameTimestampConflictFailsClosed()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m));
        var marked = ledger.Mark(AccountId, SecurityId, 6m, Now.AddMinutes(1));

        Assert.Equal(marked, ledger.Mark(AccountId, SecurityId, 6m, Now.AddMinutes(1)));
        Assert.Throws<InvalidOperationException>(() => ledger.Mark(AccountId, SecurityId, 7m, Now.AddMinutes(1)));
    }

    [Fact]
    public void PositionAndPnlAreExplicitlyNonAuthoritative()
    {
        var position = Ledger().Apply(Fact("buy", 10, 5m));
        Assert.False(position.IsBrokerAuthoritative);
        Assert.False(position.CreatesLiveAuthority);
    }

    [Fact]
    public void ProtectionShowsUnknownPendingUnderProtectedAndProtectedStates()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 100, 5m));
        Assert.Equal(ProtectionState.Unknown, ledger.SetProtection(AccountId, SecurityId, 100, 0, 4m, Now, false).ProtectionState);
        Assert.Equal(ProtectionState.Pending, ledger.SetProtection(AccountId, SecurityId, 0, 0, null, Now.AddSeconds(1), true).ProtectionState);
        Assert.Equal(ProtectionState.UnderProtected, ledger.SetProtection(AccountId, SecurityId, 100, 60, 4m, Now.AddSeconds(2), true).ProtectionState);
        var protectedPosition = ledger.SetProtection(AccountId, SecurityId, 100, 100, 4m, Now.AddSeconds(3), true);
        Assert.Equal(ProtectionState.Protected, protectedPosition.ProtectionState);
        Assert.False(protectedPosition.ReconciliationRequired);
    }

    [Fact]
    public void ProtectionDetectsDesiredAndConfirmedUnderOrOverCoverage()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 100, 5m));

        Assert.Equal(ProtectionState.UnderProtected,
            ledger.SetProtection(AccountId, SecurityId, 90, 100, 4m, Now, true).ProtectionState);
        var overDesired = ledger.SetProtection(AccountId, SecurityId, 110, 100, 4m, Now.AddSeconds(1), true);
        Assert.Equal(ProtectionState.OverProtected, overDesired.ProtectionState);
        Assert.True(overDesired.ReconciliationRequired);
        var overConfirmed = ledger.SetProtection(AccountId, SecurityId, 100, 110, 4m, Now.AddSeconds(2), true);
        Assert.Equal(ProtectionState.OverProtected, overConfirmed.ProtectionState);
        Assert.True(overConfirmed.ReconciliationRequired);
    }

    [Fact]
    public void ProtectionReplayIsIdempotentAndSameTimestampConflictFailsClosed()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m));
        var protectedPosition = ledger.SetProtection(AccountId, SecurityId, 10, 10, 4m, Now, true);

        Assert.Equal(protectedPosition, ledger.SetProtection(AccountId, SecurityId, 10, 10, 4m, Now, true));
        Assert.Throws<InvalidOperationException>(() =>
            ledger.SetProtection(AccountId, SecurityId, 10, 9, 4m, Now, true));
    }

    [Fact]
    public void OlderProtectionSnapshotCannotOverwriteNewerBrokerState()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m));
        var current = ledger.SetProtection(AccountId, SecurityId, 10, 10, 4m, Now.AddMinutes(1), true);
        var stale = ledger.SetProtection(AccountId, SecurityId, 10, 0, 4m, Now, false);
        Assert.Equal(current, stale);
    }

    [Fact]
    public void LaterExecutionInvalidatesOlderMarkAndProtectionEvidence()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy-1", 10, 5m));
        ledger.Mark(AccountId, SecurityId, 6m, Now.AddSeconds(1));
        ledger.SetProtection(AccountId, SecurityId, 10, 10, 4m, Now.AddSeconds(1), true);

        var changed = ledger.Apply(Fact("buy-2", 5, 6m, executedAt: Now.AddSeconds(2)));

        Assert.Null(changed.MarkPrice);
        Assert.Null(changed.MarkAsOf);
        Assert.Null(changed.UnrealizedPnl);
        Assert.Equal(ProtectionState.Unknown, changed.ProtectionState);
        Assert.True(changed.ReconciliationRequired);
    }

    [Fact]
    public void DerivedEvidenceCannotPredateLatestExecutionOrClaimUnknownConfirmation()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m, executedAt: Now.AddSeconds(1)));

        Assert.Throws<InvalidOperationException>(() => ledger.Mark(AccountId, SecurityId, 6m, Now));
        Assert.Throws<InvalidOperationException>(() =>
            ledger.SetProtection(AccountId, SecurityId, 10, 10, 4m, Now, true));
        Assert.Throws<ArgumentException>(() =>
            ledger.SetProtection(AccountId, SecurityId, 10, 10, 4m, Now.AddSeconds(2), false));
    }

    [Fact]
    public void BustReversesOriginalBuyAsANewFact()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m, fee: 1m));
        var busted = ledger.Apply(Fact("bust", 10, 5m, kind: ExecutionFactKind.Bust, corrects: "buy"));
        Assert.Equal(0, busted.Quantity);
        Assert.Equal(0m, busted.CostBasis);
        Assert.Equal(2, busted.AppliedExecutionIds.Count);
    }

    [Fact]
    public void CorrectionReplacesOriginalBuyEconomics()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m));
        var corrected = ledger.Apply(Fact("correction", 10, 5.5m, kind: ExecutionFactKind.Correction, corrects: "buy"));
        Assert.Equal(10, corrected.Quantity);
        Assert.Equal(55m, corrected.CostBasis);
        Assert.Equal(5.5m, corrected.AverageCost);
    }

    [Fact]
    public void ExecutionCannotBeCorrectedTwiceOrAcrossScope()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m));
        ledger.Apply(Fact("correction", 10, 5.5m, kind: ExecutionFactKind.Correction, corrects: "buy"));
        Assert.Throws<InvalidOperationException>(() => ledger.Apply(Fact("correction-2", 10, 6m, kind: ExecutionFactKind.Correction, corrects: "buy")));

        var other = new ExecutionFact("synthetic-paper", "paper-account", "cross", Guid.NewGuid(), SecurityId,
            OrderId, CanonicalOrderSide.Buy, 10, 5m, 0m, Now, ExecutionFactKind.Correction, "buy");
        Assert.Throws<InvalidOperationException>(() => ledger.Apply(other));
    }

    [Fact]
    public void CorrectionRequiresMatchingOrderSideAndChronology()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m));

        var otherOrder = new ExecutionFact("synthetic-paper", "paper-account", "other-order", AccountId, SecurityId,
            Guid.NewGuid(), CanonicalOrderSide.Buy, 10, 5m, 0m, Now, ExecutionFactKind.Correction, "buy");
        var otherSide = new ExecutionFact("synthetic-paper", "paper-account", "other-side", AccountId, SecurityId,
            OrderId, CanonicalOrderSide.Sell, 10, 5m, 0m, Now, ExecutionFactKind.Correction, "buy");
        var earlier = new ExecutionFact("synthetic-paper", "paper-account", "earlier", AccountId, SecurityId,
            OrderId, CanonicalOrderSide.Buy, 10, 5m, 0m, Now.AddSeconds(-1), ExecutionFactKind.Correction, "buy");

        Assert.Throws<InvalidOperationException>(() => ledger.Apply(otherOrder));
        Assert.Throws<InvalidOperationException>(() => ledger.Apply(otherSide));
        Assert.Throws<InvalidOperationException>(() => ledger.Apply(earlier));
    }

    [Fact]
    public void BuyCannotBeReversedAfterDependentSellWithoutReconciliation()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m));
        ledger.Apply(Fact("sell", 5, 6m, CanonicalOrderSide.Sell));
        Assert.Throws<InvalidOperationException>(() => ledger.Apply(Fact("bust", 10, 5m, kind: ExecutionFactKind.Bust, corrects: "buy")));
    }

    [Fact]
    public void ExecutionChronologyAndNestedCorrectionsFailClosed()
    {
        var ledger = Ledger();
        ledger.Apply(Fact("buy", 10, 5m, executedAt: Now.AddSeconds(1)));
        Assert.Throws<InvalidOperationException>(() => ledger.Apply(Fact("older", 1, 5m, executedAt: Now)));

        ledger.Apply(Fact("correction", 10, 5.5m, kind: ExecutionFactKind.Correction,
            corrects: "buy", executedAt: Now.AddSeconds(2)));
        Assert.Throws<InvalidOperationException>(() => ledger.Apply(Fact("nested", 10, 6m,
            kind: ExecutionFactKind.Correction, corrects: "correction", executedAt: Now.AddSeconds(3))));
    }

    private static PositionLedgerService Ledger() => new(new InMemoryPositionLedgerStore());

    private static ExecutionFact Fact(
        string executionId,
        long quantity,
        decimal price,
        CanonicalOrderSide side = CanonicalOrderSide.Buy,
        decimal fee = 0m,
        ExecutionFactKind kind = ExecutionFactKind.Fill,
        string? corrects = null,
        DateTimeOffset? executedAt = null) =>
        new("synthetic-paper", "paper-account", executionId, AccountId, SecurityId, OrderId,
            side, quantity, price, fee, executedAt ?? Now, kind, corrects);
}
