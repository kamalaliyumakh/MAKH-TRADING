using MAKH.Application.Common;
using MAKH.Application.Common.Ports;
using Microsoft.Extensions.Options;

namespace MAKH.Api.Realtime;

public sealed class OutboxDispatchOptions
{
    public const string SectionName = "Realtime:OutboxDispatcher";
    public bool Enabled { get; init; }
    public int PollIntervalMilliseconds { get; init; } = 1_000;
    public int LeaseSeconds { get; init; } = 30;
    public int BatchSize { get; init; } = 10;
}

public sealed class OutboxDispatchOptionsValidator : IValidateOptions<OutboxDispatchOptions>
{
    public ValidateOptionsResult Validate(string? name, OutboxDispatchOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        if (options.PollIntervalMilliseconds is < 100 or > 60_000)
            return ValidateOptionsResult.Fail("Outbox poll interval must be between 100 and 60000 milliseconds.");
        if (options.LeaseSeconds is < 5 or > 300)
            return ValidateOptionsResult.Fail("Outbox lease must be between 5 and 300 seconds.");
        if (options.BatchSize is < 1 or > 100)
            return ValidateOptionsResult.Fail("Outbox batch size must be between 1 and 100.");
        return ValidateOptionsResult.Success;
    }
}

public interface IOutboxDispatchRunner
{
    Task<int> RunOnceAsync(
        string owner, TimeSpan leaseDuration, int batchSize, CancellationToken cancellationToken);
}

public sealed class OutboxDispatchRunner(OutboxDispatcher dispatcher, IClock clock) : IOutboxDispatchRunner
{
    public Task<int> RunOnceAsync(
        string owner, TimeSpan leaseDuration, int batchSize, CancellationToken cancellationToken) =>
        dispatcher.DispatchOnceAsync(owner, clock.UtcNow, leaseDuration, batchSize, cancellationToken);
}

public sealed partial class OutboxDispatchHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<OutboxDispatchOptions> configuredOptions,
    TimeProvider timeProvider,
    ILogger<OutboxDispatchHostedService> logger) : BackgroundService
{
    private readonly OutboxDispatchOptions options = configuredOptions.Value;
    private readonly string owner = $"api-{Environment.MachineName}-{Guid.NewGuid():N}";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Enabled)
        {
            DispatcherDisabled(logger);
            return;
        }

        DispatcherStarted(logger, options.BatchSize, options.LeaseSeconds, options.PollIntervalMilliseconds);
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var runner = scope.ServiceProvider.GetRequiredService<IOutboxDispatchRunner>();
                await runner.RunOnceAsync(
                    owner, TimeSpan.FromSeconds(options.LeaseSeconds), options.BatchSize, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                DispatchCycleFailed(logger, exception.GetType().Name);
            }

            try
            {
                await Task.Delay(
                    TimeSpan.FromMilliseconds(options.PollIntervalMilliseconds),
                    timeProvider,
                    stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    [LoggerMessage(EventId = 2100, Level = LogLevel.Information,
        Message = "Scanner outbox dispatcher is disabled by configuration.")]
    private static partial void DispatcherDisabled(ILogger logger);

    [LoggerMessage(EventId = 2101, Level = LogLevel.Information,
        Message = "Scanner outbox dispatcher started with batch {BatchSize}, lease {LeaseSeconds}s and poll {PollMilliseconds}ms.")]
    private static partial void DispatcherStarted(
        ILogger logger, int batchSize, int leaseSeconds, int pollMilliseconds);

    [LoggerMessage(EventId = 2102, Level = LogLevel.Error,
        Message = "Scanner outbox dispatch cycle failed with {ErrorType}; the next bounded cycle will retry.")]
    private static partial void DispatchCycleFailed(ILogger logger, string errorType);
}
