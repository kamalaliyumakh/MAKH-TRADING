using MAKH.Application.Common;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class OutboxDispatcherTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 16, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task SuccessfulPublicationMarksOwnedLeasePublished()
    {
        var delivery = Delivery(attemptCount: 1);
        var store = new StubStore(delivery);
        var publisher = new StubPublisher();
        var dispatcher = new OutboxDispatcher(store, publisher);

        var count = await dispatcher.DispatchOnceAsync("worker-a", Now, TimeSpan.FromSeconds(30), 10);

        Assert.Equal(1, count);
        Assert.Equal([delivery.Id], publisher.Published);
        Assert.Equal((delivery.Id, "worker-a", Now), store.Published);
        Assert.Null(store.Failed);
    }

    [Fact]
    public async Task FailedPublicationReleasesForBoundedRetryWithoutMarkingPublished()
    {
        var delivery = Delivery(attemptCount: 3);
        var store = new StubStore(delivery);
        var dispatcher = new OutboxDispatcher(store, new StubPublisher(fail: true));

        var count = await dispatcher.DispatchOnceAsync("worker-a", Now, TimeSpan.FromSeconds(30), 10);

        Assert.Equal(0, count);
        Assert.Null(store.Published);
        Assert.Equal(delivery.Id, store.Failed?.MessageId);
        Assert.Equal("worker-a", store.Failed?.Owner);
        Assert.Equal(Now.AddSeconds(8), store.Failed?.NextAttemptAt);
        Assert.Equal(nameof(InvalidOperationException), store.Failed?.ErrorMessage);
    }

    private static OutboxDelivery Delivery(int attemptCount) => new(
        Guid.Parse("10000000-0000-0000-0000-000000000001"),
        Guid.Parse("20000000-0000-0000-0000-000000000002"),
        "scanner.updated", 1, 12, attemptCount, Now, "{}");

    private sealed class StubPublisher(bool fail = false) : IOutboxPublisher
    {
        public List<Guid> Published { get; } = [];

        public Task PublishAsync(OutboxDelivery delivery, CancellationToken cancellationToken)
        {
            if (fail) throw new InvalidOperationException("Synthetic failure.");
            Published.Add(delivery.Id);
            return Task.CompletedTask;
        }
    }

    private sealed class StubStore(params OutboxDelivery[] deliveries) : IOutboxStore
    {
        public (Guid MessageId, string Owner, DateTimeOffset PublishedAt)? Published { get; private set; }
        public Failure? Failed { get; private set; }

        public Task<IReadOnlyList<OutboxDelivery>> ClaimNextAsync(
            string owner, DateTimeOffset now, TimeSpan leaseDuration, int limit, CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<OutboxDelivery>>(deliveries.Take(limit).ToArray());

        public Task MarkPublishedAsync(
            Guid messageId, string owner, DateTimeOffset publishedAt, CancellationToken cancellationToken)
        {
            Published = (messageId, owner, publishedAt);
            return Task.CompletedTask;
        }

        public Task MarkFailedAsync(Guid messageId, string owner, DateTimeOffset nextAttemptAt,
            string errorMessage, CancellationToken cancellationToken)
        {
            Failed = new(messageId, owner, nextAttemptAt, errorMessage);
            return Task.CompletedTask;
        }
    }

    private sealed record Failure(Guid MessageId, string Owner, DateTimeOffset NextAttemptAt, string ErrorMessage);
}
