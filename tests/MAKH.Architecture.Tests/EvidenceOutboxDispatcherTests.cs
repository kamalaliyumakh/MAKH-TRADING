using MAKH.Application.Evidence;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class EvidenceOutboxDispatcherTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 1, 15, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task SuccessfulPublicationMarksOwnedLeasePublished()
    {
        var delivery = Delivery(attemptCount: 1);
        var store = new StubStore(delivery);
        var publisher = new StubPublisher();

        var count = await new EvidenceOutboxDispatcher(store, publisher)
            .DispatchOnceAsync("evidence-worker", Now, TimeSpan.FromSeconds(30), 10);

        Assert.Equal(1, count);
        Assert.Equal([delivery.Id], publisher.Published);
        Assert.Equal((delivery.Id, "evidence-worker", Now), store.Published);
        Assert.Null(store.Failed);
    }

    [Fact]
    public async Task FailedPublicationReleasesLeaseForBoundedRetry()
    {
        var delivery = Delivery(attemptCount: 20);
        var store = new StubStore(delivery);

        var count = await new EvidenceOutboxDispatcher(store, new StubPublisher(fail: true))
            .DispatchOnceAsync("evidence-worker", Now, TimeSpan.FromSeconds(30), 10);

        Assert.Equal(0, count);
        Assert.Null(store.Published);
        Assert.Equal(delivery.Id, store.Failed?.MessageId);
        Assert.Equal(Now.AddMinutes(5), store.Failed?.NextAttemptAt);
        Assert.Equal(nameof(InvalidOperationException), store.Failed?.ErrorMessage);
    }

    [Fact]
    public async Task CancellationIsPropagatedWithoutFailureTransition()
    {
        var delivery = Delivery(attemptCount: 1);
        var store = new StubStore(delivery);
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();

        await Assert.ThrowsAnyAsync<OperationCanceledException>(() =>
            new EvidenceOutboxDispatcher(store, new CancellingPublisher())
                .DispatchOnceAsync("evidence-worker", Now, TimeSpan.FromSeconds(30), 10, cancellation.Token));
        Assert.Null(store.Published);
        Assert.Null(store.Failed);
    }

    private static EvidenceOutboxDelivery Delivery(int attemptCount) => new(
        Guid.Parse("10000000-0000-0000-0000-000000000001"),
        Guid.Parse("20000000-0000-0000-0000-000000000002"),
        "evidence.updated",
        1,
        attemptCount,
        Now,
        "{}");

    private sealed class StubPublisher(bool fail = false) : IEvidenceOutboxPublisher
    {
        public List<Guid> Published { get; } = [];

        public Task PublishAsync(EvidenceOutboxDelivery delivery, CancellationToken cancellationToken)
        {
            if (fail) throw new InvalidOperationException("Synthetic failure.");
            Published.Add(delivery.Id);
            return Task.CompletedTask;
        }
    }

    private sealed class CancellingPublisher : IEvidenceOutboxPublisher
    {
        public Task PublishAsync(EvidenceOutboxDelivery delivery, CancellationToken cancellationToken) =>
            Task.FromCanceled(cancellationToken);
    }

    private sealed class StubStore(params EvidenceOutboxDelivery[] deliveries) : IEvidenceOutboxStore
    {
        public (Guid MessageId, string Owner, DateTimeOffset PublishedAt)? Published { get; private set; }
        public Failure? Failed { get; private set; }

        public Task<IReadOnlyList<EvidenceOutboxDelivery>> ClaimNextAsync(
            string owner,
            DateTimeOffset now,
            TimeSpan leaseDuration,
            int limit,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<EvidenceOutboxDelivery>>(deliveries.Take(limit).ToArray());

        public Task MarkPublishedAsync(
            Guid messageId, string owner, DateTimeOffset publishedAt, CancellationToken cancellationToken)
        {
            Published = (messageId, owner, publishedAt);
            return Task.CompletedTask;
        }

        public Task MarkFailedAsync(
            Guid messageId,
            string owner,
            DateTimeOffset nextAttemptAt,
            string errorMessage,
            CancellationToken cancellationToken)
        {
            Failed = new(messageId, owner, nextAttemptAt, errorMessage);
            return Task.CompletedTask;
        }
    }

    private sealed record Failure(Guid MessageId, string Owner, DateTimeOffset NextAttemptAt, string ErrorMessage);
}
