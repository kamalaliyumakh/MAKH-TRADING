using System.Text.Json;
using MAKH.Application.Common;
using MAKH.Application.Common.Ports;
using MAKH.Application.Security;
using Microsoft.AspNetCore.SignalR;

namespace MAKH.Api.Realtime;

public sealed record ScannerRealtimeEvent(
    Guid EventId,
    string EventType,
    int SchemaVersion,
    string Stream,
    long Sequence,
    DateTimeOffset OccurredAt,
    DateTimeOffset PublishedAt,
    JsonElement Payload);

public interface IScannerRealtimeSender
{
    Task SendAsync(Guid accountId, ScannerRealtimeEvent message, CancellationToken cancellationToken);
}

public interface IScannerHubDelivery
{
    Task SendAsync(
        IReadOnlyList<string> connectionIds,
        ScannerRealtimeEvent message,
        CancellationToken cancellationToken);
}

public sealed class SignalRScannerHubDelivery(IHubContext<TradingHub> hub) : IScannerHubDelivery
{
    public Task SendAsync(
        IReadOnlyList<string> connectionIds,
        ScannerRealtimeEvent message,
        CancellationToken cancellationToken) =>
        hub.Clients.Clients(connectionIds).SendAsync(message.EventType, message, cancellationToken);
}

public sealed class SignalRScannerRealtimeSender(
    IScannerHubDelivery delivery,
    ScannerConnectionRegistry connections,
    IServerSessionRegistry sessions,
    IClock clock) : IScannerRealtimeSender
{
    public async Task SendAsync(
        Guid accountId, ScannerRealtimeEvent message, CancellationToken cancellationToken)
    {
        var activeConnectionIds = new List<string>();
        foreach (var connection in connections.ForAccount(accountId))
        {
            if (await sessions.IsActiveAsync(
                    connection.SessionId, connection.UserId, clock.UtcNow, cancellationToken))
            {
                activeConnectionIds.Add(connection.ConnectionId);
            }
            else
            {
                connections.Disconnect(connection.ConnectionId);
            }
        }

        if (activeConnectionIds.Count > 0)
        {
            await delivery.SendAsync(activeConnectionIds, message, cancellationToken);
        }
    }
}

public sealed class SignalRScannerOutboxPublisher(IScannerRealtimeSender sender, IClock clock) : IOutboxPublisher
{
    public async Task PublishAsync(OutboxDelivery delivery, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(delivery);
        if (!string.Equals(delivery.EventType, "scanner.updated", StringComparison.Ordinal))
            throw new InvalidOperationException("Unsupported outbox event type.");
        if (delivery.AccountId == Guid.Empty || delivery.SchemaVersion != 1 || delivery.StreamSequence <= 0)
            throw new InvalidOperationException("Scanner event routing metadata is invalid.");

        using var document = JsonDocument.Parse(delivery.Payload);
        ScannerRealtimePayloadValidator.Validate(document.RootElement);
        var stream = ScannerRealtimeGroups.ForAccount(delivery.AccountId);
        var message = new ScannerRealtimeEvent(
            delivery.Id,
            delivery.EventType,
            delivery.SchemaVersion,
            stream,
            delivery.StreamSequence,
            delivery.OccurredAt,
            clock.UtcNow,
            document.RootElement.Clone());
        await sender.SendAsync(delivery.AccountId, message, cancellationToken);
    }
}

internal static class ScannerRealtimePayloadValidator
{
    public static void Validate(JsonElement payload)
    {
        if (payload.ValueKind != JsonValueKind.Object
            || !NonEmptyString(payload, "scannerVersion")
            || !GuidValue(payload, "runId")
            || !DateTimeOffsetValue(payload, "asOf")
            || !payload.TryGetProperty("upserts", out var upserts) || upserts.ValueKind != JsonValueKind.Array
            || !payload.TryGetProperty("removals", out var removals) || removals.ValueKind != JsonValueKind.Array)
            throw new InvalidOperationException("Scanner event payload contract is invalid.");

        var supersedes = payload.GetProperty("supersedesRunId");
        var reason = payload.GetProperty("correctionReason");
        var normal = supersedes.ValueKind == JsonValueKind.Null && reason.ValueKind == JsonValueKind.Null;
        var correction = supersedes.ValueKind == JsonValueKind.String
            && Guid.TryParse(supersedes.GetString(), out _)
            && reason.ValueKind == JsonValueKind.String
            && reason.GetString() is { } correctionReason
            && correctionReason.Trim().Length is > 0 and <= 500;
        if (!normal && !correction)
            throw new InvalidOperationException("Scanner correction metadata is invalid.");

        var upsertIds = new HashSet<Guid>();
        foreach (var candidate in upserts.EnumerateArray())
        {
            if (candidate.ValueKind != JsonValueKind.Object
                || !GuidValue(candidate, "securityId")
                || !NonEmptyString(candidate, "symbol")
                || !BooleanValue(candidate, "qualified")
                || !BooleanValue(candidate, "extremeMoveRisk")
                || !NullableNumber(candidate, "rank")
                || !NullableNumber(candidate, "price")
                || !NullableNumber(candidate, "gainPercent")
                || !NullableNumber(candidate, "relativeVolume")
                || !NullableNumber(candidate, "publicFloat")
                || !NullableNumber(candidate, "spreadPercent")
                || !NullableNumber(candidate, "dollarVolume")
                || !StringValue(candidate, "exclusionReason")
                || !upsertIds.Add(candidate.GetProperty("securityId").GetGuid()))
                throw new InvalidOperationException("Scanner candidate payload contract is invalid.");
        }

        var removalIds = new HashSet<Guid>();
        foreach (var removal in removals.EnumerateArray())
        {
            if (removal.ValueKind != JsonValueKind.String
                || !Guid.TryParse(removal.GetString(), out var removalId)
                || !removalIds.Add(removalId)
                || upsertIds.Contains(removalId))
                throw new InvalidOperationException("Scanner removal payload contract is invalid.");
        }
    }

    private static bool NonEmptyString(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value)
        && value.ValueKind == JsonValueKind.String
        && !string.IsNullOrWhiteSpace(value.GetString());

    private static bool StringValue(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value) && value.ValueKind == JsonValueKind.String;

    private static bool GuidValue(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value)
        && value.ValueKind == JsonValueKind.String
        && Guid.TryParse(value.GetString(), out _);

    private static bool DateTimeOffsetValue(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value)
        && value.ValueKind == JsonValueKind.String
        && DateTimeOffset.TryParse(value.GetString(), out _);

    private static bool BooleanValue(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value)
        && value.ValueKind is JsonValueKind.True or JsonValueKind.False;

    private static bool NullableNumber(JsonElement element, string name) =>
        element.TryGetProperty(name, out var value)
        && value.ValueKind is JsonValueKind.Number or JsonValueKind.Null;
}
