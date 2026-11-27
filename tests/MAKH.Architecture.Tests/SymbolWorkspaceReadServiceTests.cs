using MAKH.Application.Market;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class SymbolWorkspaceReadServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 10, 4, 12, 0, 0, TimeSpan.Zero);
    private readonly SymbolWorkspaceReadService service = new();

    [Fact]
    public void KnownSyntheticSymbolReturnsOrderedReadOnlyEvidence()
    {
        var result = service.Find("synb", Now)!;

        Assert.Equal("SYNB", result.Symbol);
        Assert.Equal("Synthetic", result.DataMode);
        Assert.Equal(["Primary", "Attributed", "Low trust"], result.Evidence.Select(item => item.Trust));
        Assert.All(result.Evidence, item => Assert.False(item.CatalystVerified));
        Assert.False(result.CreatesTradingAuthority);
        Assert.False(result.CanSubmitOrder);
    }

    [Fact]
    public void UnknownSymbolReturnsNoSyntheticFallback() =>
        Assert.Null(service.Find("NOPE", Now));

    [Theory]
    [InlineData("")]
    [InlineData("TOO-LONG-SYMBOL")]
    [InlineData("BAD/SYMBOL")]
    [InlineData("SYNB?")]
    public void UnsafeSymbolFailsClosed(string symbol) =>
        Assert.Throws<ArgumentException>(() => service.Find(symbol, Now));

    [Fact]
    public void SnapshotUsesRequestedClockAndBoundedFreshness()
    {
        var result = service.Find("SYNB", Now)!;

        Assert.Equal(Now, result.AsOf);
        Assert.Equal(35, result.Quote.AgeSeconds);
        Assert.All(result.Evidence, item => Assert.InRange(Now - item.ObservedAt, TimeSpan.Zero, TimeSpan.FromMinutes(20)));
    }
}
