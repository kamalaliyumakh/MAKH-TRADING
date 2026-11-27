namespace MAKH.Application.Market;

public sealed record SymbolPricePoint(string Time, decimal Price);
public sealed record SymbolEvidenceItem(
    string Id,
    string Kind,
    string Headline,
    string Source,
    string Trust,
    DateTimeOffset ObservedAt,
    string Limitation,
    bool CatalystVerified);
public sealed record SymbolQuote(decimal Bid, decimal Ask, decimal Last, int AgeSeconds, string State);
public sealed record SymbolMetrics(
    decimal GainPercent,
    decimal RelativeVolume,
    long PublicFloat,
    decimal SpreadPercent,
    decimal DollarVolume,
    bool ExtremeMoveRisk);
public sealed record SymbolThesis(
    string Summary,
    string CatalystStatus,
    string Invalidation,
    string ExitPlan);
public sealed record SymbolWorkspaceSnapshot(
    Guid SecurityId,
    string Symbol,
    string CompanyName,
    string VenueMic,
    string Tradability,
    DateTimeOffset AsOf,
    SymbolQuote Quote,
    SymbolMetrics Metrics,
    IReadOnlyList<SymbolPricePoint> PricePoints,
    string EvidenceSnapshotHash,
    IReadOnlyList<SymbolEvidenceItem> Evidence,
    SymbolThesis Thesis,
    string DataMode,
    bool CreatesTradingAuthority,
    bool CanSubmitOrder);

public sealed class SymbolWorkspaceReadService
{
    private readonly Guid syntheticSecurityId =
        Guid.Parse("91000000-0000-0000-0000-000000000001");

    public SymbolWorkspaceSnapshot? Find(string symbol, DateTimeOffset asOf)
    {
        var normalized = NormalizeSymbol(symbol);
        if (!string.Equals(normalized, "SYNB", StringComparison.Ordinal)) return null;
        return new(
            syntheticSecurityId,
            "SYNB",
            "Synthetic Biotech B",
            "XNAS",
            "Review only",
            asOf,
            new(5.16m, 5.19m, 5.18m, 35, "Current"),
            new(159m, 4.2m, 420_000, 0.58m, 2_780_000m, true),
            [
                new("14:30", 3.12m), new("14:35", 3.48m), new("14:40", 4.10m),
                new("14:45", 4.72m), new("14:50", 4.44m), new("14:55", 5.02m),
                new("15:00", 5.18m),
            ],
            "85e5b850f770c7a8b581eec9790bc4f2f29525da38eea8667a3613d9e1a95107",
            [
                new("filing-1", "SEC filing", "Synthetic current report filed for workspace testing",
                    "Synthetic SEC fixture · accession 0000000000-26-000001", "Primary",
                    asOf.AddMinutes(-18), "Primary-source evidence is eligible for review but is not a verification decision.", false),
                new("news-1", "News", "Synthetic publisher reports a material company update",
                    "Synthetic attributed publisher", "Attributed", asOf.AddMinutes(-13),
                    "Publisher attribution does not establish completeness or trading relevance.", false),
                new("social-1", "Social attention", "Attention increased 240% in the current aggregate window",
                    "Synthetic aggregate · no posts or user identifiers retained", "Low trust", asOf.AddMinutes(-2),
                    "Manipulation risk elevated. Social attention is not proof of a catalyst or a buy signal.", false),
            ],
            new(
                "Draft only: unusual volume and a primary-source filing warrant review.",
                "Not verified",
                "Reject the thesis if the filing is unrelated, the quote becomes stale, or liquidity deteriorates.",
                "No approved exit plan. A complete risk-bounded plan is required before proposal creation."),
            "Synthetic",
            false,
            false);
    }

    public static string NormalizeSymbol(string symbol)
    {
        if (string.IsNullOrWhiteSpace(symbol))
            throw new ArgumentException("Symbol is required.", nameof(symbol));
        var normalized = symbol.Trim().ToUpperInvariant();
        if (normalized.Length > 10 || normalized.Any(character =>
                !char.IsAsciiLetterOrDigit(character) && character is not '.' and not '-'))
            throw new ArgumentException("Symbol format is invalid.", nameof(symbol));
        return normalized;
    }
}
