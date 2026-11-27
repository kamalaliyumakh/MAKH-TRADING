using MAKH.Application.Administration;

namespace MAKH.Infrastructure.Administration;

public sealed class InMemoryAdministrationStore : IAdministrationStore
{
    private readonly object sync = new();
    private readonly AdministrationState state = new();
    public T Execute<T>(Func<AdministrationState, T> operation) { lock (sync) return operation(state); }
}
