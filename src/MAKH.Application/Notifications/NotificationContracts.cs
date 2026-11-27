namespace MAKH.Application.Notifications;

public enum NotificationChannel { InApp, Email }
public enum NotificationSeverity { Information, Warning, HardBlock }
public enum DeliveryState { Suppressed, Pending, Delivered, Failed }

public sealed record NotificationPreference
{
    public NotificationPreference(Guid userId, NotificationChannel channel, string eventType, NotificationSeverity minimumSeverity, bool enabled)
    {
        if (userId == Guid.Empty) throw new ArgumentException("User ID is required.");
        if (string.IsNullOrWhiteSpace(eventType)) throw new ArgumentException("Event type is required.");
        if (!Enum.IsDefined(channel)) throw new ArgumentOutOfRangeException(nameof(channel));
        if (!Enum.IsDefined(minimumSeverity)) throw new ArgumentOutOfRangeException(nameof(minimumSeverity));
        if (eventType.Length > 100 || eventType.Any(char.IsControl)) throw new ArgumentException("Event type is invalid.");
        UserId = userId;
        Channel = channel;
        EventType = eventType.Trim();
        MinimumSeverity = minimumSeverity;
        Enabled = enabled;
    }
    public Guid UserId { get; }
    public NotificationChannel Channel { get; }
    public string EventType { get; }
    public NotificationSeverity MinimumSeverity { get; }
    public bool Enabled { get; }
}

public sealed record MandatoryNotificationRule
{
    public MandatoryNotificationRule(string eventType, NotificationSeverity minimumSeverity, params NotificationChannel[] channels)
    {
        if (string.IsNullOrWhiteSpace(eventType)) throw new ArgumentException("Event type is required.");
        if (!Enum.IsDefined(minimumSeverity)) throw new ArgumentOutOfRangeException(nameof(minimumSeverity));
        if (channels is null || channels.Length == 0 || channels.Any(channel => !Enum.IsDefined(channel)))
            throw new ArgumentException("At least one valid notification channel is required.", nameof(channels));

        EventType = eventType.Trim();
        MinimumSeverity = minimumSeverity;
        Channels = channels.Distinct().ToHashSet();
    }

    public string EventType { get; }
    public NotificationSeverity MinimumSeverity { get; }
    public IReadOnlySet<NotificationChannel> Channels { get; }
}

public sealed class NotificationSafetyPolicy
{
    private readonly IReadOnlyList<MandatoryNotificationRule> rules;

    public NotificationSafetyPolicy(IEnumerable<MandatoryNotificationRule> rules)
    {
        ArgumentNullException.ThrowIfNull(rules);
        this.rules = rules.ToArray();
        if (this.rules.SelectMany(rule => rule.Channels.Select(channel => (rule.EventType, channel)))
            .GroupBy(key => key).Any(group => group.Count() > 1))
            throw new ArgumentException("Mandatory notification rules must be unique by event type and channel.", nameof(rules));
    }

    public static NotificationSafetyPolicy None { get; } = new([]);

    public bool RequiresDelivery(NotificationEvent notification, NotificationChannel channel) =>
        rules.Any(rule => string.Equals(rule.EventType, notification.EventType, StringComparison.Ordinal)
            && rule.Channels.Contains(channel)
            && notification.Severity >= rule.MinimumSeverity);
}

public sealed record NotificationEvent
{
    public NotificationEvent(Guid eventId, Guid userId, Guid? accountId, string eventType, NotificationSeverity severity,
        string subject, string redactedContentReference, DateTimeOffset occurredAt, string correlationId)
    {
        if (eventId == Guid.Empty || userId == Guid.Empty) throw new ArgumentException("Event and user IDs are required.");
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID cannot be empty when supplied.");
        if (!Enum.IsDefined(severity)) throw new ArgumentOutOfRangeException(nameof(severity));
        if (string.IsNullOrWhiteSpace(eventType) || string.IsNullOrWhiteSpace(subject)
            || string.IsNullOrWhiteSpace(redactedContentReference) || string.IsNullOrWhiteSpace(correlationId))
            throw new ArgumentException("Event type, subject, redacted reference and correlation ID are required.");
        if (occurredAt == default || occurredAt.Offset != TimeSpan.Zero)
            throw new ArgumentException("Notification occurrence time must be a non-default UTC value.");
        if (eventType.Length > 100 || subject.Length > 200 || redactedContentReference.Length > 500 || correlationId.Length > 100
            || eventType.Any(char.IsControl) || subject.Any(char.IsControl)
            || redactedContentReference.Any(char.IsControl) || correlationId.Any(char.IsControl))
            throw new ArgumentException("Notification evidence is outside its allowed bounds.");
        if (subject.Contains('@') || redactedContentReference.Contains("token", StringComparison.OrdinalIgnoreCase)
            || correlationId.Contains("token", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Notification evidence must not contain direct addresses or token material.");
        EventId = eventId;
        UserId = userId;
        AccountId = accountId;
        EventType = eventType.Trim();
        Severity = severity;
        Subject = subject.Trim();
        RedactedContentReference = redactedContentReference.Trim();
        OccurredAt = occurredAt;
        CorrelationId = correlationId.Trim();
    }
    public Guid EventId { get; }
    public Guid UserId { get; }
    public Guid? AccountId { get; }
    public string EventType { get; }
    public NotificationSeverity Severity { get; }
    public string Subject { get; }
    public string RedactedContentReference { get; }
    public DateTimeOffset OccurredAt { get; }
    public string CorrelationId { get; }
}

public sealed record DeliveryAttempt(
    Guid AttemptId, Guid EventId, Guid UserId, NotificationChannel Channel, NotificationSeverity Severity,
    string IdempotencyKey, string RedactedContentReference, DeliveryState State, int AttemptNumber,
    DateTimeOffset AttemptedAt, string? ProviderReceipt, string Reason)
{
    public bool IsAuthoritativeTradingState => AttemptNumber < 0;
    public bool CreatesLiveAuthority => AttemptNumber < 0;
}

public interface INotificationStore
{
    T Execute<T>(Func<NotificationState, T> operation);
}

public sealed class NotificationState
{
    public Dictionary<(Guid UserId, NotificationChannel Channel, string EventType), NotificationPreference> Preferences { get; } = [];
    public Dictionary<string, DeliveryAttempt> AttemptsByIdempotencyKey { get; } = new(StringComparer.Ordinal);
    public Dictionary<string, NotificationIntent> IntentsByIdempotencyKey { get; } = new(StringComparer.Ordinal);
    public List<DeliveryAttempt> Attempts { get; } = [];
}

public sealed record NotificationIntent(
    Guid EventId, Guid UserId, Guid? AccountId, string EventType, NotificationSeverity Severity,
    string Subject, string RedactedContentReference, DateTimeOffset OccurredAt, string CorrelationId,
    NotificationChannel Channel);
