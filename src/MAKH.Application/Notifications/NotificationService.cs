namespace MAKH.Application.Notifications;

public sealed class NotificationService(
    INotificationStore store,
    Func<DateTimeOffset> clock,
    NotificationSafetyPolicy? safetyPolicy = null)
{
    private const int MaximumDeliveryAttempts = 10;
    private readonly NotificationSafetyPolicy effectiveSafetyPolicy = safetyPolicy ?? NotificationSafetyPolicy.None;

    public NotificationPreference SetPreference(NotificationPreference preference)
    {
        ArgumentNullException.ThrowIfNull(preference);
        return store.Execute(state =>
        {
            state.Preferences[(preference.UserId, preference.Channel, preference.EventType)] = preference;
            return preference;
        });
    }

    public DeliveryAttempt Queue(NotificationEvent notification, NotificationChannel channel, string idempotencyKey)
    {
        ArgumentNullException.ThrowIfNull(notification);
        if (!Enum.IsDefined(channel)) throw new ArgumentOutOfRangeException(nameof(channel));
        var key = Required(idempotencyKey, 200);
        var now = clock();
        if (now == default || now.Offset != TimeSpan.Zero) throw new InvalidOperationException("Clock must return non-default UTC time.");
        if (notification.OccurredAt > now.AddSeconds(30)) throw new InvalidOperationException("Future notification cannot be queued.");
        var intent = new NotificationIntent(notification.EventId, notification.UserId, notification.AccountId,
            notification.EventType, notification.Severity, notification.Subject, notification.RedactedContentReference,
            notification.OccurredAt, notification.CorrelationId, channel);
        return store.Execute(state =>
        {
            if (state.AttemptsByIdempotencyKey.TryGetValue(key, out var replay))
                return state.IntentsByIdempotencyKey.GetValueOrDefault(key) == intent
                    ? replay : throw new InvalidOperationException("Notification idempotency key conflict.");
            var preference = state.Preferences.GetValueOrDefault((notification.UserId, channel, notification.EventType));
            var mandatory = effectiveSafetyPolicy.RequiresDelivery(notification, channel);
            var enabled = mandatory || preference is not null && preference.Enabled && notification.Severity >= preference.MinimumSeverity;
            var attempt = new DeliveryAttempt(Guid.NewGuid(), notification.EventId, notification.UserId, channel,
                notification.Severity, key, notification.RedactedContentReference,
                enabled ? DeliveryState.Pending : DeliveryState.Suppressed, 0, now, null,
                mandatory ? "Delivery queued from mandatory safety policy."
                    : enabled ? "Delivery queued from explicit preference."
                    : "Suppressed because no mandatory rule or matching enabled severity preference exists.");
            state.AttemptsByIdempotencyKey.Add(key, attempt);
            state.IntentsByIdempotencyKey.Add(key, intent);
            state.Attempts.Add(attempt);
            return attempt;
        });
    }

    public DeliveryAttempt RecordResult(Guid attemptId, bool delivered, string? providerReceipt, string reason)
    {
        var requiredReason = Required(reason, 500);
        if (ContainsSensitiveMaterial(requiredReason)) throw new ArgumentException("Result reason contains sensitive material.", nameof(reason));
        return store.Execute(state =>
        {
            var index = state.Attempts.FindIndex(item => item.AttemptId == attemptId);
            if (index < 0) throw new KeyNotFoundException("Delivery attempt was not found.");
            var current = state.Attempts[index];
            if (current.State == DeliveryState.Suppressed) throw new InvalidOperationException("Suppressed delivery cannot receive a provider result.");
            if (current.State == DeliveryState.Delivered) return current;
            if (current.AttemptNumber >= MaximumDeliveryAttempts) throw new InvalidOperationException("Maximum delivery attempts reached.");
            var now = clock();
            if (now == default || now.Offset != TimeSpan.Zero || now < current.AttemptedAt)
                throw new InvalidOperationException("Delivery result time must be non-regressing UTC.");
            var updated = current with
            {
                State = delivered ? DeliveryState.Delivered : DeliveryState.Failed,
                AttemptNumber = current.AttemptNumber + 1,
                AttemptedAt = now,
                ProviderReceipt = delivered ? RedactReceipt(providerReceipt) : null,
                Reason = requiredReason,
            };
            state.Attempts[index] = updated;
            state.AttemptsByIdempotencyKey[current.IdempotencyKey] = updated;
            return updated;
        });
    }

    public IReadOnlyList<DeliveryAttempt> GetAudit(Guid userId) => store.Execute(state =>
        state.Attempts.Where(item => item.UserId == userId).ToArray());

    private static string? RedactReceipt(string? receipt) => string.IsNullOrWhiteSpace(receipt) ? null
        : receipt.Length <= 8 ? "[redacted]" : $"{receipt[..4]}…{receipt[^4..]}";
    private static string Required(string value, int maximumLength)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new ArgumentException("Value is required.");
        var normalized = value.Trim();
        if (normalized.Length > maximumLength || normalized.Any(char.IsControl))
            throw new ArgumentException("Value is outside its allowed bounds.");
        return normalized;
    }

    private static bool ContainsSensitiveMaterial(string value) =>
        value.Contains('@') || value.Contains("token", StringComparison.OrdinalIgnoreCase)
        || value.Contains("secret", StringComparison.OrdinalIgnoreCase);
}
