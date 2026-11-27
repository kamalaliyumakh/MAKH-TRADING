using MAKH.Domain.Market;
using MarketSecurity = MAKH.Domain.Market.Security;

namespace MAKH.Application.Market;

public sealed record ProviderSecurityRecord
{
    public ProviderSecurityRecord(
        string providerId,
        string sourceRecordId,
        string symbol,
        string venueMic,
        InstrumentType instrumentType,
        DateOnly asOf,
        DateTimeOffset observedAt,
        string? correctsSourceRecordId = null)
    {
        ProviderId = Require(providerId, nameof(providerId));
        SourceRecordId = Require(sourceRecordId, nameof(sourceRecordId));
        Symbol = Require(symbol, nameof(symbol)).ToUpperInvariant();
        VenueMic = Require(venueMic, nameof(venueMic)).ToUpperInvariant();
        if (VenueMic.Length != 4 || !VenueMic.All(char.IsAsciiLetterOrDigit))
            throw new ArgumentException("Venue MIC must be a four-character alphanumeric code.", nameof(venueMic));
        if (!Enum.IsDefined(instrumentType)) throw new ArgumentOutOfRangeException(nameof(instrumentType));
        if (observedAt == default) throw new ArgumentException("Observed time is required.", nameof(observedAt));
        InstrumentType = instrumentType;
        AsOf = asOf;
        ObservedAt = observedAt.ToUniversalTime();
        CorrectsSourceRecordId = string.IsNullOrWhiteSpace(correctsSourceRecordId) ? null : correctsSourceRecordId.Trim();
        if (CorrectsSourceRecordId == SourceRecordId)
            throw new ArgumentException("A provider record cannot correct itself.", nameof(correctsSourceRecordId));
    }

    public string ProviderId { get; }
    public string SourceRecordId { get; }
    public string Symbol { get; }
    public string VenueMic { get; }
    public InstrumentType InstrumentType { get; }
    public DateOnly AsOf { get; }
    public DateTimeOffset ObservedAt { get; }
    public string? CorrectsSourceRecordId { get; }

    private static string Require(string value, string parameter) =>
        string.IsNullOrWhiteSpace(value) ? throw new ArgumentException($"{parameter} is required.", parameter) : value.Trim();
}

public interface ISecurityMasterSource
{
    IAsyncEnumerable<ProviderSecurityRecord> ReadAsync(DateOnly asOf, CancellationToken cancellationToken);
}

public enum ReconciliationState
{
    Matched,
    Missing,
    Ambiguous,
    Ineligible,
    Mismatch,
}

public sealed record SecurityReconciliationResult(ReconciliationState State, Guid? SecurityId, string Reason);

public sealed class SecurityMasterReconciler
{
    public static SecurityReconciliationResult Reconcile(ProviderSecurityRecord record, IEnumerable<MarketSecurity> securities)
    {
        ArgumentNullException.ThrowIfNull(record);
        ArgumentNullException.ThrowIfNull(securities);

        var candidates = securities.Where(security =>
        {
            try
            {
                return string.Equals(security.PrimaryVenue.Mic, record.VenueMic, StringComparison.OrdinalIgnoreCase)
                    && string.Equals(security.SymbolAt(record.AsOf), record.Symbol, StringComparison.OrdinalIgnoreCase);
            }
            catch (InvalidOperationException)
            {
                return false;
            }
        }).ToArray();

        if (candidates.Length == 0) return new(ReconciliationState.Missing, null, "No effective canonical security mapping exists.");
        if (candidates.Length > 1) return new(ReconciliationState.Ambiguous, null, "Multiple canonical securities match; scanner ingestion must stop.");

        var security = candidates[0];
        if (security.InstrumentType != record.InstrumentType)
            return new(ReconciliationState.Mismatch, security.Id, "Provider and canonical instrument types differ.");
        if (!security.IsEligibleForMvpAt(record.AsOf))
            return new(ReconciliationState.Ineligible, security.Id, "Security is outside the approved MVP universe.");
        return new(ReconciliationState.Matched, security.Id, "Canonical security matched by effective symbol and venue.");
    }
}
