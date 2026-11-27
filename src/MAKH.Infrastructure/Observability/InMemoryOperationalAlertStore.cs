using MAKH.Application.Observability;

namespace MAKH.Infrastructure.Observability;

public sealed class InMemoryOperationalAlertStore : IOperationalAlertStore
{
    private readonly object sync = new();
    private readonly OperationalAlertStateStore state = new();
    public T Execute<T>(Func<OperationalAlertStateStore, T> operation) { lock (sync) return operation(state); }
}
