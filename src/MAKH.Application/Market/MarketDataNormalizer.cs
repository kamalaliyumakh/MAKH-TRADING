namespace MAKH.Application.Market;

public static class MarketDataNormalizer
{
    public static QuoteEvent NormalizeQuote(
        Guid securityId,
        decimal bid,
        decimal ask,
        long bidSize,
        long askSize,
        MarketEventProvenance provenance,
        DateTimeOffset evaluatedAt,
        TimeSpan maximumAge)
    {
        ArgumentOutOfRangeException.ThrowIfLessThanOrEqual(maximumAge, TimeSpan.Zero);
        if (evaluatedAt < provenance.EventTime)
            throw new ArgumentException("Evaluation time cannot precede the provider event time.", nameof(evaluatedAt));

        var quality = evaluatedAt - provenance.EventTime > maximumAge
            ? QuoteQuality.Stale
            : bid > ask
                ? QuoteQuality.Crossed
                : bid == ask
                    ? QuoteQuality.Locked
                    : QuoteQuality.Valid;

        return new QuoteEvent(securityId, bid, ask, bidSize, askSize, quality, provenance);
    }
}
