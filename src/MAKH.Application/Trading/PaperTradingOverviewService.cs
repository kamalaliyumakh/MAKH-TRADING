using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace MAKH.Application.Trading;

public sealed record PaperTradingOrder(string Id, string Symbol, string Side, long Quantity, long Filled,
    decimal LimitPrice, string State, DateTimeOffset UpdatedAt);

public sealed record PaperTradingPosition(string Symbol, long Quantity, decimal AverageCost, decimal Mark,
    decimal RealizedPnl, decimal UnrealizedPnl, string Protection);

public sealed record PaperTradingOverview(Guid AccountId, DateTimeOffset AsOf, string Reconciliation,
    bool EntryLocked, IReadOnlyList<PaperTradingOrder> Orders, IReadOnlyList<PaperTradingPosition> Positions,
    string EvidenceSha256)
{
    public bool IsAuthoritative => Denied(AccountId);
    public bool CanSubmit => Denied(AccountId);
    public bool CreatesTradingAuthority => Denied(AccountId);

    private static bool Denied(Guid _) => false;
}

public sealed record PaperOrderReviewRequest
{
    public PaperOrderReviewRequest(Guid requestId, Guid accountId, string symbol, string side, long quantity,
        decimal limitPrice, decimal? stopPrice)
    {
        if (requestId == Guid.Empty || accountId == Guid.Empty)
            throw new ArgumentException("Request and account IDs are required.");
        var normalizedSymbol = string.IsNullOrWhiteSpace(symbol) ? string.Empty : symbol.Trim().ToUpperInvariant();
        if (normalizedSymbol.Length is < 1 or > 5 || normalizedSymbol.Any(character => character is < 'A' or > 'Z'))
            throw new ArgumentException("Symbol must contain one to five ASCII letters.", nameof(symbol));
        var normalizedSide = string.IsNullOrWhiteSpace(side) ? string.Empty : side.Trim();
        if (normalizedSide is not ("Buy" or "Sell")) throw new ArgumentException("Side is invalid.", nameof(side));
        if (quantity is < 1 or > 500_000) throw new ArgumentOutOfRangeException(nameof(quantity));
        if (limitPrice is < 3m or > 7m) throw new ArgumentOutOfRangeException(nameof(limitPrice));
        if (stopPrice is <= 0m) throw new ArgumentOutOfRangeException(nameof(stopPrice));
        RequestId = requestId;
        AccountId = accountId;
        Symbol = normalizedSymbol;
        Side = normalizedSide;
        Quantity = quantity;
        LimitPrice = limitPrice;
        StopPrice = stopPrice;
    }

    public Guid RequestId { get; }
    public Guid AccountId { get; }
    public string Symbol { get; }
    public string Side { get; }
    public long Quantity { get; }
    public decimal LimitPrice { get; }
    public decimal? StopPrice { get; }
}

public sealed record PaperOrderReview(Guid RequestId, Guid AccountId, string Symbol, string Side, long Quantity,
    decimal LimitPrice, decimal? StopPrice, decimal EstimatedNotional, string Mode, string Authority,
    bool EntryLocked, DateTimeOffset CreatedAt, DateTimeOffset ExpiresAt, string EvidenceSha256)
{
    public bool CanSubmit => Denied(AccountId);
    public bool CreatesTradingAuthority => Denied(AccountId);
    public bool MutatesTradingState => Denied(AccountId);

    private static bool Denied(Guid _) => false;
}

public sealed class PaperTradingOverviewService
{
    private readonly object gate = new();
    private readonly Dictionary<Guid, PaperOrderReview> reviews = [];

    public PaperTradingOverview Overview(Guid accountId, DateTimeOffset asOf)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        PaperTradingOrder[] orders =
        [
            new("SYN-1042", "SYNB", "Buy", 100, 40, 5.25m, "Partially filled", asOf.AddMinutes(-1)),
            new("SYN-1038", "SYNA", "Sell", 60, 60, 6.10m, "Filled", asOf.AddMinutes(-17)),
        ];
        PaperTradingPosition[] positions =
        [
            new("SYNB", 40, 5.21m, 5.42m, 0m, 8.40m, "Under-protected"),
            new("SYNA", 80, 4.86m, 5.08m, 32.20m, 17.60m, "Protected"),
        ];
        var evidence = Hash(string.Join('|', accountId, asOf.ToUniversalTime().ToString("O"), "Mismatch", "locked",
            string.Join(',', orders.Select(OrderEvidence)), string.Join(',', positions.Select(PositionEvidence))));
        lock (gate)
            return new(accountId, asOf, "Mismatch", true, orders, positions, evidence);
    }

    public PaperOrderReview Review(PaperOrderReviewRequest request, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(request);
        lock (gate)
        {
            if (reviews.TryGetValue(request.RequestId, out var existing))
            {
                if (existing.AccountId != request.AccountId || existing.Symbol != request.Symbol
                    || existing.Side != request.Side || existing.Quantity != request.Quantity
                    || existing.LimitPrice != request.LimitPrice || existing.StopPrice != request.StopPrice)
                    throw new InvalidOperationException("Review request ID was reused for different intent.");
                return existing;
            }
            var notional = request.Quantity * request.LimitPrice;
            var expiresAt = now.AddMinutes(2);
            var evidence = Hash(string.Join('|', request.RequestId, request.AccountId, request.Symbol, request.Side,
                request.Quantity, request.LimitPrice.ToString(CultureInfo.InvariantCulture),
                request.StopPrice?.ToString(CultureInfo.InvariantCulture) ?? "none", notional,
                now.ToUniversalTime().ToString("O"), expiresAt.ToUniversalTime().ToString("O")));
            var review = new PaperOrderReview(request.RequestId, request.AccountId, request.Symbol, request.Side,
                request.Quantity, request.LimitPrice, request.StopPrice, notional, "PAPER", "Synthetic review only",
                true, now, expiresAt, evidence);
            reviews.Add(request.RequestId, review);
            return review;
        }
    }

    private static string OrderEvidence(PaperTradingOrder order) => string.Join(':', order.Id, order.Symbol,
        order.Side, order.Quantity, order.Filled, order.LimitPrice.ToString(CultureInfo.InvariantCulture), order.State,
        order.UpdatedAt.ToUniversalTime().ToString("O"));

    private static string PositionEvidence(PaperTradingPosition position) => string.Join(':', position.Symbol,
        position.Quantity, position.AverageCost.ToString(CultureInfo.InvariantCulture),
        position.Mark.ToString(CultureInfo.InvariantCulture), position.RealizedPnl.ToString(CultureInfo.InvariantCulture),
        position.UnrealizedPnl.ToString(CultureInfo.InvariantCulture), position.Protection);

    private static string Hash(string value) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
