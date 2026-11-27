using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace MAKH.Application.Reporting;

public static class ReportingService
{
    private const int MaximumInputFactsPerCategory = 100_000;

    public static DailyTradingReport BuildDaily(
        Guid reportId, Guid accountId, DateOnly tradingDate, TimeZoneInfo tradingTimeZone,
        DateTimeOffset generatedAt, IEnumerable<ReportExecution> executions,
        IEnumerable<ReportAdherenceFact> adherence, IEnumerable<ReportDataQualityFact> dataQuality)
    {
        if (reportId == Guid.Empty || accountId == Guid.Empty) throw new ArgumentException("Report and account IDs are required.");
        ArgumentNullException.ThrowIfNull(tradingTimeZone);
        ArgumentNullException.ThrowIfNull(executions);
        ArgumentNullException.ThrowIfNull(adherence);
        ArgumentNullException.ThrowIfNull(dataQuality);
        if (generatedAt == default || generatedAt.Offset != TimeSpan.Zero)
            throw new ArgumentException("Report generation time must be a non-default UTC value.", nameof(generatedAt));
        if (LocalDate(generatedAt, tradingTimeZone) < tradingDate)
            throw new ArgumentException("Report cannot be generated before its trading date.", nameof(generatedAt));

        var boundedExecutions = Bounded(executions, nameof(executions));
        var boundedAdherence = Bounded(adherence, nameof(adherence));
        var boundedQuality = Bounded(dataQuality, nameof(dataQuality));

        var executionFacts = boundedExecutions.Where(item => item.AccountId == accountId && LocalDate(item.ExecutedAt, tradingTimeZone) == tradingDate)
            .OrderBy(item => item.ExecutedAt).ThenBy(item => item.ExecutionId, StringComparer.Ordinal).ToArray();
        if (executionFacts.GroupBy(item => item.ExecutionId, StringComparer.Ordinal).Any(group => group.Count() > 1))
            throw new InvalidOperationException("Execution identities must be unique within a report.");
        var adherenceFacts = boundedAdherence.Where(item => item.AccountId == accountId && LocalDate(item.EvaluatedAt, tradingTimeZone) == tradingDate)
            .OrderBy(item => item.EvaluatedAt).ThenBy(item => item.DecisionId, StringComparer.Ordinal).ToArray();
        if (adherenceFacts.GroupBy(item => item.DecisionId, StringComparer.Ordinal).Any(group => group.Count() > 1))
            throw new InvalidOperationException("Decision identities must be unique within a report.");
        var qualityFacts = boundedQuality.Where(item => LocalDate(item.AsOf, tradingTimeZone) == tradingDate)
            .OrderBy(item => item.Source, StringComparer.Ordinal).ThenBy(item => item.AsOf).ToArray();
        if (qualityFacts.GroupBy(item => item.Source, StringComparer.Ordinal).Any(group => group.Count() > 1))
            throw new InvalidOperationException("Each data source must have one daily quality fact.");
        if (executionFacts.Any(item => item.ExecutedAt > generatedAt)
            || adherenceFacts.Any(item => item.EvaluatedAt > generatedAt)
            || qualityFacts.Any(item => item.AsOf > generatedAt))
            throw new InvalidOperationException("A report cannot contain facts observed after generation time.");

        var strategies = executionFacts.GroupBy(item => item.Strategy, StringComparer.Ordinal)
            .OrderBy(group => group.Key, StringComparer.Ordinal)
            .Select(group => new StrategyReportLine(group.Key, group.Count(), group.Sum(item => item.Quantity),
                group.Sum(item => item.GrossAmount), group.Sum(item => item.Fees), group.Sum(item => item.RealizedPnl))).ToArray();
        var adherenceLines = adherenceFacts.GroupBy(item => item.RuleCode, StringComparer.Ordinal)
            .OrderBy(group => group.Key, StringComparer.Ordinal)
            .Select(group => new AdherenceReportLine(group.Key, group.Count(),
                group.Count(item => item.Outcome == AdherenceOutcome.Passed),
                group.Count(item => item.Outcome == AdherenceOutcome.Breached),
                group.Count(item => item.Outcome == AdherenceOutcome.Unknown))).ToArray();
        var qualityLines = qualityFacts.Select(item => new DataQualityReportLine(item.Source, item.Quality, item.AsOf,
            item.AcceptedRecords, item.RejectedRecords)).ToArray();
        var aggregateQuality = qualityLines.Length == 0 || qualityLines.Any(item => item.Quality == ReportQuality.Failed)
            ? ReportQuality.Failed
            : qualityLines.Any(item => item.Quality == ReportQuality.Partial) ? ReportQuality.Partial : ReportQuality.Complete;

        return new DailyTradingReport(reportId, accountId, tradingDate, generatedAt,
            executionFacts.Length, executionFacts.Sum(item => item.Quantity), executionFacts.Sum(item => item.GrossAmount),
            executionFacts.Sum(item => item.Fees), executionFacts.Sum(item => item.RealizedPnl), adherenceFacts.Length,
            adherenceFacts.Count(item => item.Outcome == AdherenceOutcome.Breached), aggregateQuality,
            executionFacts, strategies, adherenceLines, qualityLines,
            Hash(accountId, tradingDate, tradingTimeZone, executionFacts, adherenceFacts, qualityFacts));
    }

    private static DateOnly LocalDate(DateTimeOffset value, TimeZoneInfo timeZone) =>
        DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(value, timeZone).DateTime);

    private static T[] Bounded<T>(IEnumerable<T> source, string parameterName)
    {
        var values = source.Take(MaximumInputFactsPerCategory + 1).ToArray();
        if (values.Length > MaximumInputFactsPerCategory)
            throw new ArgumentException($"{parameterName} exceeds the {MaximumInputFactsPerCategory:N0}-fact limit.", parameterName);
        return values;
    }

    private static string Hash(Guid accountId, DateOnly date, TimeZoneInfo tradingTimeZone, IEnumerable<ReportExecution> executions,
        IEnumerable<ReportAdherenceFact> adherence, IEnumerable<ReportDataQualityFact> quality)
    {
        var text = new StringBuilder();
        Append(text, "R", accountId.ToString("N", CultureInfo.InvariantCulture), date.ToString("O", CultureInfo.InvariantCulture), tradingTimeZone.Id);
        foreach (var item in executions)
            Append(text, "E", item.ExecutionId, item.AccountId.ToString("N", CultureInfo.InvariantCulture),
                item.SecurityId.ToString("N", CultureInfo.InvariantCulture), item.Strategy,
                item.Quantity.ToString(CultureInfo.InvariantCulture), item.GrossAmount.ToString(CultureInfo.InvariantCulture),
                item.Fees.ToString(CultureInfo.InvariantCulture), item.RealizedPnl.ToString(CultureInfo.InvariantCulture),
                item.ExecutedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture));
        foreach (var item in adherence)
            Append(text, "A", item.DecisionId, item.AccountId.ToString("N", CultureInfo.InvariantCulture), item.RuleCode,
                item.Outcome.ToString(), item.EvaluatedAt.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture), item.Reason);
        foreach (var item in quality)
            Append(text, "Q", item.Source, item.Quality.ToString(), item.AsOf.ToUniversalTime().ToString("O", CultureInfo.InvariantCulture),
                item.AcceptedRecords.ToString(CultureInfo.InvariantCulture), item.RejectedRecords.ToString(CultureInfo.InvariantCulture));
        return Convert.ToHexStringLower(SHA256.HashData(Encoding.UTF8.GetBytes(text.ToString())));
    }

    private static void Append(StringBuilder builder, params string[] fields)
    {
        foreach (var field in fields)
            builder.Append(field.Length.ToString(CultureInfo.InvariantCulture)).Append(':').Append(field);
        builder.Append('|');
    }
}
