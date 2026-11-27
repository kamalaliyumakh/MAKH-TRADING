using System.Net;
using System.Text.Json;
using MAKH.Application.Evidence;
using MAKH.Worker;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class EvidenceDispatchHostedServiceTests
{
    [Fact]
    public void EnabledConfigurationRequiresDatabaseAndHttpsPublisher()
    {
        var validator = new EvidenceDispatchOptionsValidator(new ConfigurationBuilder().Build());

        var result = validator.Validate(null, new()
        {
            Enabled = true,
            PublisherEndpoint = "http://publisher.invalid/events",
        });

        Assert.True(result.Failed);
        Assert.Contains(result.Failures, failure => failure.Contains("ConnectionStrings:Platform", StringComparison.Ordinal));
        Assert.Contains(result.Failures, failure => failure.Contains("HTTPS PublisherEndpoint", StringComparison.Ordinal));
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
            PublisherEndpoint = "https://publisher.example/events",
            PollIntervalMilliseconds = 100,
            LeaseSeconds = 5,
            BatchSize = 7,
        });

        await service.StartAsync(CancellationToken.None);
        await runner.Completed.Task.WaitAsync(TimeSpan.FromSeconds(3));
        await service.StopAsync(CancellationToken.None);

        Assert.True(runner.Calls >= 2);
        Assert.Equal(TimeSpan.FromSeconds(5), runner.LeaseDuration);
        Assert.Equal(7, runner.BatchSize);
        Assert.StartsWith("evidence-", runner.Owner, StringComparison.Ordinal);
    }

    [Fact]
    public async Task HttpPublisherPreservesPayloadAndAddsIdempotencyMetadata()
    {
        var handler = new RecordingHandler();
        var publisher = new HttpEvidenceOutboxPublisher(
            new HttpClient(handler),
            Options.Create(new EvidenceDispatchOptions
            {
                PublisherEndpoint = "https://publisher.example/events",
            }));
        var delivery = new EvidenceOutboxDelivery(
            Guid.Parse("10000000-0000-0000-0000-000000000001"),
            Guid.Parse("20000000-0000-0000-0000-000000000002"),
            "evidence.updated",
            1,
            1,
            new DateTimeOffset(2026, 10, 1, 15, 0, 0, TimeSpan.Zero),
            "{\"evidenceDocumentId\":\"20000000-0000-0000-0000-000000000002\"}");

        await publisher.PublishAsync(delivery, CancellationToken.None);

        Assert.Equal("https://publisher.example/events", handler.Uri?.ToString());
        Assert.Equal(delivery.Id.ToString("D"), handler.Headers["Idempotency-Key"]);
        Assert.Equal(delivery.EventType, handler.Headers["X-MAKH-Event-Type"]);
        Assert.Equal("1", handler.Headers["X-MAKH-Schema-Version"]);
        Assert.Equal(delivery.EvidenceDocumentId.ToString("D"), handler.Headers["X-MAKH-Evidence-Document-Id"]);
        Assert.Equal(delivery.EvidenceDocumentId.ToString("D"),
            JsonDocument.Parse(handler.Body!).RootElement.GetProperty("evidenceDocumentId").GetString());
    }

    private static ServiceProvider Services(IEvidenceDispatchRunner runner) =>
        new ServiceCollection().AddScoped(_ => runner).BuildServiceProvider();

    private static EvidenceDispatchHostedService HostedService(
        ServiceProvider provider, EvidenceDispatchOptions options) =>
        new(
            provider.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(options),
            TimeProvider.System,
            NullLogger<EvidenceDispatchHostedService>.Instance);

    private sealed class RecordingRunner(bool failFirst = false) : IEvidenceDispatchRunner
    {
        public int Calls { get; private set; }
        public string Owner { get; private set; } = string.Empty;
        public TimeSpan LeaseDuration { get; private set; }
        public int BatchSize { get; private set; }
        public TaskCompletionSource Completed { get; } = new(TaskCreationOptions.RunContinuationsAsynchronously);

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

    private sealed class RecordingHandler : HttpMessageHandler
    {
        public Uri? Uri { get; private set; }
        public Dictionary<string, string> Headers { get; } = new(StringComparer.Ordinal);
        public string? Body { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Uri = request.RequestUri;
            foreach (var header in request.Headers)
                Headers[header.Key] = Assert.Single(header.Value);
            Body = await request.Content!.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(HttpStatusCode.Accepted);
        }
    }
}
