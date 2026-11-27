using MAKH.Application.Market;
using MAKH.Infrastructure.Market;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class MarketDataAdapterTests
{
    private static readonly Guid SecurityId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly DateTimeOffset EventTime = new(2026, 8, 12, 14, 30, 0, TimeSpan.Zero);

    [Fact]
    public void FreshQuoteIsExecutable()
    {
        var quote = MarketDataNormalizer.NormalizeQuote(
            SecurityId,
            4.99m,
            5.01m,
            100,
            200,
            Provenance("quote-1", 1),
            EventTime.AddSeconds(1),
            TimeSpan.FromSeconds(5));

        Assert.Equal(QuoteQuality.Valid, quote.Quality);
        Assert.True(quote.IsExecutable);
    }

    [Theory]
    [InlineData(5.02, 5.01, QuoteQuality.Crossed)]
    [InlineData(5.01, 5.01, QuoteQuality.Locked)]
    public void QuoteShapeIsClassified(decimal bid, decimal ask, QuoteQuality expected)
    {
        var quote = MarketDataNormalizer.NormalizeQuote(
            SecurityId,
            bid,
            ask,
            100,
            100,
            Provenance("quote-shape", 2),
            EventTime,
            TimeSpan.FromSeconds(5));

        Assert.Equal(expected, quote.Quality);
        Assert.Equal(expected == QuoteQuality.Locked, quote.IsExecutable);
    }

    [Fact]
    public void StaleQuoteFailsClosed()
    {
        var quote = MarketDataNormalizer.NormalizeQuote(
            SecurityId,
            4.99m,
            5.01m,
            100,
            100,
            Provenance("quote-stale", 3),
            EventTime.AddSeconds(6),
            TimeSpan.FromSeconds(5));

        Assert.Equal(QuoteQuality.Stale, quote.Quality);
        Assert.False(quote.IsExecutable);
    }

    [Fact]
    public void FutureDatedQuoteIsRejected()
    {
        Assert.Throws<ArgumentException>(() => MarketDataNormalizer.NormalizeQuote(
            SecurityId, 4.99m, 5.01m, 100, 100, Provenance("future", 1), EventTime.AddMilliseconds(-1), TimeSpan.FromSeconds(5)));
    }

    [Fact]
    public void ProvenanceRequiresPositiveSequenceAndRejectsSelfCorrection()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() => Provenance("zero", 0));
        Assert.Throws<ArgumentException>(() => new MarketEventProvenance("synthetic", "same", 1, EventTime, EventTime, "same"));
    }

    [Fact]
    public void QuoteQualityMustMatchPriceShape()
    {
        Assert.Throws<ArgumentException>(() => new QuoteEvent(SecurityId, 5.02m, 5.01m, 1, 1, QuoteQuality.Valid, Provenance("bad-quality", 1)));
    }

    [Fact]
    public void CancelledTradeDoesNotContributeToMetrics()
    {
        var trade = new TradeEvent(SecurityId, 5m, 300, true, true, Provenance("trade-cancel", 4));

        Assert.False(trade.ContributesToMetrics);
    }

    [Fact]
    public void InvalidBarIsRejected()
    {
        Assert.Throws<ArgumentException>(() => new BarEvent(
            SecurityId,
            EventTime,
            TimeSpan.FromMinutes(1),
            5m,
            4m,
            3m,
            5m,
            100,
            1,
            Provenance("bar-invalid", 5)));
    }

    [Fact]
    public async Task SyntheticAdapterOrdersFiltersAndDeduplicates()
    {
        var otherSecurity = Guid.NewGuid();
        var duplicate = new TradeEvent(SecurityId, 5m, 100, true, false, Provenance("trade-1", 2));
        var adapter = new SyntheticMarketDataAdapter([
            duplicate,
            new TradeEvent(otherSecurity, 7m, 100, true, false, Provenance("other", 1)),
            duplicate,
            new MarketStatusEvent(SecurityId, MarketTradingState.Open, "regular session", Provenance("status-1", 1)),
        ]);

        var result = await CollectAsync(adapter.StreamAsync([SecurityId]));

        Assert.Equal(2, result.Count);
        Assert.Equal([1L, 2L], result.Select(item => item.Provenance.Sequence));
    }

    [Fact]
    public async Task CorrectionIsRetainedWithProvenance()
    {
        var original = new TradeEvent(SecurityId, 5m, 100, true, false, Provenance("trade-original", 1));
        var corrected = new TradeEvent(
            SecurityId,
            5.05m,
            100,
            true,
            false,
            new MarketEventProvenance("synthetic", "trade-correction", 2, EventTime, EventTime.AddMilliseconds(10), original.Provenance.EventId));
        var adapter = new SyntheticMarketDataAdapter([original, corrected]);

        var result = await CollectAsync(adapter.StreamAsync([SecurityId]));

        Assert.Equal(2, result.Count);
        Assert.True(result[1].Provenance.IsCorrection);
    }

    [Fact]
    public async Task AdapterRejectsOrphanCorrectionAndSequenceCollision()
    {
        var orphan = new TradeEvent(SecurityId, 5m, 100, true, false,
            new MarketEventProvenance("synthetic", "orphan", 2, EventTime, EventTime, "missing"));
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await CollectAsync(new SyntheticMarketDataAdapter([orphan]).StreamAsync([SecurityId])));

        var first = new TradeEvent(SecurityId, 5m, 100, true, false, Provenance("first", 1));
        var collision = new TradeEvent(SecurityId, 5.01m, 100, true, false, Provenance("collision", 1));
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await CollectAsync(new SyntheticMarketDataAdapter([first, collision]).StreamAsync([SecurityId])));
    }

    [Fact]
    public async Task AdapterFailsClosedOnProviderMismatch()
    {
        var foreignEvent = new TradeEvent(
            SecurityId,
            5m,
            100,
            true,
            false,
            new MarketEventProvenance("foreign", "trade-foreign", 1, EventTime, EventTime));
        var adapter = new SyntheticMarketDataAdapter([foreignEvent]);

        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await CollectAsync(adapter.StreamAsync([SecurityId])));
    }

    [Theory]
    [InlineData(MarketTradingState.Unknown, false)]
    [InlineData(MarketTradingState.Halted, false)]
    [InlineData(MarketTradingState.Open, true)]
    public void OnlyOpenMarketAllowsNewExposure(MarketTradingState state, bool expected)
    {
        var status = new MarketStatusEvent(SecurityId, state, "synthetic status", Provenance($"status-{state}", 6));

        Assert.Equal(expected, status.AllowsNewExposure);
    }

    private static MarketEventProvenance Provenance(string eventId, long sequence) =>
        new("synthetic", eventId, sequence, EventTime, EventTime.AddMilliseconds(10));

    private static async Task<List<NormalizedMarketEvent>> CollectAsync(IAsyncEnumerable<NormalizedMarketEvent> events)
    {
        var result = new List<NormalizedMarketEvent>();
        await foreach (var item in events) result.Add(item);
        return result;
    }
}
