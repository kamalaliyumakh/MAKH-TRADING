using MAKH.Application.Common.Ports;
using MAKH.Application.Evidence;
using Microsoft.Extensions.Options;

namespace MAKH.Worker;

public sealed class SocialRetentionCleanupOptions
{
    public const string SectionName = "Evidence:SocialRetentionCleanup";
    public bool Enabled { get; init; }
    public int IntervalSeconds { get; init; } = 3_600;
    public int BatchSize { get; init; } = 100;
    public int MaximumOverdueSeconds { get; init; } = 300;
}

public sealed class SocialRetentionCleanupOptionsValidator(IConfiguration configuration)
    : IValidateOptions<SocialRetentionCleanupOptions>
{
    public ValidateOptionsResult Validate(string? name, SocialRetentionCleanupOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var failures = new List<string>();
        if (options.IntervalSeconds is < 1 or > 86_400)
            failures.Add("Social retention cleanup interval must be between 1 and 86400 seconds.");
        if (options.BatchSize is < 1 or > 1_000)
            failures.Add("Social retention cleanup batch size must be between 1 and 1000.");
        if (options.MaximumOverdueSeconds is < 1 or > 86_400)
            failures.Add("Social retention maximum overdue age must be between 1 and 86400 seconds.");
        if (options.Enabled && string.IsNullOrWhiteSpace(configuration.GetConnectionString("Platform")))
            failures.Add("Enabled social retention cleanup requires ConnectionStrings:Platform.");
        return failures.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(failures);
    }
}

public interface ISocialRetentionCleanupRunner
{
    Task<SocialRetentionCleanupResult> RunOnceAsync(int batchSize, CancellationToken cancellationToken);
}

public sealed record SocialRetentionCleanupResult(
    int DeletedCount,
    int RemainingExpiredCount,
    DateTimeOffset? OldestRetainUntil,
    DateTimeOffset ReconciledAt);

public sealed class SocialRetentionCleanupRunner(ISocialAttentionStore store, IClock clock) : ISocialRetentionCleanupRunner
{
    public async Task<SocialRetentionCleanupResult> RunOnceAsync(
        int batchSize,
        CancellationToken cancellationToken)
    {
        var asOf = clock.UtcNow;
        var deleted = await store.DeleteExpiredAsync(asOf, batchSize, cancellationToken);
        var backlog = await store.GetRetentionBacklogAsync(asOf, cancellationToken);
        return new(deleted, backlog.ExpiredCount, backlog.OldestRetainUntil, asOf);
    }
}

public sealed partial class SocialRetentionCleanupHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<SocialRetentionCleanupOptions> configuredOptions,
    TimeProvider timeProvider,
    ILogger<SocialRetentionCleanupHostedService> logger) : BackgroundService
{
    private readonly SocialRetentionCleanupOptions options = configuredOptions.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Enabled)
        {
            CleanupDisabled(logger);
            return;
        }

        CleanupStarted(logger, options.BatchSize, options.IntervalSeconds);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var runner = scope.ServiceProvider.GetRequiredService<ISocialRetentionCleanupRunner>();
                var result = await runner.RunOnceAsync(options.BatchSize, stoppingToken);
                CleanupCompleted(logger, result.DeletedCount);
                ReportBacklog(result);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                CleanupFailed(logger, exception.GetType().Name);
            }

            try
            {
                await Task.Delay(TimeSpan.FromSeconds(options.IntervalSeconds), timeProvider, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    private void ReportBacklog(SocialRetentionCleanupResult result)
    {
        if (result.RemainingExpiredCount == 0 || result.OldestRetainUntil is null) return;
        var overdueSeconds = Math.Max(0, (long)(result.ReconciledAt - result.OldestRetainUntil.Value).TotalSeconds);
        if (overdueSeconds >= options.MaximumOverdueSeconds)
        {
            CleanupOverdue(logger, result.RemainingExpiredCount, overdueSeconds);
            return;
        }

        CleanupBacklog(logger, result.RemainingExpiredCount, overdueSeconds);
    }

    [LoggerMessage(EventId = 3100, Level = LogLevel.Information,
        Message = "Social retention cleanup is disabled by configuration.")]
    private static partial void CleanupDisabled(ILogger logger);

    [LoggerMessage(EventId = 3101, Level = LogLevel.Information,
        Message = "Social retention cleanup started with batch {BatchSize} and interval {IntervalSeconds}s.")]
    private static partial void CleanupStarted(ILogger logger, int batchSize, int intervalSeconds);

    [LoggerMessage(EventId = 3102, Level = LogLevel.Information,
        Message = "Social retention cleanup deleted {DeletedCount} expired aggregate records.")]
    private static partial void CleanupCompleted(ILogger logger, int deletedCount);

    [LoggerMessage(EventId = 3103, Level = LogLevel.Error,
        Message = "Social retention cleanup cycle failed with {ErrorType}; the next bounded cycle will retry.")]
    private static partial void CleanupFailed(ILogger logger, string errorType);

    [LoggerMessage(EventId = 3104, Level = LogLevel.Warning,
        Message = "Social retention reconciliation found {RemainingExpiredCount} expired aggregate records; oldest is overdue by {OverdueSeconds}s.")]
    private static partial void CleanupBacklog(ILogger logger, int remainingExpiredCount, long overdueSeconds);

    [LoggerMessage(EventId = 3105, Level = LogLevel.Error,
        Message = "Social retention overdue threshold breached with {RemainingExpiredCount} expired aggregate records; oldest is overdue by {OverdueSeconds}s. Route to the retention runbook.")]
    private static partial void CleanupOverdue(ILogger logger, int remainingExpiredCount, long overdueSeconds);
}
