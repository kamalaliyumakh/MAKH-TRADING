using MAKH.Application.Notifications;

namespace MAKH.Infrastructure.Notifications;

public sealed class InMemoryNotificationStore : INotificationStore
{
    private readonly object sync = new();
    private readonly NotificationState state = new();
    public T Execute<T>(Func<NotificationState, T> operation)
    {
        ArgumentNullException.ThrowIfNull(operation);
        lock (sync) return operation(state);
    }
}
