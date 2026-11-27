using MAKH.Application.Common.Ports;
using MAKH.Application.Evidence;
using MAKH.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class SocialRetentionCleanupHostedServiceTests
{
    [Fact]
    public void EnabledConfigurationRequiresDatabaseAndBoundedSettings()
    {
        var validator = new SocialRetentionCleanupOptionsValidator(new ConfigurationBuilder().Build());

        var result = validator.Validate(null, new()
        {
            Enabled = true,
            IntervalSeconds = 0,
            BatchSize = 1_001,
            MaximumOverdueSeconds = 0,
        });

        Assert.True(result.Failed);
        Assert.Contains(result.Failures, failure => failure.Contains("ConnectionStrings:Platform", StringComparison.Ordinal));
        Assert.Contains(result.Failures, failure => failure.Contains("interval", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.Failures, failure => failure.Contains("batch size", StringComparison.OrdinalIgnoreCase));
        Assert.Contains(result.Failures, failure => failure.Contains("overdue", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task DisabledConfigurationRunsNoCleanupCycle()
    {
        var runner = new RecordingRunner();
        await using var provider = Services(runner);
        var service = HostedService(provider, new() { Enabled = false });

        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        Assert.Equal(0, runner.Calls);
    }

    [Fact]
    public async Task EnabledCleanupRetriesAfterFailureAndStopsCleanly()
    {
        var runner = new RecordingRunner(failFirst: true);
        await using var provider = Services(runner);
        var service = HostedService(provider, new()
        {
            Enabled = true,
            IntervalSeconds = 1,
            BatchSize = 37,
        });

        await service.StartAsync(CancellationToken.None);
        await runner.Completed.Task.WaitAsync(TimeSpan.FromSeconds(4));
        await service.StopAsync(CancellationToken.None);

        Assert.True(runner.Calls >= 2);
        Assert.Equal(37, runner.BatchSize);
    }

    [Fact]
    public async Task RunnerReconcilesRemainingExpiredRowsAtSameCutoff()
    {
        var now = new DateTimeOffset(2026, 10, 2, 12, 0, 0, TimeSpan.Zero);
        var store = new RecordingStore(new(3, now.AddMinutes(-10)));
        var runner = new SocialRetentionCleanupRunner(store, new TestClock(now));

        var result = await runner.RunOnceAsync(41, CancellationToken.None);

        Assert.Equal(2, result.DeletedCount);
        Assert.Equal(3, result.RemainingExpiredCount);
        Assert.Equal(now.AddMinutes(-10), result.OldestRetainUntil);
        Assert.Equal(now, result.ReconciledAt);
        Assert.Equal(now, store.DeleteAsOf);
        Assert.Equal(now, store.BacklogAsOf);
        Assert.Equal(41, store.DeleteLimit);
    }

    [Fact]
    public async Task OverdueBacklogEmitsStableErrorEventWithoutIdentifiers()
    {
        var now = new DateTimeOffset(2026, 10, 2, 12, 0, 0, TimeSpan.Zero);
        var runner = new RecordingRunner(result: new(1, 2, now.AddMinutes(-10), now));
        var logger = new RecordingLogger();
        await using var provider = Services(runner);
        var service = HostedService(provider, new()
        {
            Enabled = true,
            IntervalSeconds = 60,
            BatchSize = 1,
            MaximumOverdueSeconds = 300,
        }, logger);

        await service.StartAsync(CancellationToken.None);
        await logger.Overdue.Task.WaitAsync(TimeSpan.FromSeconds(4));
        await service.StopAsync(CancellationToken.None);

        var entry = Assert.Single(logger.Entries, item => item.EventId.Id == 3105);
        Assert.Equal(LogLevel.Error, entry.Level);
        Assert.Contains("2 expired aggregate records", entry.Message, StringComparison.Ordinal);
        Assert.DoesNotContain('@', entry.Message);
    }

    private static ServiceProvider Services(ISocialRetentionCleanupRunner runner) =>
        new ServiceCollection().AddScoped(_ => runner).BuildServiceProvider();

    private static SocialRetentionCleanupHostedService HostedService(
        ServiceProvider provider,
        SocialRetentionCleanupOptions options,
        ILogger<SocialRetentionCleanupHostedService>? logger = null) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(options),
            TimeProvider.System,
            logger ?? NullLogger<SocialRetentionCleanupHostedService>.Instance);

    private sealed class RecordingRunner(
        bool failFirst = false,
        SocialRetentionCleanupResult? result = null) : ISocialRetentionCleanupRunner
    {
        public int Calls { get; private set; }
        public int BatchSize { get; private set; }
        public TaskCompletionSource Completed { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public Task<SocialRetentionCleanupResult> RunOnceAsync(int batchSize, CancellationToken cancellationToken)
        {
            Calls++;
            BatchSize = batchSize;
            if (failFirst && Calls == 1) throw new InvalidOperationException("synthetic failure");
            Completed.TrySetResult();
            return Task.FromResult(result ?? new(2, 0, null, DateTimeOffset.UtcNow));
        }
    }

    private sealed class RecordingStore(SocialRetentionBacklog backlog) : ISocialAttentionStore
    {
        public DateTimeOffset DeleteAsOf { get; private set; }
        public DateTimeOffset BacklogAsOf { get; private set; }
        public int DeleteLimit { get; private set; }

        public Task<SocialAttentionIngestionResult> SaveBatchAsync(
            IReadOnlyCollection<SocialAttentionIngestionItem> items,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();

        public Task<int> DeleteExpiredAsync(
            DateTimeOffset asOf,
            int limit,
            CancellationToken cancellationToken = default)
        {
            DeleteAsOf = asOf;
            DeleteLimit = limit;
            return Task.FromResult(2);
        }

        public Task<SocialRetentionBacklog> GetRetentionBacklogAsync(
            DateTimeOffset asOf,
            CancellationToken cancellationToken = default)
        {
            BacklogAsOf = asOf;
            return Task.FromResult(backlog);
        }
    }

    private sealed class TestClock(DateTimeOffset now) : IClock
    {
        public DateTimeOffset UtcNow => now;
    }

    private sealed class RecordingLogger : ILogger<SocialRetentionCleanupHostedService>
    {
        public List<(LogLevel Level, EventId EventId, string Message)> Entries { get; } = [];
        public TaskCompletionSource Overdue { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            Entries.Add((logLevel, eventId, formatter(state, exception)));
            if (eventId.Id == 3105) Overdue.TrySetResult();
        }
    }
}
