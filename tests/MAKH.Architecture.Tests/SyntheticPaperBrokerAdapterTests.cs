using MAKH.Application.Broker;
using MAKH.Infrastructure.Broker;
using System.Globalization;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class SyntheticPaperBrokerAdapterTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 13, 10, 0, 0, TimeSpan.Zero);

    [Fact]
    public void PaperAdapterRejectsLiveAccountIdentity()
    {
        Assert.Throws<InvalidOperationException>(() => new SyntheticPaperBrokerAdapter(
            new BrokerAccountIdentity("synthetic-paper", "live-1", BrokerEnvironment.Live), () => Now));
    }

    [Fact]
    public void ContractsRejectUndefinedEnumsAndMismatchedProviderIdentity()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => new BrokerAccountIdentity("synthetic-paper", "paper-1", (BrokerEnvironment)99));
        Assert.Throws<ArgumentOutOfRangeException>(() => Request(side: (CanonicalOrderSide)99));
        Assert.Throws<ArgumentOutOfRangeException>(() => Request(timeInForce: (CanonicalTimeInForce)99));
        Assert.Throws<InvalidOperationException>(() => new SyntheticPaperBrokerAdapter(
            new BrokerAccountIdentity("another-provider", "paper-1", BrokerEnvironment.Paper), () => Now));
    }

    [Fact]
    public void PayloadIdentityIsCultureInvariantAndLengthPrefixed()
    {
        var originalCulture = CultureInfo.CurrentCulture;
        try
        {
            CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("fr-FR");
            var french = Request().PayloadIdentity;
            CultureInfo.CurrentCulture = CultureInfo.GetCultureInfo("en-US");
            var english = Request().PayloadIdentity;

            Assert.Equal(french, english);
            Assert.Contains("4:5.25", english, StringComparison.Ordinal);
        }
        finally
        {
            CultureInfo.CurrentCulture = originalCulture;
        }
    }

    [Fact]
    public void AccountIdentityNeverCreatesLiveAuthority()
    {
        var account = PaperAccount();
        Assert.True(account.CanSubmitPaperOrders);
        Assert.False(account.CanSubmitLiveOrders);
    }

    [Fact]
    public async Task SubmitRequiresRiskApprovedPaperProposal()
    {
        var adapter = Adapter();
        await Assert.ThrowsAsync<InvalidOperationException>(() => adapter.SubmitAsync(Request(riskApproved: false)));
        Assert.Equal(0, adapter.ProviderSubmitCount);
    }

    [Fact]
    public async Task AcceptedSubmissionPreservesCanonicalIdentityAndTerms()
    {
        var request = Request();
        var result = await Adapter().SubmitAsync(request);

        Assert.False(result.WasReplay);
        Assert.Equal(CanonicalOrderState.Accepted, result.Order.State);
        Assert.Equal(request.ClientOrderId, result.Order.ClientOrderId);
        Assert.Equal(request.SecurityId, result.Order.SecurityId);
        Assert.Equal(request.Quantity, result.Order.Quantity);
        Assert.Equal(request.LimitPrice, result.Order.LimitPrice);
        Assert.False(result.Order.CreatesLiveAuthority);
    }

    [Fact]
    public async Task IdenticalClientKeyReturnsOriginalWithoutSecondProviderSubmission()
    {
        var adapter = Adapter();
        var first = await adapter.SubmitAsync(Request());
        var replay = await adapter.SubmitAsync(Request());

        Assert.True(replay.WasReplay);
        Assert.Equal(first.Order.ProviderOrderId, replay.Order.ProviderOrderId);
        Assert.Equal(1, adapter.ProviderSubmitCount);
    }

    [Fact]
    public async Task ReusedClientKeyWithChangedPayloadConflictsWithoutProviderSubmission()
    {
        var adapter = Adapter();
        await adapter.SubmitAsync(Request());

        await Assert.ThrowsAsync<InvalidOperationException>(() => adapter.SubmitAsync(Request(quantity: 101)));
        Assert.Equal(1, adapter.ProviderSubmitCount);
    }

    [Fact]
    public async Task TimeoutAfterPossibleSubmissionBecomesUnknownAndQueryable()
    {
        var adapter = Adapter(SyntheticSubmitBehavior.TimeoutAfterPossibleSubmission);
        var result = await adapter.SubmitAsync(Request());
        var found = await adapter.FindByClientOrderIdAsync(Request().ClientOrderId);

        Assert.Equal(CanonicalOrderState.Unknown, result.Order.State);
        Assert.True(result.Order.RequiresReconciliation);
        Assert.Equal(result.Order, found);
    }

    [Fact]
    public async Task UnknownProviderStateMapsFailClosed()
    {
        var adapter = Adapter();
        var request = Request();
        var submitted = await adapter.SubmitAsync(request);
        var updated = adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "MYSTERY", Now.AddSeconds(1)));

        Assert.Equal(CanonicalOrderState.Unknown, updated.State);
        Assert.True(updated.RequiresReconciliation);
    }

    [Theory]
    [InlineData("NEW", CanonicalOrderState.Accepted)]
    [InlineData("PENDING_CANCEL", CanonicalOrderState.PendingCancel)]
    [InlineData("CANCELED", CanonicalOrderState.Cancelled)]
    [InlineData("REJECTED", CanonicalOrderState.Rejected)]
    [InlineData("UNRECOGNIZED", CanonicalOrderState.Unknown)]
    public void ProviderStatesMapToCanonicalStates(string providerState, CanonicalOrderState expected)
    {
        Assert.Equal(expected, SyntheticPaperBrokerAdapter.MapState(providerState, 0, 100));
    }

    [Fact]
    public void FillQuantitiesOverrideLossyProviderState()
    {
        Assert.Equal(CanonicalOrderState.PartiallyFilled, SyntheticPaperBrokerAdapter.MapState("NEW", 25, 100));
        Assert.Equal(CanonicalOrderState.Filled, SyntheticPaperBrokerAdapter.MapState("CANCELLED", 100, 100));
    }

    [Fact]
    public void ProviderMappingRejectsMalformedStateAndFillShape()
    {
        Assert.Throws<ArgumentException>(() => SyntheticPaperBrokerAdapter.MapState(" ", 0, 100));
        Assert.Throws<ArgumentOutOfRangeException>(() => SyntheticPaperBrokerAdapter.MapState("NEW", -1, 100));
        Assert.Throws<ArgumentOutOfRangeException>(() => SyntheticPaperBrokerAdapter.MapState("NEW", 101, 100));
        Assert.Throws<ArgumentOutOfRangeException>(() => SyntheticPaperBrokerAdapter.MapState("NEW", 0, 0));
    }

    [Fact]
    public async Task OutOfOrderSnapshotDoesNotRegressCanonicalState()
    {
        var adapter = Adapter();
        var request = Request();
        var submitted = await adapter.SubmitAsync(request);
        var partial = adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "NEW", Now.AddSeconds(2), filled: 25));
        var stale = adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "NEW", Now.AddSeconds(1)));

        Assert.Equal(partial, stale);
        Assert.Equal(25, stale.FilledQuantity);
    }

    [Fact]
    public async Task PartialFillCannotRegressToAccepted()
    {
        var adapter = Adapter();
        var request = Request();
        var submitted = await adapter.SubmitAsync(request);
        var partial = adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "NEW", Now.AddSeconds(1), filled: 25));
        var regressive = adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "NEW", Now.AddSeconds(2)));

        Assert.Equal(partial, regressive);
    }

    [Fact]
    public async Task SameTimestampSnapshotRequiresExactReplay()
    {
        var adapter = Adapter();
        var request = Request();
        var submitted = await adapter.SubmitAsync(request);
        var observedAt = Now.AddSeconds(1);
        var partialSnapshot = Snapshot(submitted.Order.ProviderOrderId, "NEW", observedAt, filled: 25);
        var partial = adapter.ApplySnapshot(request, partialSnapshot);

        Assert.Equal(partial, adapter.ApplySnapshot(request, partialSnapshot));
        Assert.Throws<InvalidOperationException>(() =>
            adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "NEW", observedAt, filled: 26)));
        Assert.Throws<InvalidOperationException>(() =>
            adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "NEW", observedAt, filled: 25, reason: "changed")));
    }

    [Fact]
    public async Task TerminalFillCannotBeOverwrittenByCancellation()
    {
        var adapter = Adapter();
        var request = Request();
        var submitted = await adapter.SubmitAsync(request);
        var filled = adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "NEW", Now.AddSeconds(1), filled: 100));
        var cancelled = adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "CANCELLED", Now.AddSeconds(2)));

        Assert.Equal(CanonicalOrderState.Filled, filled.State);
        Assert.Equal(filled, cancelled);
    }

    [Fact]
    public async Task SnapshotRejectsContradictoryIdentityTermsAndFill()
    {
        var adapter = Adapter();
        var request = Request();
        var submitted = await adapter.SubmitAsync(request);

        Assert.Throws<InvalidOperationException>(() => adapter.ApplySnapshot(request, Snapshot("different", "NEW", Now.AddSeconds(1))));
        Assert.Throws<InvalidOperationException>(() => adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "NEW", Now.AddSeconds(1), quantity: 99)));
        Assert.Throws<InvalidOperationException>(() => adapter.ApplySnapshot(request, Snapshot(submitted.Order.ProviderOrderId, "NEW", Now.AddSeconds(1), filled: 101)));
    }

    [Fact]
    public async Task CancelIsAccountScopedAndIdempotent()
    {
        var adapter = Adapter();
        await adapter.SubmitAsync(Request());

        var first = await adapter.CancelAsync("client-order-1", "corr-cancel-1");
        var replay = await adapter.CancelAsync("client-order-1", "corr-cancel-2");

        Assert.Equal(CanonicalOrderState.Cancelled, first.Order.State);
        Assert.Equal("corr-cancel-1", first.Order.CorrelationId);
        Assert.False(first.WasReplay);
        Assert.True(replay.WasReplay);
        Assert.Equal(first.Order, replay.Order);
        Assert.Equal(1, adapter.ProviderCancelCount);
        Assert.False(first.Order.CreatesLiveAuthority);
    }

    [Fact]
    public async Task CancelRejectsMissingUnknownFilledAndRejectedOrders()
    {
        var adapter = Adapter();
        await Assert.ThrowsAsync<ArgumentException>(() => adapter.CancelAsync(" ", "corr-cancel"));
        await Assert.ThrowsAsync<InvalidOperationException>(() => adapter.CancelAsync("missing", "corr-cancel"));

        var accepted = await adapter.SubmitAsync(Request());
        adapter.ApplySnapshot(Request(), Snapshot(accepted.Order.ProviderOrderId, "NEW", Now.AddSeconds(1), filled: 100));
        await Assert.ThrowsAsync<InvalidOperationException>(() => adapter.CancelAsync("client-order-1", "corr-cancel"));

        var rejectedAdapter = Adapter(SyntheticSubmitBehavior.Reject);
        await rejectedAdapter.SubmitAsync(Request());
        await Assert.ThrowsAsync<InvalidOperationException>(() => rejectedAdapter.CancelAsync("client-order-1", "corr-cancel"));

        var unknownAdapter = Adapter(SyntheticSubmitBehavior.TimeoutAfterPossibleSubmission);
        await unknownAdapter.SubmitAsync(Request());
        await Assert.ThrowsAsync<InvalidOperationException>(() => unknownAdapter.CancelAsync("client-order-1", "corr-cancel"));
        Assert.Equal(0, unknownAdapter.ProviderCancelCount);
    }

    [Fact]
    public async Task AuthoritativeFullFillAfterCancelWinsTheRace()
    {
        var adapter = Adapter();
        var submitted = await adapter.SubmitAsync(Request());
        var cancelled = await adapter.CancelAsync("client-order-1", "corr-cancel");

        var filled = adapter.ApplySnapshot(
            Request(),
            Snapshot(submitted.Order.ProviderOrderId, "FILLED", cancelled.Order.UpdatedAt.AddSeconds(1), filled: 100));

        Assert.Equal(CanonicalOrderState.Filled, filled.State);
        Assert.Equal(100, filled.FilledQuantity);
        Assert.Equal(0, filled.RemainingQuantity);
        Assert.False(filled.RequiresReconciliation);
    }

    private static SyntheticPaperBrokerAdapter Adapter(SyntheticSubmitBehavior behavior = SyntheticSubmitBehavior.Accept) =>
        new(PaperAccount(), () => Now, behavior);

    private static BrokerAccountIdentity PaperAccount() => new("synthetic-paper", "paper-account-1", BrokerEnvironment.Paper);

    private static PaperOrderRequest Request(
        long quantity = 100,
        bool riskApproved = true,
        CanonicalOrderSide side = CanonicalOrderSide.Buy,
        CanonicalTimeInForce timeInForce = CanonicalTimeInForce.Day) => new(
        Guid.Parse("10000000-0000-0000-0000-000000000001"),
        Guid.Parse("20000000-0000-0000-0000-000000000002"),
        Guid.Parse("30000000-0000-0000-0000-000000000003"),
        "client-order-1", side, quantity, 5.25m, timeInForce,
        riskApproved, "corr-broker-1");

    private static SyntheticBrokerOrderSnapshot Snapshot(
        string providerOrderId,
        string state,
        DateTimeOffset updatedAt,
        long filled = 0,
        long quantity = 100,
        string reason = "synthetic update") =>
        new(providerOrderId, "client-order-1", state, quantity, filled, 5.25m, updatedAt, reason);
}
