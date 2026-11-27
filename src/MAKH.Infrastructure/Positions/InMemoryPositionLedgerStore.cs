using MAKH.Application.Positions;

namespace MAKH.Infrastructure.Positions;

public sealed class InMemoryPositionLedgerStore : IPositionLedgerStore
{
    private readonly object sync = new();
    private readonly PositionLedgerState state = new();
    public T Execute<T>(Func<PositionLedgerState, T> operation)
    {
        ArgumentNullException.ThrowIfNull(operation);
        lock (sync) return operation(state);
    }
}
