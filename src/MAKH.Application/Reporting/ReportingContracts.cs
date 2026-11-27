namespace MAKH.Application.Reporting;

public enum ReportQuality { Complete, Partial, Failed }
public enum AdherenceOutcome { Passed, Breached, Unknown }

public sealed record ReportExecution
{
    public ReportExecution(string executionId, Guid accountId, Guid securityId, string strategy,
        long quantity, decimal grossAmount, decimal fees, decimal realizedPnl, DateTimeOffset executedAt)
    {
        ExecutionId = Required(executionId, nameof(executionId));
        if (accountId == Guid.Empty || securityId == Guid.Empty) throw new ArgumentException("Account and security IDs are required.");
        Strategy = Required(strategy, nameof(strategy));
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(quantity);
        ArgumentOutOfRangeException.ThrowIfNegative(grossAmount);
        ArgumentOutOfRangeException.ThrowIfNegative(fees);
        AccountId = accountId;
        SecurityId = securityId;
        Quantity = quantity;
        GrossAmount = grossAmount;
        Fees = fees;
        RealizedPnl = realizedPnl;
        ExecutedAt = executedAt;
    }

    public string ExecutionId { get; }
    public Guid AccountId { get; }
    public Guid SecurityId { get; }
    public string Strategy { get; }
    public long Quantity { get; }
    public decimal GrossAmount { get; }
    public decimal Fees { get; }
    public decimal RealizedPnl { get; }
    public DateTimeOffset ExecutedAt { get; }

    private static string Required(string value, string name) => string.IsNullOrWhiteSpace(value)
        ? throw new ArgumentException("Value is required.", name) : value.Trim();
}

public sealed record ReportAdherenceFact
{
    public ReportAdherenceFact(string decisionId, Guid accountId, string ruleCode,
        AdherenceOutcome outcome, DateTimeOffset evaluatedAt, string reason)
    {
        DecisionId = Required(decisionId, nameof(decisionId));
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.");
        RuleCode = Required(ruleCode, nameof(ruleCode));
        Reason = Required(reason, nameof(reason));
        if (!Enum.IsDefined(outcome)) throw new ArgumentOutOfRangeException(nameof(outcome));
        AccountId = accountId;
        Outcome = outcome;
        EvaluatedAt = evaluatedAt;
    }

    public string DecisionId { get; }
    public Guid AccountId { get; }
    public string RuleCode { get; }
    public AdherenceOutcome Outcome { get; }
    public DateTimeOffset EvaluatedAt { get; }
    public string Reason { get; }

    private static string Required(string value, string name) => string.IsNullOrWhiteSpace(value)
        ? throw new ArgumentException("Value is required.", name) : value.Trim();
}

public sealed record ReportDataQualityFact
{
    public ReportDataQualityFact(string source, ReportQuality quality, DateTimeOffset asOf, int acceptedRecords, int rejectedRecords)
    {
        Source = string.IsNullOrWhiteSpace(source) ? throw new ArgumentException("Source is required.", nameof(source)) : source.Trim();
        if (!Enum.IsDefined(quality)) throw new ArgumentOutOfRangeException(nameof(quality));
        ArgumentOutOfRangeException.ThrowIfNegative(acceptedRecords);
        ArgumentOutOfRangeException.ThrowIfNegative(rejectedRecords);
        Quality = quality;
        AsOf = asOf;
        AcceptedRecords = acceptedRecords;
        RejectedRecords = rejectedRecords;
    }

    public string Source { get; }
    public ReportQuality Quality { get; }
    public DateTimeOffset AsOf { get; }
    public int AcceptedRecords { get; }
    public int RejectedRecords { get; }
}

public sealed record StrategyReportLine(string Strategy, int ExecutionCount, long Quantity, decimal GrossAmount, decimal Fees, decimal RealizedPnl);
public sealed record AdherenceReportLine(string RuleCode, int Evaluations, int Passed, int Breached, int Unknown);
public sealed record DataQualityReportLine(string Source, ReportQuality Quality, DateTimeOffset AsOf, int AcceptedRecords, int RejectedRecords);

public sealed record DailyTradingReport(
    Guid ReportId,
    Guid AccountId,
    DateOnly TradingDate,
    DateTimeOffset GeneratedAt,
    int ExecutionCount,
    long Quantity,
    decimal GrossAmount,
    decimal Fees,
    decimal RealizedPnl,
    int AdherenceEvaluations,
    int Breaches,
    ReportQuality DataQuality,
    IReadOnlyList<ReportExecution> Executions,
    IReadOnlyList<StrategyReportLine> Strategies,
    IReadOnlyList<AdherenceReportLine> Adherence,
    IReadOnlyList<DataQualityReportLine> DataQualitySources,
    string EvidenceHash)
{
    public static bool CreatesOrderAuthority => false;
    public static bool IsBrokerStatement => false;
}
