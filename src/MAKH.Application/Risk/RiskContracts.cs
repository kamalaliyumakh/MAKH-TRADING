namespace MAKH.Application.Risk;

public enum RiskDecisionOutcome
{
    ApprovedForProposal,
    Rejected,
}

public enum RiskRuleCode
{
    PolicyEffective,
    PaperMode,
    SystemHealth,
    AccountState,
    StrategyAllowed,
    MarketDataFresh,
    PriceValid,
    ProtectiveStopValid,
    DailyLossCapacity,
    PerTradeRiskCapacity,
    SymbolExposureCapacity,
    GrossExposureCapacity,
    BuyingPowerCapacity,
    QuantityCapacity,
}

public sealed record RiskPolicy
{
    public RiskPolicy(
        string version,
        DateTimeOffset effectiveFrom,
        DateTimeOffset? effectiveTo,
        decimal maximumRiskPerTrade,
        decimal maximumDailyLoss,
        decimal maximumGrossExposure,
        decimal maximumSymbolExposure,
        decimal maximumPositionNotional,
        long maximumOrderQuantity)
    {
        Version = string.IsNullOrWhiteSpace(version)
            ? throw new ArgumentException("Policy version is required.", nameof(version))
            : version.Trim();
        if (effectiveTo <= effectiveFrom)
            throw new ArgumentException("Policy end must be after its start.", nameof(effectiveTo));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maximumRiskPerTrade);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maximumDailyLoss);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maximumGrossExposure);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maximumSymbolExposure);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maximumPositionNotional);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(maximumOrderQuantity);
        if (maximumSymbolExposure > maximumGrossExposure)
            throw new ArgumentException("Symbol exposure cannot exceed gross exposure.", nameof(maximumSymbolExposure));
        if (maximumPositionNotional > maximumSymbolExposure)
            throw new ArgumentException("Position notional cannot exceed symbol exposure.", nameof(maximumPositionNotional));

        EffectiveFrom = effectiveFrom;
        EffectiveTo = effectiveTo;
        MaximumRiskPerTrade = maximumRiskPerTrade;
        MaximumDailyLoss = maximumDailyLoss;
        MaximumGrossExposure = maximumGrossExposure;
        MaximumSymbolExposure = maximumSymbolExposure;
        MaximumPositionNotional = maximumPositionNotional;
        MaximumOrderQuantity = maximumOrderQuantity;
    }

    public string Version { get; }
    public DateTimeOffset EffectiveFrom { get; }
    public DateTimeOffset? EffectiveTo { get; }
    public decimal MaximumRiskPerTrade { get; }
    public decimal MaximumDailyLoss { get; }
    public decimal MaximumGrossExposure { get; }
    public decimal MaximumSymbolExposure { get; }
    public decimal MaximumPositionNotional { get; }
    public long MaximumOrderQuantity { get; }

    public bool IsEffectiveAt(DateTimeOffset at) => EffectiveFrom <= at && (EffectiveTo is null || at < EffectiveTo);
}

public sealed record RiskEvaluationRequest
{
    public RiskEvaluationRequest(
        Guid decisionId,
        Guid accountId,
        Guid userId,
        Guid securityId,
        DateTimeOffset evaluatedAt,
        string strategy,
        long requestedQuantity,
        decimal entryPrice,
        decimal protectiveStopPrice,
        decimal realizedDailyPnl,
        decimal currentGrossExposure,
        decimal currentSymbolExposure,
        decimal availableBuyingPower,
        bool isPaperMode,
        bool systemHealthy,
        bool accountStateKnown,
        bool strategyAllowed,
        bool marketDataFresh,
        string correlationId)
    {
        if (decisionId == Guid.Empty) throw new ArgumentException("Decision ID is required.", nameof(decisionId));
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.", nameof(accountId));
        if (userId == Guid.Empty) throw new ArgumentException("User ID is required.", nameof(userId));
        if (securityId == Guid.Empty) throw new ArgumentException("Security ID is required.", nameof(securityId));
        DecisionId = decisionId;
        AccountId = accountId;
        UserId = userId;
        SecurityId = securityId;
        EvaluatedAt = evaluatedAt;
        Strategy = string.IsNullOrWhiteSpace(strategy) ? throw new ArgumentException("Strategy is required.", nameof(strategy)) : strategy.Trim();
        RequestedQuantity = requestedQuantity;
        EntryPrice = entryPrice;
        ProtectiveStopPrice = protectiveStopPrice;
        RealizedDailyPnl = realizedDailyPnl;
        CurrentGrossExposure = currentGrossExposure;
        CurrentSymbolExposure = currentSymbolExposure;
        AvailableBuyingPower = availableBuyingPower;
        IsPaperMode = isPaperMode;
        SystemHealthy = systemHealthy;
        AccountStateKnown = accountStateKnown;
        StrategyAllowed = strategyAllowed;
        MarketDataFresh = marketDataFresh;
        CorrelationId = string.IsNullOrWhiteSpace(correlationId)
            ? throw new ArgumentException("Correlation ID is required.", nameof(correlationId))
            : correlationId.Trim();
    }

    public Guid DecisionId { get; }
    public Guid AccountId { get; }
    public Guid UserId { get; }
    public Guid SecurityId { get; }
    public DateTimeOffset EvaluatedAt { get; }
    public string Strategy { get; }
    public long RequestedQuantity { get; }
    public decimal EntryPrice { get; }
    public decimal ProtectiveStopPrice { get; }
    public decimal RealizedDailyPnl { get; }
    public decimal CurrentGrossExposure { get; }
    public decimal CurrentSymbolExposure { get; }
    public decimal AvailableBuyingPower { get; }
    public bool IsPaperMode { get; }
    public bool SystemHealthy { get; }
    public bool AccountStateKnown { get; }
    public bool StrategyAllowed { get; }
    public bool MarketDataFresh { get; }
    public string CorrelationId { get; }
}

public sealed record RiskRuleResult(RiskRuleCode Code, bool Passed, string Reason, decimal? AvailableCapacity = null);

public sealed record RiskDecision(
    Guid DecisionId,
    Guid AccountId,
    Guid UserId,
    Guid SecurityId,
    string PolicyVersion,
    DateTimeOffset EvaluatedAt,
    RiskDecisionOutcome Outcome,
    long ApprovedQuantity,
    decimal ApprovedNotional,
    decimal MaximumLossAtStop,
    IReadOnlyList<RiskRuleResult> Rules,
    string CorrelationId,
    string EvidenceSha256)
{
    public bool CanCreatePaperOrderProposal => Outcome == RiskDecisionOutcome.ApprovedForProposal;
    public bool CanSubmitBrokerOrder => Denied(Outcome);
    public bool CanAuthorizeLiveTrading => Denied(Outcome);

    private static bool Denied(RiskDecisionOutcome _) => false;
}
