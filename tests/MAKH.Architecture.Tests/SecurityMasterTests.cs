using MAKH.Application.Market;
using MAKH.Domain.Market;
using Xunit;
using MarketSecurity = MAKH.Domain.Market.Security;

namespace MAKH.Architecture.Tests;

public sealed class SecurityMasterTests
{
    private static readonly Venue Nasdaq = new("XNAS", "Nasdaq", "America/New_York", true);
    private static readonly Venue Nyse = new("XNYS", "NYSE", "America/New_York", true);
    private static readonly Venue Otc = new("OTCM", "OTC Markets", "America/New_York", false);
    private static readonly DateTimeOffset ObservedAt = new(2025, 8, 1, 14, 30, 0, TimeSpan.Zero);

    [Fact]
    public void StableIdentitySurvivesSymbolChange()
    {
        var security = NewSecurity();
        security.AddSymbol(new("OLD", "XNAS", new(2025, 1, 1), new(2025, 6, 30)));
        security.AddSymbol(new("NEW", "XNAS", new(2025, 7, 1)));

        Assert.Equal("OLD", security.SymbolAt(new(2025, 6, 30)));
        Assert.Equal("NEW", security.SymbolAt(new(2025, 7, 1)));
    }

    [Fact]
    public void OverlappingSymbolPeriodsAreRejected()
    {
        var security = NewSecurity();
        security.AddSymbol(new("SYN", "XNAS", new(2025, 1, 1), new(2025, 12, 31)));

        Assert.Throws<InvalidOperationException>(() => security.AddSymbol(new("SYN2", "XNAS", new(2025, 6, 1))));
    }

    [Fact]
    public void OtcAndNonCommonInstrumentsAreIneligible()
    {
        Assert.False(new MarketSecurity(Guid.NewGuid(), "Synthetic OTC", InstrumentType.CommonStock, Otc).IsEligibleForMvp);
        Assert.False(new MarketSecurity(Guid.NewGuid(), "Synthetic ETF", InstrumentType.ExchangeTradedFund, Nasdaq).IsEligibleForMvp);
        Assert.True(new MarketSecurity(Guid.NewGuid(), "Synthetic Common", InstrumentType.CommonStock, Nyse).IsEligibleForMvp);
    }

    [Fact]
    public void DuplicateCorporateActionSourceIsIdempotent()
    {
        var security = NewSecurity();
        var action = new CorporateAction(security.Id, "synthetic:split:1", CorporateActionType.ReverseSplit, new(2025, 8, 1), 1, 10);

        security.AddCorporateAction(action);
        security.AddCorporateAction(action);

        Assert.Single(security.CorporateActions);
    }

    [Fact]
    public void ReconcilerMatchesEffectiveSymbolAndVenue()
    {
        var security = NewSecurity();
        security.AddSymbol(new("SYN", "XNAS", new(2025, 1, 1)));

        var result = SecurityMasterReconciler.Reconcile(Record("provider-1", "SYN"), [security]);

        Assert.Equal(ReconciliationState.Matched, result.State);
        Assert.Equal(security.Id, result.SecurityId);
    }

    [Fact]
    public void ReconcilerFailsClosedOnAmbiguousMapping()
    {
        var first = NewSecurity();
        var second = NewSecurity();
        first.AddSymbol(new("DUP", "XNAS", new(2025, 1, 1)));
        second.AddSymbol(new("DUP", "XNAS", new(2025, 1, 1)));

        var result = SecurityMasterReconciler.Reconcile(Record("provider-2", "DUP"), [first, second]);

        Assert.Equal(ReconciliationState.Ambiguous, result.State);
        Assert.Null(result.SecurityId);
    }

    [Fact]
    public void ReconcilerDetectsInstrumentTypeMismatch()
    {
        var security = NewSecurity();
        security.AddSymbol(new("SYN", "XNAS", new(2025, 1, 1)));

        var result = SecurityMasterReconciler.Reconcile(Record("provider-3", "SYN", InstrumentType.PreferredStock), [security]);

        Assert.Equal(ReconciliationState.Mismatch, result.State);
    }

    [Fact]
    public void SplitActionsRequireRatiosAndOtherActionsRejectThem()
    {
        var securityId = Guid.NewGuid();

        Assert.Throws<ArgumentException>(() => new CorporateAction(securityId, "split", CorporateActionType.StockSplit, new(2025, 8, 1)));
        Assert.Throws<ArgumentException>(() => new CorporateAction(securityId, "delist", CorporateActionType.Delisting, new(2025, 8, 1), 1, 1));
        Assert.Equal(10, new CorporateAction(securityId, "reverse", CorporateActionType.ReverseSplit, new(2025, 8, 1), 1, 10).Denominator);
    }

    [Fact]
    public void DelistingMakesSecurityIneligibleFromEffectiveDate()
    {
        var security = NewSecurity();
        security.AddSymbol(new("SYN", "XNAS", new(2025, 1, 1)));
        security.AddCorporateAction(new(security.Id, "delist-1", CorporateActionType.Delisting, new(2025, 8, 1)));

        Assert.Equal(ReconciliationState.Matched, SecurityMasterReconciler.Reconcile(Record("before", "SYN", asOf: new(2025, 7, 31)), [security]).State);
        Assert.Equal(ReconciliationState.Ineligible, SecurityMasterReconciler.Reconcile(Record("after", "SYN"), [security]).State);
    }

    [Fact]
    public void ProviderEvidenceRequiresProvenanceAndSafeCorrectionLineage()
    {
        Assert.Throws<ArgumentException>(() => new ProviderSecurityRecord("provider", "same", "SYN", "XNAS", InstrumentType.CommonStock, new(2025, 8, 1), ObservedAt, "same"));
        Assert.Throws<ArgumentException>(() => new ProviderSecurityRecord("provider", "record", "SYN", "OTC", InstrumentType.CommonStock, new(2025, 8, 1), ObservedAt));

        var corrected = new ProviderSecurityRecord(" provider ", "record-2", "syn", "xnas", InstrumentType.CommonStock, new(2025, 8, 1), ObservedAt, "record-1");
        Assert.Equal("SYN", corrected.Symbol);
        Assert.Equal("XNAS", corrected.VenueMic);
        Assert.Equal("record-1", corrected.CorrectsSourceRecordId);
        Assert.Equal(TimeSpan.Zero, corrected.ObservedAt.Offset);
    }

    private static MarketSecurity NewSecurity() => new(Guid.NewGuid(), "Synthetic Issuer", InstrumentType.CommonStock, Nasdaq);

    private static ProviderSecurityRecord Record(string sourceRecordId, string symbol, InstrumentType instrumentType = InstrumentType.CommonStock, DateOnly? asOf = null) =>
        new("synthetic-provider", sourceRecordId, symbol, "XNAS", instrumentType, asOf ?? new DateOnly(2025, 8, 1), ObservedAt);
}
