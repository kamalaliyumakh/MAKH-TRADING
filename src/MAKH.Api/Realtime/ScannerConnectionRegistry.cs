using System.Collections.Concurrent;

namespace MAKH.Api.Realtime;

public sealed record ScannerConnection(
    string ConnectionId,
    Guid UserId,
    Guid AccountId,
    Guid SessionId,
    Action Abort);

public sealed class ScannerConnectionRegistry
{
    private readonly ConcurrentDictionary<string, ScannerConnection> connections =
        new(StringComparer.Ordinal);

    public void Register(ScannerConnection connection)
    {
        ArgumentNullException.ThrowIfNull(connection);
        if (string.IsNullOrWhiteSpace(connection.ConnectionId)
            || connection.UserId == Guid.Empty
            || connection.AccountId == Guid.Empty
            || connection.SessionId == Guid.Empty)
        {
            throw new ArgumentException("Complete scanner connection identity is required.", nameof(connection));
        }

        if (!connections.TryAdd(connection.ConnectionId, connection))
            throw new InvalidOperationException("Scanner connection is already registered.");
    }

    public void Unregister(string connectionId) => connections.TryRemove(connectionId, out _);

    public IReadOnlyList<ScannerConnection> ForAccount(Guid accountId) =>
        connections.Values
            .Where(connection => connection.AccountId == accountId)
            .OrderBy(connection => connection.ConnectionId, StringComparer.Ordinal)
            .ToArray();

    public int DisconnectSession(Guid sessionId)
    {
        if (sessionId == Guid.Empty) return 0;
        var disconnected = 0;
        foreach (var connection in connections.Values.Where(item => item.SessionId == sessionId).ToArray())
        {
            if (!connections.TryRemove(connection.ConnectionId, out var removed)) continue;
            removed.Abort();
            disconnected++;
        }

        return disconnected;
    }

    public bool Disconnect(string connectionId)
    {
        if (!connections.TryRemove(connectionId, out var connection)) return false;
        connection.Abort();
        return true;
    }
}
