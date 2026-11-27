using MAKH.Application.Journal;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class JournalReadServiceTests
{
    private static readonly Guid AccountId = Guid.Parse("11111111-2222-3333-4444-555555555555");
    private static readonly Guid UserId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    private static readonly DateTimeOffset AsOf = new(2026, 10, 5, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void SnapshotIsScopedSyntheticReadOnlyAndNonAuthoritative()
    {
        var snapshot = new JournalReadService().Snapshot(AccountId, UserId, AsOf);

        Assert.Equal(AccountId, snapshot.AccountId);
        Assert.Equal(UserId, snapshot.UserId);
        Assert.Equal("Synthetic", snapshot.DataMode);
        Assert.False(snapshot.ContainsPersonalNotes);
        Assert.True(snapshot.IsReadOnly);
        Assert.False(snapshot.CreatesTradingAuthority);
        Assert.False(snapshot.CanChangeRisk);
        Assert.False(snapshot.CanSubmitOrder);
    }

    [Fact]
    public void SnapshotUsesClockRelativeEvidenceBearingLifecycleEntries()
    {
        var snapshot = new JournalReadService().Snapshot(AccountId, UserId, AsOf);

        Assert.Equal(4, snapshot.Entries.Count);
        Assert.All(snapshot.Entries, entry =>
        {
            Assert.True(entry.OpenedAt < AsOf);
            Assert.True(entry.EvidenceCount > 0);
            Assert.NotEmpty(entry.Tags);
        });
        Assert.Contains(snapshot.Entries, entry => entry.State == "Draft" && entry.ResultPercent is null);
        Assert.Contains(snapshot.Entries, entry => entry.State == "Reviewed" && entry.ResultPercent is not null);
        Assert.Contains(snapshot.Entries, entry => entry.State == "Archived");
    }

    [Theory]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public void SnapshotRejectsMissingScope(bool emptyAccount, bool emptyUser)
    {
        Assert.Throws<ArgumentException>(() => new JournalReadService().Snapshot(
            emptyAccount ? Guid.Empty : AccountId,
            emptyUser ? Guid.Empty : UserId,
            AsOf));
    }
}
