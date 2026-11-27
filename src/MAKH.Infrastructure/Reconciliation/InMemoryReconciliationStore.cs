using MAKH.Application.Reconciliation;

namespace MAKH.Infrastructure.Reconciliation;

public sealed class InMemoryReconciliationStore : IReconciliationStore
{
    private readonly object sync = new();
    private readonly ReconciliationLedgerState state = new();

    public T Execute<T>(Func<ReconciliationLedgerState, T> operation)
    {
        ArgumentNullException.ThrowIfNull(operation);
        lock (sync) return operation(state);
    }
}
