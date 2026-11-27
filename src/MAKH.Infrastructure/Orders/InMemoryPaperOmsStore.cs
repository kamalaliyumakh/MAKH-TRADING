using MAKH.Application.Orders;

namespace MAKH.Infrastructure.Orders;

public sealed class InMemoryPaperOmsStore : IPaperOmsStore
{
    private readonly object sync = new();
    private readonly PaperOmsState state = new();

    public T Execute<T>(Func<PaperOmsState, T> operation)
    {
        ArgumentNullException.ThrowIfNull(operation);
        lock (sync) return operation(state);
    }
}
