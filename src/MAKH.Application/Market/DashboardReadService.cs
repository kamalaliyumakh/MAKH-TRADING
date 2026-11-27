namespace MAKH.Application.Market;

public sealed record DashboardPnl(
    decimal Realized, decimal Unrealized, decimal Total, DateTimeOffset AsOf, string Authority);
public sealed record DashboardRisk(
    string PolicyVersion, decimal DailyLossLimit, decimal ConsumedLossCapacity,
    decimal RemainingLossCapacity, decimal OpenRisk, decimal? BuyingPower);
public sealed record DashboardDependency(
    string Name, string State, int? AgeSeconds, string Effect);
public sealed record DashboardActivity(
    int OpenPositions, int WorkingOrders, string ReconciliationState);
public sealed record DashboardAlert(
    string Id, string Severity, string Title, string Guidance);
public sealed record DashboardCandidate(
    string Symbol, decimal GainPercent, decimal RelativeVolume, string RiskLabel);
public sealed record DashboardSnapshot(
    Guid AccountId,
    string SnapshotId,
    DateTimeOffset AsOf,
    string Mode,
    string AccountLabel,
    string EntryState,
    string EntryReason,
    DashboardPnl Pnl,
    DashboardRisk Risk,
    IReadOnlyList<DashboardDependency> Dependencies,
    DashboardActivity Activity,
    IReadOnlyList<DashboardAlert> Alerts,
    IReadOnlyList<DashboardCandidate> Candidates,
    string DataMode,
    bool ReconciledBrokerTruth,
    bool CreatesTradingAuthority,
    bool CanSubmitOrder);

public sealed class DashboardReadService
{
    private readonly string dataMode = "Synthetic";

    public DashboardSnapshot Snapshot(Guid accountId, DateTimeOffset asOf)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account is required.", nameof(accountId));
        return new(
            accountId,
            $"synthetic-dashboard-{asOf:yyyyMMddHHmmss}",
            asOf,
            "PAPER",
            "Synthetic account · no broker connection",
            "Locked",
            "Risk, broker and reconciliation authorities are not connected.",
            new(42m, -18m, 24m, asOf, "Synthetic estimate"),
            new("synthetic-risk-policy-v1", 200m, 50m, 150m, 0m, null),
            [
                new("Market data", "Available", 35, "Synthetic quote snapshot current."),
                new("Evidence", "Available", 62, "Synthetic evidence snapshot current."),
                new("Risk service", "Unavailable", null, "New entries remain blocked."),
                new("Broker", "Unavailable", null, "Orders and account truth unavailable."),
                new("Reconciliation", "Unavailable", null, "No authoritative position or order state."),
            ],
            new(0, 0, "Not connected"),
            [
                new("entry-lock", "Critical", "New entries are locked", "Do not create or submit an order."),
                new("broker-offline", "Warning", "Broker state unavailable", "Balances, positions and orders are not authoritative."),
                new("synthetic-only", "Information", "Synthetic dashboard fixture", "Values demonstrate layout and controls only."),
            ],
            [
                new("SYNB", 159m, 4.2m, "Extreme move · elevated risk"),
                new("SYNA", 68m, 3.4m, "Review evidence and liquidity"),
            ],
            dataMode,
            false,
            false,
            false);
    }
}
