using MAKH.Api.Realtime;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace MAKH.Api.SecurityTests;

public sealed class OutboxDispatchHostedServiceTests
{
    [Fact]
    public void InvalidEnabledConfigurationFailsClosed()
    {
        var validator = new OutboxDispatchOptionsValidator();

        var result = validator.Validate(null, new()
        {
            Enabled = true,
            PollIntervalMilliseconds = 99,
            LeaseSeconds = 4,
            BatchSize = 0,
        });

        Assert.True(result.Failed);
    }

    [Fact]
    public async Task DisabledConfigurationRunsNoDispatchCycle()
    {
        var runner = new RecordingRunner();
        await using var provider = Services(runner);
        var service = HostedService(provider, new() { Enabled = false });

        await service.StartAsync(CancellationToken.None);
        await service.StopAsync(CancellationToken.None);

        Assert.Equal(0, runner.Calls);
    }

    [Fact]
    public async Task EnabledDispatcherRetriesAfterCycleFailureAndStopsCleanly()
    {
        var runner = new RecordingRunner(failFirst: true);
        await using var provider = Services(runner);
        var service = HostedService(provider, new()
        {
            Enabled = true,
            PollIntervalMilliseconds = 100,
            LeaseSeconds = 5,
            BatchSize = 3,
        });

        await service.StartAsync(CancellationToken.None);
        await runner.Completed.Task.WaitAsync(TimeSpan.FromSeconds(3));
        await service.StopAsync(CancellationToken.None);

        Assert.True(runner.Calls >= 2);
        Assert.Equal(TimeSpan.FromSeconds(5), runner.LeaseDuration);
        Assert.Equal(3, runner.BatchSize);
        Assert.StartsWith("api-", runner.Owner, StringComparison.Ordinal);
    }

    private static ServiceProvider Services(IOutboxDispatchRunner runner) =>
        new ServiceCollection().AddScoped(_ => runner).BuildServiceProvider();

    private static OutboxDispatchHostedService HostedService(
        ServiceProvider provider, OutboxDispatchOptions options) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(options),
            TimeProvider.System,
            NullLogger<OutboxDispatchHostedService>.Instance);

    private sealed class RecordingRunner(bool failFirst = false) : IOutboxDispatchRunner
    {
        public int Calls { get; private set; }
        public string Owner { get; private set; } = string.Empty;
        public TimeSpan LeaseDuration { get; private set; }
        public int BatchSize { get; private set; }
        public TaskCompletionSource Completed { get; } =
            new(TaskCreationOptions.RunContinuationsAsynchronously);

        public Task<int> RunOnceAsync(
            string owner, TimeSpan leaseDuration, int batchSize, CancellationToken cancellationToken)
        {
            Calls++;
            Owner = owner;
            LeaseDuration = leaseDuration;
            BatchSize = batchSize;
            if (failFirst && Calls == 1) throw new InvalidOperationException("synthetic failure");
            Completed.TrySetResult();
            return Task.FromResult(0);
        }
    }
}
