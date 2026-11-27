using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace MAKH.Application.Risk;

public sealed class RiskEngine(RiskPolicyCatalog policies)
{
    public RiskDecision Evaluate(RiskEvaluationRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);
        RiskPolicy policy;
        try
        {
            policy = policies.Resolve(request.EvaluatedAt);
        }
        catch (InvalidOperationException)
        {
            return RejectedWithoutPolicy(request);
        }

        var rules = new List<RiskRuleResult>
        {
            Pass(RiskRuleCode.PolicyEffective, $"Policy {policy.Version} is effective."),
            Result(RiskRuleCode.PaperMode, request.IsPaperMode, "Evaluation is restricted to PAPER mode."),
            Result(RiskRuleCode.SystemHealth, request.SystemHealthy, "Critical platform dependencies must be healthy."),
            Result(RiskRuleCode.AccountState, request.AccountStateKnown, "Account and reconciliation state must be known."),
            Result(RiskRuleCode.StrategyAllowed, request.StrategyAllowed, "Strategy must be permitted by the active policy."),
            Result(RiskRuleCode.MarketDataFresh, request.MarketDataFresh, "Market data must be fresh."),
            Result(RiskRuleCode.PriceValid, request.EntryPrice > 0m, "Entry price must be positive."),
            Result(RiskRuleCode.ProtectiveStopValid, request.ProtectiveStopPrice > 0m && request.ProtectiveStopPrice < request.EntryPrice, "A positive protective stop below entry is required."),
        };

        var stateValuesValid = request.RequestedQuantity > 0
            && request.CurrentGrossExposure >= 0m
            && request.CurrentSymbolExposure >= 0m
            && request.CurrentSymbolExposure <= request.CurrentGrossExposure
            && request.AvailableBuyingPower >= 0m;
        var dailyLossCapacity = Math.Max(0m, policy.MaximumDailyLoss + Math.Min(0m, request.RealizedDailyPnl));
        rules.Add(Result(RiskRuleCode.DailyLossCapacity, stateValuesValid && dailyLossCapacity > 0m, "Daily loss capacity must remain positive.", dailyLossCapacity));

        var perShareRisk = request.EntryPrice - request.ProtectiveStopPrice;
        var quantityCaps = new List<long>();
        AddCapacity(rules, quantityCaps, RiskRuleCode.PerTradeRiskCapacity, policy.MaximumRiskPerTrade, perShareRisk, "Per-trade risk capacity must support at least one share.");
        AddCapacity(rules, quantityCaps, RiskRuleCode.SymbolExposureCapacity, Math.Min(policy.MaximumSymbolExposure - request.CurrentSymbolExposure, policy.MaximumPositionNotional), request.EntryPrice, "Symbol exposure capacity must support at least one share.");
        AddCapacity(rules, quantityCaps, RiskRuleCode.GrossExposureCapacity, policy.MaximumGrossExposure - request.CurrentGrossExposure, request.EntryPrice, "Gross exposure capacity must support at least one share.");
        AddCapacity(rules, quantityCaps, RiskRuleCode.BuyingPowerCapacity, request.AvailableBuyingPower, request.EntryPrice, "Buying power must support at least one share.");

        var requestedIsValid = request.RequestedQuantity > 0;
        rules.Add(Result(
            RiskRuleCode.QuantityCapacity,
            requestedIsValid,
            "Requested quantity must be positive and is bounded by the active policy order cap.",
            requestedIsValid ? Math.Min(request.RequestedQuantity, policy.MaximumOrderQuantity) : 0));
        var allPassed = rules.All(rule => rule.Passed);
        var approvedQuantity = allPassed
            ? new[] { request.RequestedQuantity, policy.MaximumOrderQuantity }.Concat(quantityCaps).Min()
            : 0;
        if (approvedQuantity <= 0) allPassed = false;
        var approvedNotional = allPassed ? approvedQuantity * request.EntryPrice : 0m;
        var maximumLoss = allPassed ? approvedQuantity * perShareRisk : 0m;
        var outcome = allPassed ? RiskDecisionOutcome.ApprovedForProposal : RiskDecisionOutcome.Rejected;
        var hash = Hash(request, policy.Version, outcome, approvedQuantity, approvedNotional, maximumLoss, rules);

        return new(
            request.DecisionId,
            request.AccountId,
            request.UserId,
            request.SecurityId,
            policy.Version,
            request.EvaluatedAt,
            outcome,
            approvedQuantity,
            approvedNotional,
            maximumLoss,
            rules.AsReadOnly(),
            request.CorrelationId,
            hash);
    }

    private static void AddCapacity(List<RiskRuleResult> rules, List<long> caps, RiskRuleCode code, decimal capacity, decimal divisor, string reason)
    {
        var valid = capacity > 0m && divisor > 0m;
        var rawShares = valid ? decimal.Floor(capacity / divisor) : 0m;
        var shares = rawShares >= long.MaxValue ? long.MaxValue : Decimal.ToInt64(rawShares);
        rules.Add(Result(code, valid && shares > 0, reason, Math.Max(0m, capacity)));
        caps.Add(Math.Max(0, shares));
    }

    private static RiskDecision RejectedWithoutPolicy(RiskEvaluationRequest request)
    {
        var rules = new[] { new RiskRuleResult(RiskRuleCode.PolicyEffective, false, "No unique effective risk policy exists.") };
        return new(
            request.DecisionId, request.AccountId, request.UserId, request.SecurityId, "unresolved", request.EvaluatedAt,
            RiskDecisionOutcome.Rejected, 0, 0m, 0m, rules, request.CorrelationId,
            Hash(request, "unresolved", RiskDecisionOutcome.Rejected, 0, 0m, 0m, rules));
    }

    private static RiskRuleResult Pass(RiskRuleCode code, string reason) => new(code, true, reason);
    private static RiskRuleResult Result(RiskRuleCode code, bool passed, string reason, decimal? capacity = null) =>
        new(code, passed, passed ? reason : $"Rejected: {reason}", capacity);

    private static string Hash(
        RiskEvaluationRequest request,
        string policyVersion,
        RiskDecisionOutcome outcome,
        long quantity,
        decimal approvedNotional,
        decimal maximumLoss,
        IEnumerable<RiskRuleResult> rules)
    {
        var canonical = new StringBuilder();
        Add(canonical, request.DecisionId);
        Add(canonical, request.AccountId);
        Add(canonical, request.UserId);
        Add(canonical, request.SecurityId);
        Add(canonical, request.EvaluatedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        Add(canonical, request.Strategy);
        Add(canonical, request.RequestedQuantity);
        Add(canonical, request.EntryPrice);
        Add(canonical, request.ProtectiveStopPrice);
        Add(canonical, request.RealizedDailyPnl);
        Add(canonical, request.CurrentGrossExposure);
        Add(canonical, request.CurrentSymbolExposure);
        Add(canonical, request.AvailableBuyingPower);
        Add(canonical, request.IsPaperMode);
        Add(canonical, request.SystemHealthy);
        Add(canonical, request.AccountStateKnown);
        Add(canonical, request.StrategyAllowed);
        Add(canonical, request.MarketDataFresh);
        Add(canonical, request.CorrelationId);
        Add(canonical, policyVersion);
        Add(canonical, outcome);
        Add(canonical, quantity);
        Add(canonical, approvedNotional);
        Add(canonical, maximumLoss);

        foreach (var rule in rules)
        {
            Add(canonical, rule.Code);
            Add(canonical, rule.Passed);
            Add(canonical, rule.Reason);
            Add(canonical, rule.AvailableCapacity);
        }

        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical.ToString()))).ToLowerInvariant();
    }

    private static void Add(StringBuilder target, object? value)
    {
        var text = value switch
        {
            null => "<null>",
            decimal decimalValue => decimalValue.ToString(CultureInfo.InvariantCulture),
            IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture),
            _ => value.ToString() ?? string.Empty,
        };
        target.Append(text.Length.ToString(CultureInfo.InvariantCulture)).Append(':').Append(text);
    }
}
