namespace MAKH.Application.Evidence;

public sealed record EvidenceOutboxDelivery(
    Guid Id,
    Guid EvidenceDocumentId,
    string EventType,
    int SchemaVersion,
    int AttemptCount,
    DateTimeOffset OccurredAt,
    string Payload);

public interface IEvidenceOutboxStore
{
    Task<IReadOnlyList<EvidenceOutboxDelivery>> ClaimNextAsync(
        string owner, DateTimeOffset now, TimeSpan leaseDuration, int limit, CancellationToken cancellationToken);
    Task MarkPublishedAsync(Guid messageId, string owner, DateTimeOffset publishedAt, CancellationToken cancellationToken);
    Task MarkFailedAsync(
        Guid messageId, string owner, DateTimeOffset nextAttemptAt, string errorMessage, CancellationToken cancellationToken);
}

public interface IEvidenceOutboxPublisher
{
    Task PublishAsync(EvidenceOutboxDelivery delivery, CancellationToken cancellationToken);
}

public sealed class EvidenceOutboxDispatcher(IEvidenceOutboxStore store, IEvidenceOutboxPublisher publisher)
{
    public async Task<int> DispatchOnceAsync(
        string owner,
        DateTimeOffset now,
        TimeSpan leaseDuration,
        int limit,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(owner)) throw new ArgumentException("Lease owner is required.", nameof(owner));
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(leaseDuration, TimeSpan.Zero);
        ArgumentOutOfRangeException.ThrowIfLessThan(limit, 1);

        var normalizedOwner = owner.Trim();
        var deliveries = await store.ClaimNextAsync(
            normalizedOwner, now, leaseDuration, limit, cancellationToken);
        var published = 0;
        foreach (var delivery in deliveries)
        {
            try
            {
                await publisher.PublishAsync(delivery, cancellationToken);
                await store.MarkPublishedAsync(delivery.Id, normalizedOwner, now, cancellationToken);
                published++;
            }
            catch (Exception exception) when (exception is not OperationCanceledException)
            {
                var delaySeconds = Math.Min(300, 1 << Math.Min(9, delivery.AttemptCount));
                await store.MarkFailedAsync(
                    delivery.Id,
                    normalizedOwner,
                    now.AddSeconds(delaySeconds),
                    exception.GetType().Name,
                    cancellationToken);
            }
        }

        return published;
    }
}
