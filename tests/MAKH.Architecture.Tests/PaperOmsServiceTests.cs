using MAKH.Application.Broker;
using MAKH.Application.Orders;
using MAKH.Infrastructure.Broker;
using MAKH.Infrastructure.Orders;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class PaperOmsServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 13, 11, 0, 0, TimeSpan.Zero);

    [Fact]
    public void ProposalRequiresRiskApprovalAndFutureExpiry()
    {
        var service = Service();
        Assert.Throws<InvalidOperationException>(() => Create(service, approved: false));
        Assert.Throws<ArgumentException>(() => Create(service, expiresAt: Now));
    }

    [Fact]
    public void ProposalRejectsUndefinedExecutionEnums()
    {
        var service = Service();
        Assert.Throws<ArgumentOutOfRangeException>(() => Create(service, side: (CanonicalOrderSide)99));
        Assert.Throws<ArgumentOutOfRangeException>(() => Create(service, timeInForce: (CanonicalTimeInForce)99));
    }

    [Fact]
    public void ProposalDigestIsDeterministicAndCreatesNoLiveAuthority()
    {
        var first = Create(Service());
        var replay = Create(Service());
        Assert.Equal(first.Digest, replay.Digest);
        Assert.Equal(64, first.Digest.Length);
        Assert.False(first.CreatesLiveAuthority);
    }

    [Fact]
    public async Task SubmitConsumesProposalAndCreatesCanonicalManagedOrder()
    {
        var service = Service();
        var proposal = Create(service);
        var result = await service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-1");

        Assert.Equal(CanonicalOrderState.Accepted, result.Order.State);
        Assert.Equal(proposal.ProposalId, result.Order.ProposalId);
        Assert.Equal(1, result.Order.Version);
        Assert.False(result.Order.CreatesLiveAuthority);
    }

    [Fact]
    public async Task SubmissionRejectsBrokerResponseThatContradictsApprovedProposal()
    {
        var service = Service(new ContradictoryBrokerAdapter());
        var proposal = Create(service);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-contradictory"));
    }

    [Fact]
    public async Task ExactSubmitReplayReturnsOriginalOrderAndOneProviderSubmission()
    {
        var adapter = Adapter();
        var service = Service(adapter);
        var proposal = Create(service);
        var first = await service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-1");
        var replay = await service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-1");

        Assert.True(replay.WasReplay);
        Assert.Equal(first.Order.OrderId, replay.Order.OrderId);
        Assert.Equal(1, adapter.ProviderSubmitCount);
    }

    [Fact]
    public async Task ConcurrentExactSubmissionsReachProviderAtMostOnce()
    {
        var adapter = Adapter();
        var service = Service(adapter);
        var proposal = Create(service);

        var results = await Task.WhenAll(Enumerable.Range(0, 8)
            .Select(_ => service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-concurrent")));

        Assert.Equal(1, adapter.ProviderSubmitCount);
        Assert.Single(results.Select(result => result.Order.OrderId).Distinct());
        Assert.Equal(7, results.Count(result => result.WasReplay));
    }

    [Fact]
    public async Task ChangedSubmitPayloadWithSameKeyConflicts()
    {
        var service = Service();
        var proposal = Create(service);
        await service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-1");
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SubmitAsync(proposal.ProposalId, "different", "submit-1"));
    }

    [Fact]
    public async Task ConsumedProposalCannotBeSubmittedWithNewIntentKey()
    {
        var service = Service();
        var proposal = Create(service);
        await service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-1");
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-2"));
    }

    [Fact]
    public async Task ExpiredProposalCannotBeSubmitted()
    {
        var current = Now;
        var adapter = Adapter(() => current);
        var service = new PaperOmsService(new InMemoryPaperOmsStore(), adapter, () => current);
        var proposal = Create(service, expiresAt: Now.AddMinutes(1));
        current = Now.AddMinutes(2);
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-1"));
    }

    [Fact]
    public async Task UnknownSubmissionBlocksCancelAndReplaceUntilReconciled()
    {
        var adapter = Adapter(behavior: SyntheticSubmitBehavior.TimeoutAfterPossibleSubmission);
        var service = Service(adapter);
        var proposal = Create(service);
        var submitted = await service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-1");

        Assert.True(submitted.Order.RequiresReconciliation);
        Assert.Throws<InvalidOperationException>(() => service.RequestCancel(submitted.Order.OrderId, 1, "cancel-1", "cancel"));
        Assert.Throws<InvalidOperationException>(() => service.RequestReplace(submitted.Order.OrderId, 1, 90, 5m, "replace-1", "replace"));
        Assert.Equal(1, adapter.ProviderSubmitCount);
    }

    [Fact]
    public async Task CancelUsesVersionAndIdempotency()
    {
        var service = Service();
        var order = await Submit(service);
        var first = service.RequestCancel(order.OrderId, 1, "cancel-1", "user requested cancellation");
        var replay = service.RequestCancel(order.OrderId, 1, "cancel-1", "user requested cancellation");

        Assert.Equal(CanonicalOrderState.PendingCancel, first.Order.State);
        Assert.Equal(2, first.Order.Version);
        Assert.True(replay.WasReplay);
        Assert.Throws<InvalidOperationException>(() => service.RequestCancel(order.OrderId, 1, "cancel-2", "another"));
    }

    [Fact]
    public async Task CancelChangedPayloadWithSameKeyConflicts()
    {
        var service = Service();
        var order = await Submit(service);
        service.RequestCancel(order.OrderId, 1, "cancel-1", "first reason");
        Assert.Throws<InvalidOperationException>(() => service.RequestCancel(order.OrderId, 1, "cancel-1", "changed reason"));
    }

    [Fact]
    public async Task ReplaceUsesVersionIdempotencyAndValidatesCumulativeFills()
    {
        var service = Service();
        var order = await Submit(service);
        var provider = BrokerOrder(order, filled: 25, state: CanonicalOrderState.PartiallyFilled);
        var reconciled = service.Reconcile(order.OrderId, provider);

        Assert.Throws<InvalidOperationException>(() => service.RequestReplace(order.OrderId, reconciled.Version, 24, 5m, "replace-bad", "too small"));
        var replaced = service.RequestReplace(order.OrderId, reconciled.Version, 80, 5m, "replace-1", "reduce remainder");
        var replay = service.RequestReplace(order.OrderId, reconciled.Version, 80, 5m, "replace-1", "reduce remainder");
        Assert.Equal(CanonicalOrderState.PendingReplace, replaced.Order.State);
        Assert.Equal(80, replaced.Order.Quantity);
        Assert.True(replay.WasReplay);
    }

    [Fact]
    public async Task StaleCancelOrReplaceVersionIsRejected()
    {
        var service = Service();
        var order = await Submit(service);
        var reconciled = service.Reconcile(order.OrderId, BrokerOrder(order, state: CanonicalOrderState.Accepted));
        Assert.Throws<InvalidOperationException>(() => service.RequestCancel(order.OrderId, reconciled.Version - 1, "cancel-1", "stale"));
        Assert.Throws<InvalidOperationException>(() => service.RequestReplace(order.OrderId, reconciled.Version - 1, 90, 5m, "replace-1", "stale"));
    }

    [Fact]
    public async Task ReconciliationRejectsCrossAccountOrClientIdentity()
    {
        var service = Service();
        var order = await Submit(service);
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { AccountId = Guid.NewGuid() }));
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { ClientOrderId = "other" }));
    }

    [Fact]
    public async Task ReconciliationRejectsContradictoryProviderSecurityAndExecutionTerms()
    {
        var service = Service();
        var order = await Submit(service);
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { Provider = "other" }));
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { ProviderOrderId = "other" }));
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { SecurityId = Guid.NewGuid() }));
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { Side = CanonicalOrderSide.Sell }));
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { TimeInForce = CanonicalTimeInForce.GoodTilCancelled }));
    }

    [Fact]
    public async Task ReconciliationRejectsInvalidOrUnauthorizedTermChanges()
    {
        var service = Service();
        var order = await Submit(service);
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { Quantity = 0 }));
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { FilledQuantity = 101 }));
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { LimitPrice = 0 }));
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { Quantity = 90 }));
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, BrokerOrder(order) with { LimitPrice = 5m }));
    }

    [Fact]
    public async Task ReconciliationDoesNotRegressCumulativeFills()
    {
        var service = Service();
        var order = await Submit(service);
        var partial = service.Reconcile(order.OrderId, BrokerOrder(order, filled: 40, state: CanonicalOrderState.PartiallyFilled));
        var regressive = service.Reconcile(order.OrderId, BrokerOrder(order, filled: 20, state: CanonicalOrderState.PartiallyFilled) with
        {
            UpdatedAt = partial.UpdatedAt.AddSeconds(1)
        });
        Assert.Equal(partial, regressive);
    }

    [Fact]
    public async Task ReconciliationIgnoresStaleExactAndStateRegressiveSnapshots()
    {
        var service = Service();
        var order = await Submit(service);
        var snapshot = BrokerOrder(order, filled: 40, state: CanonicalOrderState.PartiallyFilled);
        var partial = service.Reconcile(order.OrderId, snapshot);

        Assert.Equal(partial, service.Reconcile(order.OrderId, snapshot));
        Assert.Equal(partial, service.Reconcile(order.OrderId, snapshot with { UpdatedAt = Now }));
        Assert.Equal(partial, service.Reconcile(order.OrderId, snapshot with
        {
            State = CanonicalOrderState.Accepted,
            UpdatedAt = Now.AddSeconds(2),
        }));
    }

    [Fact]
    public async Task ReconciliationRejectsSameTimestampConflictAndUndefinedState()
    {
        var service = Service();
        var order = await Submit(service);
        var snapshot = BrokerOrder(order, filled: 40, state: CanonicalOrderState.PartiallyFilled);
        var partial = service.Reconcile(order.OrderId, snapshot);

        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, snapshot with
        {
            FilledQuantity = 41,
        }));
        Assert.Throws<InvalidOperationException>(() => service.Reconcile(order.OrderId, snapshot with
        {
            State = (CanonicalOrderState)99,
            UpdatedAt = partial.UpdatedAt.AddSeconds(1),
        }));
    }

    [Fact]
    public async Task AuthoritativeFillCanOverrideCancellationButOtherTerminalRegressionsAreIgnored()
    {
        var service = Service();
        var order = await Submit(service);
        var cancelled = service.Reconcile(order.OrderId, BrokerOrder(order, state: CanonicalOrderState.Cancelled));
        var accepted = service.Reconcile(order.OrderId, BrokerOrder(cancelled, state: CanonicalOrderState.Accepted) with
        {
            UpdatedAt = Now.AddSeconds(2),
        });
        var filled = service.Reconcile(order.OrderId, BrokerOrder(cancelled, filled: 100, state: CanonicalOrderState.Filled) with
        {
            UpdatedAt = Now.AddSeconds(3),
        });

        Assert.Equal(cancelled, accepted);
        Assert.Equal(CanonicalOrderState.Filled, filled.State);
        Assert.Equal(100, filled.FilledQuantity);
    }

    [Fact]
    public async Task TerminalOrderCannotBeMutated()
    {
        var service = Service();
        var order = await Submit(service);
        var filled = service.Reconcile(order.OrderId, BrokerOrder(order, filled: 100, state: CanonicalOrderState.Filled));
        Assert.Throws<InvalidOperationException>(() => service.RequestCancel(order.OrderId, filled.Version, "cancel-1", "too late"));
        Assert.Throws<InvalidOperationException>(() => service.RequestReplace(order.OrderId, filled.Version, 100, 5m, "replace-1", "too late"));
    }

    private static PaperOmsService Service(IPaperBrokerAdapter? adapter = null) =>
        new(new InMemoryPaperOmsStore(), adapter ?? Adapter(), () => Now);

    private static SyntheticPaperBrokerAdapter Adapter(
        Func<DateTimeOffset>? clock = null,
        SyntheticSubmitBehavior behavior = SyntheticSubmitBehavior.Accept) =>
        new(new BrokerAccountIdentity("synthetic-paper", "paper-account", BrokerEnvironment.Paper), clock ?? (() => Now), behavior);

    private static PaperOrderProposal Create(
        PaperOmsService service,
        bool approved = true,
        DateTimeOffset? expiresAt = null,
        CanonicalOrderSide side = CanonicalOrderSide.Buy,
        CanonicalTimeInForce timeInForce = CanonicalTimeInForce.Day) =>
        service.CreateProposal(
            Guid.Parse("10000000-0000-0000-0000-000000000001"),
            Guid.Parse("20000000-0000-0000-0000-000000000002"),
            Guid.Parse("30000000-0000-0000-0000-000000000003"),
            Guid.Parse("40000000-0000-0000-0000-000000000004"),
            side, 100, 5.25m, timeInForce, approved,
            expiresAt ?? Now.AddMinutes(5), "corr-oms-1");

    private static async Task<PaperManagedOrder> Submit(PaperOmsService service)
    {
        var proposal = Create(service);
        return (await service.SubmitAsync(proposal.ProposalId, proposal.Digest, "submit-1")).Order;
    }

    private static CanonicalBrokerOrder BrokerOrder(
        PaperManagedOrder order,
        long filled = 0,
        CanonicalOrderState state = CanonicalOrderState.Accepted) =>
        new("synthetic-paper", order.ProviderOrderId!, order.ClientOrderId, order.AccountId, order.SecurityId,
            order.Side, order.Quantity, filled, order.LimitPrice, order.TimeInForce, state, Now.AddSeconds(1),
            "reconciled", state == CanonicalOrderState.Unknown, order.CorrelationId);

    private sealed class ContradictoryBrokerAdapter : IPaperBrokerAdapter
    {
        public string ProviderName => "contradictory-paper";
        public BrokerAccountIdentity Account { get; } = new("contradictory-paper", "paper-account", BrokerEnvironment.Paper);

        public Task<BrokerSubmitResult> SubmitAsync(PaperOrderRequest request, CancellationToken cancellationToken = default) =>
            Task.FromResult(new BrokerSubmitResult(new CanonicalBrokerOrder(
                ProviderName, "provider-order-1", request.ClientOrderId, request.AccountId, Guid.NewGuid(),
                request.Side, request.Quantity, 0, request.LimitPrice, request.TimeInForce,
                CanonicalOrderState.Accepted, Now, "accepted", false, request.CorrelationId), false));

        public Task<BrokerCancelResult> CancelAsync(string clientOrderId, string correlationId, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<CanonicalBrokerOrder?> FindByClientOrderIdAsync(string clientOrderId, CancellationToken cancellationToken = default) =>
            Task.FromResult<CanonicalBrokerOrder?>(null);
    }
}
