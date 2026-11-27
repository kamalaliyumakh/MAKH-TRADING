using System.Security.Cryptography;
using System.Text;

namespace MAKH.Application.Risk;

public enum ContainmentAction { BlockEntries, CancelOpenOrders, LiquidatePositions }
public enum RiskPauseScope { Account, Symbol }
public enum RiskBreachSeverity { Critical, High }

public sealed record RiskLimitUsage(string Code, string Label, decimal Used, decimal Limit, string Unit)
{
    public decimal Remaining => Math.Max(0m, Limit - Used);
    public bool Exceeded => Used > Limit;
}

public sealed record ActiveRiskPause(string PauseId, RiskPauseScope Scope, string ScopeReference,
    DateTimeOffset EffectiveFrom, string Reason, string EvidenceSha256);

public sealed record OpenRiskBreach(string BreachId, RiskBreachSeverity Severity, string Rule,
    string State, DateTimeOffset DetectedAt, string EvidenceSha256);

public sealed record RiskConsoleOverview(
    Guid AccountId,
    string PolicyVersion,
    DateTimeOffset AsOf,
    bool EntryLocked,
    bool ReconciliationHealthy,
    IReadOnlyList<RiskLimitUsage> Limits,
    IReadOnlyList<ActiveRiskPause> ActivePauses,
    IReadOnlyList<OpenRiskBreach> OpenBreaches,
    string EvidenceSha256)
{
    public bool CanMutateRisk => Denied(AccountId);
    public bool CreatesTradingAuthority => Denied(AccountId);

    private static bool Denied(Guid _) => false;
}

public sealed record RiskControlSnapshot(
    Guid AccountId,
    string PolicyVersion,
    bool EntryLocked,
    bool ReconciliationHealthy,
    DateTimeOffset AsOf,
    string StateSha256)
{
    public bool CreatesTradingAuthority => Denied(AccountId);

    private static bool Denied(Guid _) => false;
}

public sealed record ContainmentPreviewRequest
{
    public ContainmentPreviewRequest(Guid commandId, Guid accountId, ContainmentAction action,
        string expectedPolicyVersion, string reason, string correlationId)
    {
        if (commandId == Guid.Empty) throw new ArgumentException("Command ID is required.", nameof(commandId));
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        if (!Enum.IsDefined(action)) throw new ArgumentOutOfRangeException(nameof(action));
        CommandId = commandId;
        AccountId = accountId;
        Action = action;
        ExpectedPolicyVersion = Required(expectedPolicyVersion, nameof(expectedPolicyVersion), 80);
        Reason = Required(reason, nameof(reason), 500);
        CorrelationId = Required(correlationId, nameof(correlationId), 128);
    }

    public Guid CommandId { get; }
    public Guid AccountId { get; }
    public ContainmentAction Action { get; }
    public string ExpectedPolicyVersion { get; }
    public string Reason { get; }
    public string CorrelationId { get; }

    private static string Required(string value, string name, int maximum)
    {
        var normalized = string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("Value is required.", name)
            : value.Trim();
        if (normalized.Length > maximum || normalized.Contains("token", StringComparison.OrdinalIgnoreCase)
            || normalized.Contains("secret", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Value is excessive or contains prohibited material.", name);
        return normalized;
    }
}

public sealed record ContainmentImpact(
    int OpenOrdersAffected,
    int PositionsAffected,
    decimal EstimatedGrossNotional,
    string Currency,
    DateTimeOffset DataAsOf,
    string Source,
    IReadOnlyList<string> Warnings,
    string EvidenceSha256)
{
    public bool IsAuthoritative => Denied(OpenOrdersAffected);
    public bool CanExecute => Denied(PositionsAffected);

    private static bool Denied(int _) => false;
}

public sealed record ContainmentPreview(
    Guid CommandId,
    Guid AccountId,
    ContainmentAction Action,
    string PolicyVersion,
    bool EntryLocked,
    bool ReconciliationRequired,
    bool FinalConfirmationEnabled,
    string Reason,
    string CorrelationId,
    DateTimeOffset CreatedAt,
    ContainmentImpact Impact,
    string EvidenceSha256)
{
    public bool CreatesTradingAuthority => Denied(CommandId);
    public bool MutatesTradingState => Denied(AccountId);

    private static bool Denied(Guid _) => false;
}

public sealed class RiskControlPreviewService
{
    public const string CurrentPolicyVersion = "synthetic-policy-v1";
    private readonly Dictionary<Guid, ContainmentPreview> previews = [];
    private readonly object gate = new();

    public RiskControlSnapshot Snapshot(Guid accountId, string policyVersion, DateTimeOffset asOf)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        if (string.IsNullOrWhiteSpace(policyVersion)) throw new ArgumentException("Policy version is required.", nameof(policyVersion));
        var normalized = policyVersion.Trim();
        lock (gate)
            return new(accountId, normalized, true, false, asOf, Hash($"{accountId}|{normalized}|locked|unreconciled|{asOf:O}"));
    }

    public RiskConsoleOverview Overview(Guid accountId, DateTimeOffset asOf)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        const string policy = CurrentPolicyVersion;
        RiskLimitUsage[] limits =
        [
            new("daily-loss", "Daily loss", 350m, 1_000m, "USD"),
            new("gross-exposure", "Gross exposure", 18_200m, 25_000m, "USD"),
            new("symbol-exposure", "Symbol exposure", 4_200m, 5_000m, "USD"),
            new("order-quantity", "Order quantity", 100m, 500_000m, "shares"),
        ];
        ActiveRiskPause[] pauses =
        [
            new("PAUSE-ACCOUNT", RiskPauseScope.Account, accountId.ToString("D"), asOf.AddMinutes(-10),
                "Synthetic reconciliation lock", Hash($"pause|account|{accountId}|{asOf.AddMinutes(-10):O}")),
            new("PAUSE-SYMBOL", RiskPauseScope.Symbol, "SYNB", asOf.AddMinutes(-8),
                "Synthetic symbol review", Hash($"pause|symbol|SYNB|{asOf.AddMinutes(-8):O}")),
        ];
        OpenRiskBreach[] breaches =
        [
            new("BR-SYN-204", RiskBreachSeverity.Critical, "Reconciliation state", "Open - entry locked",
                asOf.AddMinutes(-6), Hash($"breach|reconciliation|{accountId}|{asOf.AddMinutes(-6):O}")),
            new("BR-SYN-201", RiskBreachSeverity.High, "Protection coverage", "Investigating",
                asOf.AddMinutes(-2), Hash($"breach|protection|{accountId}|{asOf.AddMinutes(-2):O}")),
        ];
        var evidence = Hash(string.Join('|', accountId, policy, asOf.ToUniversalTime().ToString("O"),
            string.Join(',', limits.Select(limit => $"{limit.Code}:{limit.Used}:{limit.Limit}")),
            string.Join(',', pauses.Select(pause => pause.EvidenceSha256)),
            string.Join(',', breaches.Select(breach => breach.EvidenceSha256))));
        lock (gate)
            return new(accountId, policy, asOf, true, false, limits, pauses, breaches, evidence);
    }

    public ContainmentPreview Preview(ContainmentPreviewRequest request, DateTimeOffset now)
    {
        ArgumentNullException.ThrowIfNull(request);
        lock (gate)
        {
            if (!string.Equals(request.ExpectedPolicyVersion, CurrentPolicyVersion, StringComparison.Ordinal))
                throw new InvalidOperationException("Risk policy version is stale.");

            if (previews.TryGetValue(request.CommandId, out var existing))
            {
                if (existing.AccountId != request.AccountId || existing.Action != request.Action
                    || existing.PolicyVersion != request.ExpectedPolicyVersion || existing.Reason != request.Reason
                    || existing.CorrelationId != request.CorrelationId)
                    throw new InvalidOperationException("Containment command ID was reused for a different intent.");
                return existing;
            }

            var requiresReconciliation = request.Action is ContainmentAction.CancelOpenOrders or ContainmentAction.LiquidatePositions;
            var impact = Impact(request, now);
            var evidence = Hash($"{request.CommandId}|{request.AccountId}|{request.Action}|{request.ExpectedPolicyVersion}|{request.Reason}|{request.CorrelationId}|{now:O}|{impact.EvidenceSha256}");
            var preview = new ContainmentPreview(request.CommandId, request.AccountId, request.Action,
                request.ExpectedPolicyVersion, true, requiresReconciliation, false, request.Reason,
                request.CorrelationId, now, impact, evidence);
            previews.Add(request.CommandId, preview);
            return preview;
        }
    }

    private static ContainmentImpact Impact(ContainmentPreviewRequest request, DateTimeOffset now)
    {
        var (orders, positions, notional, warnings) = request.Action switch
        {
            ContainmentAction.BlockEntries => (0, 0, 0m, new[]
                { "Existing synthetic orders and positions are unchanged.", "Entry lock is already fail-closed." }),
            ContainmentAction.CancelOpenOrders => (3, 0, 0m, new[]
                { "Cancel acknowledgements may be partial or delayed.", "Positions remain unchanged and require reconciliation." }),
            ContainmentAction.LiquidatePositions => (3, 2, 8_400m, new[]
                { "Displayed notional excludes slippage, fees and market movement.", "Liquidation may partially fill and requires reconciliation." }),
            _ => throw new ArgumentOutOfRangeException(nameof(request), "Unsupported containment action."),
        };
        var evidence = Hash($"impact|{request.AccountId}|{request.Action}|{orders}|{positions}|{notional}|USD|{now:O}|synthetic");
        return new(orders, positions, notional, "USD", now, "synthetic-read-model", warnings, evidence);
    }

    private static string Hash(string value) =>
        Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
