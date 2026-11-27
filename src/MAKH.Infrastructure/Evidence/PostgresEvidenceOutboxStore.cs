using System.Data;
using MAKH.Application.Evidence;
using MAKH.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace MAKH.Infrastructure.Evidence;

public sealed class PostgresEvidenceOutboxStore(PlatformDbContext context) : IEvidenceOutboxStore
{
    public async Task<IReadOnlyList<EvidenceOutboxDelivery>> ClaimNextAsync(
        string owner,
        DateTimeOffset now,
        TimeSpan leaseDuration,
        int limit,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(owner)) throw new ArgumentException("Lease owner is required.", nameof(owner));
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(leaseDuration, TimeSpan.Zero);
        ArgumentOutOfRangeException.ThrowIfLessThan(limit, 1);

        await context.Database.OpenConnectionAsync(cancellationToken);
        await using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
        await using var command = context.Database.GetDbConnection().CreateCommand();
        command.Transaction = transaction.GetDbTransaction();
        command.CommandText = """
            WITH candidates AS (
                SELECT message.id
                FROM evidence.outbox_messages message
                WHERE message.published_at IS NULL
                  AND message.next_attempt_at <= @now
                  AND (message.lease_until IS NULL OR message.lease_until <= @now)
                ORDER BY message.occurred_at, message.id
                FOR UPDATE SKIP LOCKED
                LIMIT @limit
            )
            UPDATE evidence.outbox_messages message
            SET lease_owner = @owner,
                lease_until = @leaseUntil,
                attempt_count = message.attempt_count + 1
            FROM candidates
            WHERE message.id = candidates.id
            RETURNING message.id, message.evidence_document_id, message.event_type,
                      message.schema_version, message.attempt_count, message.occurred_at,
                      message.payload::text;
            """;
        AddParameter(command, "now", DbType.DateTimeOffset, now);
        AddParameter(command, "leaseUntil", DbType.DateTimeOffset, now.Add(leaseDuration));
        AddParameter(command, "owner", DbType.String, owner.Trim());
        AddParameter(command, "limit", DbType.Int32, limit);

        var deliveries = new List<EvidenceOutboxDelivery>();
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        while (await reader.ReadAsync(cancellationToken))
        {
            deliveries.Add(new(
                reader.GetGuid(0),
                reader.GetGuid(1),
                reader.GetString(2),
                reader.GetInt32(3),
                reader.GetInt32(4),
                reader.GetFieldValue<DateTimeOffset>(5),
                reader.GetString(6)));
        }
        await reader.CloseAsync();
        await transaction.CommitAsync(cancellationToken);
        return deliveries;
    }

    public Task MarkPublishedAsync(
        Guid messageId, string owner, DateTimeOffset publishedAt, CancellationToken cancellationToken) =>
        TransitionAsync(messageId, owner, publishedAt, null, null, cancellationToken);

    public Task MarkFailedAsync(
        Guid messageId,
        string owner,
        DateTimeOffset nextAttemptAt,
        string errorMessage,
        CancellationToken cancellationToken) =>
        TransitionAsync(
            messageId,
            owner,
            null,
            nextAttemptAt,
            string.IsNullOrWhiteSpace(errorMessage)
                ? "PublicationFailed"
                : errorMessage.Trim()[..Math.Min(160, errorMessage.Trim().Length)],
            cancellationToken);

    private async Task TransitionAsync(
        Guid messageId,
        string owner,
        DateTimeOffset? publishedAt,
        DateTimeOffset? nextAttemptAt,
        string? error,
        CancellationToken cancellationToken)
    {
        if (messageId == Guid.Empty) throw new ArgumentException("Message ID is required.", nameof(messageId));
        if (string.IsNullOrWhiteSpace(owner)) throw new ArgumentException("Lease owner is required.", nameof(owner));
        var affected = await context.Database.ExecuteSqlInterpolatedAsync($"""
            UPDATE evidence.outbox_messages
            SET published_at = COALESCE({publishedAt}, published_at),
                next_attempt_at = COALESCE({nextAttemptAt}, next_attempt_at),
                last_error = {error},
                lease_owner = NULL,
                lease_until = NULL
            WHERE id = {messageId} AND lease_owner = {owner.Trim()} AND published_at IS NULL
            """, cancellationToken);
        if (affected != 1) throw new InvalidOperationException("Evidence outbox lease is missing or no longer owned.");
    }

    private static void AddParameter(IDbCommand command, string name, DbType type, object value)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.DbType = type;
        parameter.Value = value;
        command.Parameters.Add(parameter);
    }
}
