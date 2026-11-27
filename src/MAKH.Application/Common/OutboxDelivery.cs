namespace MAKH.Application.Common;

public sealed record OutboxDelivery(
    Guid Id,
    Guid AccountId,
    string EventType,
    int SchemaVersion,
    long StreamSequence,
    int AttemptCount,
    DateTimeOffset OccurredAt,
    string Payload);

public interface IOutboxStore
{
    Task<IReadOnlyList<OutboxDelivery>> ClaimNextAsync(
        string owner, DateTimeOffset now, TimeSpan leaseDuration, int limit, CancellationToken cancellationToken);
    Task MarkPublishedAsync(Guid messageId, string owner, DateTimeOffset publishedAt, CancellationToken cancellationToken);
    Task MarkFailedAsync(Guid messageId, string owner, DateTimeOffset nextAttemptAt, string errorMessage, CancellationToken cancellationToken);
}

public interface IOutboxPublisher
{
    Task PublishAsync(OutboxDelivery delivery, CancellationToken cancellationToken);
}

public sealed class OutboxDispatcher(IOutboxStore store, IOutboxPublisher publisher)
{
    public async Task<int> DispatchOnceAsync(
        string owner, DateTimeOffset now, TimeSpan leaseDuration, int limit, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(owner)) throw new ArgumentException("Lease owner is required.", nameof(owner));
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(leaseDuration, TimeSpan.Zero);
        ArgumentOutOfRangeException.ThrowIfLessThan(limit, 1);

        var deliveries = await store.ClaimNextAsync(owner.Trim(), now, leaseDuration, limit, cancellationToken);
        var published = 0;
        foreach (var delivery in deliveries)
        {
            try
            {
                await publisher.PublishAsync(delivery, cancellationToken);
                await store.MarkPublishedAsync(delivery.Id, owner.Trim(), now, cancellationToken);
                published++;
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                var delaySeconds = Math.Min(300, 1 << Math.Min(8, delivery.AttemptCount));
                await store.MarkFailedAsync(
                    delivery.Id, owner.Trim(), now.AddSeconds(delaySeconds), exception.GetType().Name, cancellationToken);
            }
        }

        return published;
    }
}
