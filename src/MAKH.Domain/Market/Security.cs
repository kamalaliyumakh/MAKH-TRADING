namespace MAKH.Domain.Market;

public enum InstrumentType
{
    CommonStock,
    PreferredStock,
    ExchangeTradedFund,
    DepositaryReceipt,
    Other,
}

public sealed class Security
{
    private readonly List<SymbolPeriod> symbolHistory = [];
    private readonly List<CorporateAction> corporateActions = [];

    public Security(Guid id, string issuerName, InstrumentType instrumentType, Venue primaryVenue, bool isActive = true)
    {
        if (id == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(id));
        Id = id;
        IssuerName = string.IsNullOrWhiteSpace(issuerName) ? throw new ArgumentException("Issuer name is required.", nameof(issuerName)) : issuerName.Trim();
        InstrumentType = instrumentType;
        PrimaryVenue = primaryVenue ?? throw new ArgumentNullException(nameof(primaryVenue));
        IsActive = isActive;
    }

    public Guid Id { get; }
    public string IssuerName { get; }
    public InstrumentType InstrumentType { get; }
    public Venue PrimaryVenue { get; }
    public bool IsActive { get; private set; }
    public IReadOnlyList<SymbolPeriod> SymbolHistory => symbolHistory;
    public IReadOnlyList<CorporateAction> CorporateActions => corporateActions;
    public bool IsEligibleForMvp => IsActive && InstrumentType == InstrumentType.CommonStock && PrimaryVenue.IsApprovedForMvp;

    public bool IsEligibleForMvpAt(DateOnly date) => IsEligibleForMvp
        && !corporateActions.Any(action => action.Type == CorporateActionType.Delisting && action.EffectiveDate <= date);

    public void AddSymbol(SymbolPeriod period)
    {
        ArgumentNullException.ThrowIfNull(period);
        if (!string.Equals(period.VenueMic, PrimaryVenue.Mic, StringComparison.Ordinal))
            throw new InvalidOperationException("Symbol venue must match the security primary venue.");
        if (symbolHistory.Any(existing => existing.Overlaps(period)))
            throw new InvalidOperationException("Symbol effective periods cannot overlap for a security.");
        symbolHistory.Add(period);
        symbolHistory.Sort((left, right) => left.EffectiveFrom.CompareTo(right.EffectiveFrom));
    }

    public string SymbolAt(DateOnly date) => symbolHistory.SingleOrDefault(period => period.Contains(date))?.Symbol
        ?? throw new InvalidOperationException("No unambiguous symbol exists for the requested date.");

    public void AddCorporateAction(CorporateAction action)
    {
        ArgumentNullException.ThrowIfNull(action);
        if (action.SecurityId != Id) throw new InvalidOperationException("Corporate action security does not match.");
        if (corporateActions.Any(existing => existing.SourceId == action.SourceId)) return;
        corporateActions.Add(action);
        corporateActions.Sort((left, right) => left.EffectiveDate.CompareTo(right.EffectiveDate));
    }
}

public sealed record SymbolPeriod
{
    public SymbolPeriod(string symbol, string venueMic, DateOnly effectiveFrom, DateOnly? effectiveTo = null)
    {
        Symbol = string.IsNullOrWhiteSpace(symbol) ? throw new ArgumentException("Symbol is required.", nameof(symbol)) : symbol.Trim().ToUpperInvariant();
        VenueMic = string.IsNullOrWhiteSpace(venueMic) ? throw new ArgumentException("Venue MIC is required.", nameof(venueMic)) : venueMic.Trim().ToUpperInvariant();
        if (effectiveTo < effectiveFrom) throw new ArgumentException("Effective-to date cannot precede effective-from date.", nameof(effectiveTo));
        EffectiveFrom = effectiveFrom;
        EffectiveTo = effectiveTo;
    }

    public string Symbol { get; }
    public string VenueMic { get; }
    public DateOnly EffectiveFrom { get; }
    public DateOnly? EffectiveTo { get; }
    public bool Contains(DateOnly date) => date >= EffectiveFrom && (EffectiveTo is null || date <= EffectiveTo);
    public bool Overlaps(SymbolPeriod other) => EffectiveFrom <= (other.EffectiveTo ?? DateOnly.MaxValue)
        && other.EffectiveFrom <= (EffectiveTo ?? DateOnly.MaxValue);
}
