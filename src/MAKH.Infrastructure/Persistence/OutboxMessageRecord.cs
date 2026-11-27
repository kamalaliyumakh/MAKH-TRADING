namespace MAKH.Infrastructure.Persistence;

public sealed class OutboxMessageRecord
{
    private OutboxMessageRecord() { }

    public OutboxMessageRecord(Guid id, Guid accountId, Guid aggregateId, string eventType,
        int schemaVersion, long streamSequence, DateTimeOffset occurredAt, string payload)
    {
        if (id == Guid.Empty) throw new ArgumentException("Message ID is required.", nameof(id));
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        if (aggregateId == Guid.Empty) throw new ArgumentException("Aggregate ID is required.", nameof(aggregateId));
        if (string.IsNullOrWhiteSpace(eventType)) throw new ArgumentException("Event type is required.", nameof(eventType));
        ArgumentOutOfRangeException.ThrowIfLessThan(schemaVersion, 1);
        ArgumentOutOfRangeException.ThrowIfLessThan(streamSequence, 1);
        if (occurredAt == default) throw new ArgumentException("Occurred time is required.", nameof(occurredAt));
        if (string.IsNullOrWhiteSpace(payload)) throw new ArgumentException("Payload is required.", nameof(payload));

        Id = id;
        AccountId = accountId;
        AggregateId = aggregateId;
        EventType = eventType.Trim();
        SchemaVersion = schemaVersion;
        StreamSequence = streamSequence;
        OccurredAt = occurredAt;
        Payload = payload;
        NextAttemptAt = occurredAt;
    }

    public Guid Id { get; private set; }
    public Guid AccountId { get; private set; }
    public Guid AggregateId { get; private set; }
    public string EventType { get; private set; } = string.Empty;
    public int SchemaVersion { get; private set; }
    public long StreamSequence { get; private set; }
    public DateTimeOffset OccurredAt { get; private set; }
    public string Payload { get; private set; } = string.Empty;
    public DateTimeOffset? PublishedAt { get; private set; }
    public int AttemptCount { get; private set; }
    public string? LeaseOwner { get; private set; }
    public DateTimeOffset? LeaseUntil { get; private set; }
    public DateTimeOffset NextAttemptAt { get; private set; }
    public string? LastError { get; private set; }
}
