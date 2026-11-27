using MAKH.Application.Market;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class DashboardReadServiceTests
{
    private static readonly Guid AccountId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly DateTimeOffset Now = new(2026, 10, 5, 12, 0, 0, TimeSpan.Zero);
    private readonly DashboardReadService service = new();

    [Fact]
    public void SnapshotIsAccountScopedReadOnlyAndEntryLocked()
    {
        var result = service.Snapshot(AccountId, Now);

        Assert.Equal(AccountId, result.AccountId);
        Assert.Equal("PAPER", result.Mode);
        Assert.Equal("Locked", result.EntryState);
        Assert.Equal("Synthetic", result.DataMode);
        Assert.False(result.ReconciledBrokerTruth);
        Assert.False(result.CreatesTradingAuthority);
        Assert.False(result.CanSubmitOrder);
    }

    [Fact]
    public void SnapshotUsesClockAndKeepsAuthorityDependenciesUnavailable()
    {
        var result = service.Snapshot(AccountId, Now);

        Assert.Equal(Now, result.AsOf);
        Assert.Equal(Now, result.Pnl.AsOf);
        Assert.Null(result.Risk.BuyingPower);
        Assert.All(result.Dependencies.Where(item =>
            item.Name is "Risk service" or "Broker" or "Reconciliation"),
            item => Assert.Equal("Unavailable", item.State));
    }

    [Fact]
    public void EmptyAccountFailsClosed() =>
        Assert.Throws<ArgumentException>(() => service.Snapshot(Guid.Empty, Now));
}
