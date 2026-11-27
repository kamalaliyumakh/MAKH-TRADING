namespace MAKH.Application.Journal;

public sealed record JournalEntrySnapshot(
    Guid EntryId,
    string Symbol,
    string Side,
    string State,
    DateTimeOffset OpenedAt,
    string Thesis,
    string Outcome,
    decimal? ResultPercent,
    IReadOnlyList<string> Tags,
    int EvidenceCount);

public sealed record JournalSnapshot(
    Guid AccountId,
    Guid UserId,
    string SnapshotId,
    DateTimeOffset AsOf,
    IReadOnlyList<JournalEntrySnapshot> Entries,
    string DataMode,
    bool ContainsPersonalNotes,
    bool IsReadOnly,
    bool CreatesTradingAuthority,
    bool CanChangeRisk,
    bool CanSubmitOrder);

public sealed class JournalReadService
{
    private readonly string dataMode = "Synthetic";

    public JournalSnapshot Snapshot(Guid accountId, Guid userId, DateTimeOffset asOf)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account is required.", nameof(accountId));
        if (userId == Guid.Empty) throw new ArgumentException("User is required.", nameof(userId));

        return new(
            accountId,
            userId,
            $"synthetic-journal-{asOf:yyyyMMddHHmmss}",
            asOf,
            [
                new(Guid.Parse("61000000-0000-0000-0000-000000000001"), "TRKA", "Long", "Reviewed",
                    asOf.AddDays(-4), "Relative volume and a verified primary-source catalyst supported review.",
                    "Exited according to the documented synthetic plan.", 18.4m,
                    ["catalyst", "momentum", "reviewed"], 3),
                new(Guid.Parse("61000000-0000-0000-0000-000000000002"), "XCUR", "Long", "Reviewed",
                    asOf.AddDays(-2), "Liquidity remained acceptable while attention increased.",
                    "The synthetic setup invalidated before entry conditions were satisfied.", -4.6m,
                    ["invalidation", "liquidity", "reviewed"], 2),
                new(Guid.Parse("61000000-0000-0000-0000-000000000003"), "SYNB", "Long", "Draft",
                    asOf.AddHours(-6), "Extreme price expansion requires evidence and risk review.",
                    "Outcome review is pending. No execution authority exists.", null,
                    ["draft", "extreme-move", "synthetic"], 3),
                new(Guid.Parse("61000000-0000-0000-0000-000000000004"), "DFLI", "Long", "Archived",
                    asOf.AddDays(-8), "Synthetic earnings momentum was recorded for process review.",
                    "Archived after the review window closed.", 7.2m,
                    ["archived", "earnings", "reviewed"], 2),
            ],
            dataMode,
            false,
            true,
            false,
            false,
            false);
    }
}
