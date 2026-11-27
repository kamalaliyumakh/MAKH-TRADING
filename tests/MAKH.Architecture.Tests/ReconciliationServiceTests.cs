using MAKH.Application.Reconciliation;
using MAKH.Infrastructure.Reconciliation;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class ReconciliationServiceTests
{
    private static readonly Guid AccountId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly Guid SecurityId = Guid.Parse("20000000-0000-0000-0000-000000000002");
    private static readonly DateTimeOffset Now = new(2026, 8, 13, 13, 0, 0, TimeSpan.Zero);

    [Fact]
    public void NewAccountFailsClosedBeforeFirstCleanRun()
    {
        var state = Service().GetState(AccountId);
        Assert.Equal(ReconciliationOutcome.Unknown, state.Outcome);
        Assert.True(state.EntryBlocked);
        Assert.Equal(0, state.Sequence);
    }

    [Fact]
    public void MatchingSnapshotsClearEntryBlock()
    {
        var service = Service();
        var snapshot = Snapshot();
        var run = service.Reconcile(snapshot, Snapshot(checksum: "broker-1"), Now.AddSeconds(1));
        Assert.Equal(ReconciliationOutcome.Matched, run.Outcome);
        Assert.Empty(run.Items);
        Assert.False(run.EntryBlocked);
        Assert.False(run.IsBrokerAuthoritative);
        Assert.False(run.CreatesLiveAuthority);
    }

    [Fact]
    public void UnknownBrokerSnapshotLocksEntryAndRecordsReason()
    {
        var service = Service();
        var run = service.Reconcile(Snapshot(), Snapshot(known: false, checksum: "broker-unknown"), Now.AddSeconds(1));
        Assert.Equal(ReconciliationOutcome.Unknown, run.Outcome);
        Assert.True(run.EntryBlocked);
        Assert.Contains(run.Items, item => item.EntityType == ReconciliationEntityType.Snapshot);
    }

    [Fact]
    public void CashMismatchLocksEntry()
    {
        var run = Service().Reconcile(Snapshot(), Snapshot(cash: 999m, checksum: "broker-cash"), Now.AddSeconds(1));
        Assert.Equal(ReconciliationOutcome.Mismatch, run.Outcome);
        Assert.Contains(run.Items, item => item.Field == "Cash");
        Assert.True(run.EntryBlocked);
    }

    [Fact]
    public void ConfiguredCashToleranceAvoidsFalseMismatch()
    {
        var run = Service(0.01m).Reconcile(Snapshot(), Snapshot(cash: 999.995m, checksum: "broker-tolerance"), Now.AddSeconds(1));
        Assert.Equal(ReconciliationOutcome.Matched, run.Outcome);
    }

    [Fact]
    public void BuyingPowerMismatchIsIndependentFromCash()
    {
        var run = Service().Reconcile(Snapshot(), Snapshot(buyingPower: 1800m, checksum: "broker-buying-power"), Now.AddSeconds(1));
        Assert.Contains(run.Items, item => item.Field == "BuyingPower");
    }

    [Fact]
    public void OrderStateQuantityAndFillDifferencesAreItemized()
    {
        var brokerOrders = new[] { new ReconciliationOrder("order-1", "Filled", 90, 90) };
        var run = Service().Reconcile(Snapshot(), Snapshot(orders: brokerOrders, checksum: "broker-order"), Now.AddSeconds(1));
        Assert.Equal(3, run.Items.Count(item => item.EntityType == ReconciliationEntityType.Order));
    }

    [Fact]
    public void MissingOrderOnEitherSideIsDetected()
    {
        var service = Service();
        var missingBroker = service.Reconcile(Snapshot(), Snapshot(orders: [], checksum: "broker-none"), Now.AddSeconds(1));
        Assert.Contains(missingBroker.Items, item => item.Field == "Presence" && item.BrokerValue == "Missing");

        var missingPlatform = service.Reconcile(Snapshot(orders: []), Snapshot(checksum: "broker-present"), Now.AddSeconds(2));
        Assert.Contains(missingPlatform.Items, item => item.Field == "Presence" && item.PlatformValue == "Missing");
    }

    [Fact]
    public void PositionQuantityAndMissingPositionAreDetected()
    {
        var different = new[] { new ReconciliationPosition(SecurityId, 9), new ReconciliationPosition(Guid.NewGuid(), 2) };
        var run = Service().Reconcile(Snapshot(), Snapshot(positions: different, checksum: "broker-position"), Now.AddSeconds(1));
        Assert.Equal(2, run.Items.Count(item => item.EntityType == ReconciliationEntityType.Position));
    }

    [Fact]
    public void CleanRunAfterMismatchClearsLockButPreservesHistory()
    {
        var service = Service();
        service.Reconcile(Snapshot(), Snapshot(cash: 900m, checksum: "broker-bad"), Now.AddSeconds(1));
        var clean = service.Reconcile(
            Snapshot(asOf: Now.AddSeconds(2)),
            Snapshot(checksum: "broker-clean", asOf: Now.AddSeconds(2)),
            Now.AddSeconds(3));
        Assert.False(clean.EntryBlocked);
        Assert.Equal(2, clean.Sequence);
        Assert.Equal(2, service.GetRuns(AccountId).Count);
        Assert.False(service.GetState(AccountId).EntryBlocked);
    }

    [Fact]
    public void ExactSnapshotReplayReturnsOriginalRunWithoutSequenceChurn()
    {
        var service = Service();
        var first = service.Reconcile(Snapshot(), Snapshot(checksum: "broker-1"), Now.AddSeconds(1));
        var replay = service.Reconcile(Snapshot(), Snapshot(checksum: "broker-1"), Now.AddSeconds(2));

        Assert.Equal(first, replay);
        Assert.Single(service.GetRuns(AccountId));
        Assert.Equal(1, service.GetState(AccountId).Sequence);
    }

    [Fact]
    public void StaleCleanSnapshotsCannotClearNewerMismatchLock()
    {
        var service = Service();
        var newer = service.Reconcile(
            Snapshot(cash: 900m, checksum: "platform-new", asOf: Now.AddMinutes(2)),
            Snapshot(checksum: "broker-new", asOf: Now.AddMinutes(2)),
            Now.AddMinutes(2).AddSeconds(1));
        var stale = service.Reconcile(
            Snapshot(checksum: "platform-old"),
            Snapshot(checksum: "broker-old"),
            Now.AddMinutes(2).AddSeconds(2));

        Assert.Equal(ReconciliationOutcome.Mismatch, newer.Outcome);
        Assert.Equal(ReconciliationOutcome.Unknown, stale.Outcome);
        Assert.True(stale.EntryBlocked);
        Assert.Contains(stale.Items, item => item.EntityType == ReconciliationEntityType.Snapshot && item.Reason.Contains("stale"));
        Assert.True(service.GetState(AccountId).EntryBlocked);
    }

    [Fact]
    public void ChangedChecksumAtSameSourceTimeFailsClosed()
    {
        var service = Service();
        service.Reconcile(Snapshot(), Snapshot(checksum: "broker-1"), Now.AddSeconds(1));
        var conflict = service.Reconcile(
            Snapshot(checksum: "platform-conflict"),
            Snapshot(checksum: "broker-1"),
            Now.AddSeconds(2));

        Assert.Equal(ReconciliationOutcome.Unknown, conflict.Outcome);
        Assert.True(conflict.EntryBlocked);
        Assert.Contains(conflict.Items, item => item.EntityType == ReconciliationEntityType.Snapshot && item.Reason.Contains("conflicts"));
    }

    [Fact]
    public void ChangedContentCannotReplayUnderTheSameCallerChecksum()
    {
        var service = Service();
        var first = service.Reconcile(Snapshot(), Snapshot(checksum: "broker-1"), Now.AddSeconds(1));
        var conflict = service.Reconcile(
            Snapshot(cash: 900m),
            Snapshot(checksum: "broker-1"),
            Now.AddSeconds(2));

        Assert.NotEqual(first.RunId, conflict.RunId);
        Assert.Equal(ReconciliationOutcome.Unknown, conflict.Outcome);
        Assert.True(conflict.EntryBlocked);
    }

    [Fact]
    public void StaleFailureCannotMoveEitherSourceHighWaterBackward()
    {
        var service = Service();
        service.Reconcile(
            Snapshot(asOf: Now.AddMinutes(2), checksum: "platform-new"),
            Snapshot(asOf: Now.AddMinutes(2), checksum: "broker-new"),
            Now.AddMinutes(2).AddSeconds(1));
        service.Reconcile(
            Snapshot(asOf: Now, checksum: "platform-old"),
            Snapshot(asOf: Now.AddMinutes(3), checksum: "broker-later"),
            Now.AddMinutes(3).AddSeconds(1));

        var stillStale = service.Reconcile(
            Snapshot(asOf: Now.AddMinutes(1), checksum: "platform-still-old"),
            Snapshot(asOf: Now.AddMinutes(4), checksum: "broker-latest"),
            Now.AddMinutes(4).AddSeconds(1));

        Assert.Equal(ReconciliationOutcome.Unknown, stillStale.Outcome);
        Assert.True(stillStale.EntryBlocked);
    }

    [Fact]
    public void ContractsRejectNonCanonicalOrNonUtcEvidence()
    {
        Assert.Throws<ArgumentException>(() => new ReconciliationOrder("order-1", "not-a-state", 10, 0));
        Assert.Throws<ArgumentOutOfRangeException>(() => new ReconciliationPosition(SecurityId, -1));
        Assert.Throws<ArgumentException>(() => Snapshot(asOf: Now.ToOffset(TimeSpan.FromHours(1))));
        Assert.Throws<ArgumentException>(() => Service().Reconcile(Snapshot(), Snapshot(),
            Now.AddSeconds(1).ToOffset(TimeSpan.FromHours(1))));
    }

    [Fact]
    public void ReconciliationRejectsCrossAccountAndImpossibleCompletionTime()
    {
        var service = Service();
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(Snapshot(), Snapshot(accountId: Guid.NewGuid()), Now.AddSeconds(1)));
        Assert.Throws<ArgumentException>(() => service.Reconcile(Snapshot(), Snapshot(), Now.AddSeconds(-1)));
    }

    [Fact]
    public void SnapshotRejectsDuplicateOrdersAndPositions()
    {
        Assert.Throws<ArgumentException>(() => Snapshot(orders:
            [new("order-1", "Accepted", 100, 0), new("order-1", "Accepted", 100, 0)]));
        Assert.Throws<ArgumentException>(() => Snapshot(positions:
            [new(SecurityId, 10), new(SecurityId, 10)]));
    }

    private static ReconciliationService Service(decimal tolerance = 0m) => new(new InMemoryReconciliationStore(), tolerance);

    private static AccountReconciliationSnapshot Snapshot(
        Guid? accountId = null,
        bool known = true,
        decimal cash = 1000m,
        decimal buyingPower = 2000m,
        IReadOnlyList<ReconciliationOrder>? orders = null,
        IReadOnlyList<ReconciliationPosition>? positions = null,
        string checksum = "platform-1",
        DateTimeOffset? asOf = null) =>
        new(accountId ?? AccountId, asOf ?? Now, known, cash, buyingPower,
            orders ?? [new("order-1", "Accepted", 100, 0)],
            positions ?? [new(SecurityId, 10)], checksum);
}
