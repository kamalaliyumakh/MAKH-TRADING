using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using MAKH.Application.Common.Ports;
using MAKH.Application.Evidence;
using Microsoft.Extensions.Options;

namespace MAKH.Worker;

public sealed class EvidenceDispatchOptions
{
    public const string SectionName = "Evidence:OutboxDispatcher";
    public bool Enabled { get; init; }
    public string PublisherEndpoint { get; init; } = string.Empty;
    public int PollIntervalMilliseconds { get; init; } = 1_000;
    public int LeaseSeconds { get; init; } = 30;
    public int BatchSize { get; init; } = 10;
    public int RequestTimeoutSeconds { get; init; } = 15;
}

public sealed class EvidenceDispatchOptionsValidator(IConfiguration configuration)
    : IValidateOptions<EvidenceDispatchOptions>
{
    public ValidateOptionsResult Validate(string? name, EvidenceDispatchOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var failures = new List<string>();
        if (options.PollIntervalMilliseconds is < 100 or > 60_000)
            failures.Add("Evidence outbox poll interval must be between 100 and 60000 milliseconds.");
        if (options.LeaseSeconds is < 5 or > 300)
            failures.Add("Evidence outbox lease must be between 5 and 300 seconds.");
        if (options.BatchSize is < 1 or > 100)
            failures.Add("Evidence outbox batch size must be between 1 and 100.");
        if (options.RequestTimeoutSeconds is < 1 or > 60)
            failures.Add("Evidence publisher timeout must be between 1 and 60 seconds.");

        if (options.Enabled)
        {
            if (string.IsNullOrWhiteSpace(configuration.GetConnectionString("Platform")))
                failures.Add("Enabled evidence dispatch requires ConnectionStrings:Platform.");
            if (!Uri.TryCreate(options.PublisherEndpoint, UriKind.Absolute, out var endpoint)
                || endpoint.Scheme != Uri.UriSchemeHttps)
                failures.Add("Enabled evidence dispatch requires an absolute HTTPS PublisherEndpoint.");
        }

        return failures.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(failures);
    }
}

public interface IEvidenceDispatchRunner
{
    Task<int> RunOnceAsync(string owner, TimeSpan leaseDuration, int batchSize, CancellationToken cancellationToken);
}

public sealed class EvidenceDispatchRunner(EvidenceOutboxDispatcher dispatcher, IClock clock)
    : IEvidenceDispatchRunner
{
    public Task<int> RunOnceAsync(
        string owner, TimeSpan leaseDuration, int batchSize, CancellationToken cancellationToken) =>
        dispatcher.DispatchOnceAsync(owner, clock.UtcNow, leaseDuration, batchSize, cancellationToken);
}

public sealed class HttpEvidenceOutboxPublisher(
    HttpClient client,
    IOptions<EvidenceDispatchOptions> configuredOptions) : IEvidenceOutboxPublisher
{
    private readonly EvidenceDispatchOptions options = configuredOptions.Value;

    public async Task PublishAsync(EvidenceOutboxDelivery delivery, CancellationToken cancellationToken)
    {
        using var payload = JsonDocument.Parse(delivery.Payload);
        using var request = new HttpRequestMessage(HttpMethod.Post, options.PublisherEndpoint)
        {
            Content = new StringContent(
                payload.RootElement.GetRawText(), Encoding.UTF8, MediaTypeHeaderValue.Parse("application/json")),
        };
        request.Headers.Add("Idempotency-Key", delivery.Id.ToString("D"));
        request.Headers.Add("X-MAKH-Event-Type", delivery.EventType);
        request.Headers.Add("X-MAKH-Schema-Version", delivery.SchemaVersion.ToString(System.Globalization.CultureInfo.InvariantCulture));
        request.Headers.Add("X-MAKH-Evidence-Document-Id", delivery.EvidenceDocumentId.ToString("D"));

        using var response = await client.SendAsync(
            request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();
    }
}

public sealed partial class EvidenceDispatchHostedService(
    IServiceScopeFactory scopeFactory,
    IOptions<EvidenceDispatchOptions> configuredOptions,
    TimeProvider timeProvider,
    ILogger<EvidenceDispatchHostedService> logger) : BackgroundService
{
    private readonly EvidenceDispatchOptions options = configuredOptions.Value;
    private readonly string owner = $"evidence-{Environment.MachineName}-{Guid.NewGuid():N}";

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
                var runner = scope.ServiceProvider.GetRequiredService<IEvidenceDispatchRunner>();
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
                    TimeSpan.FromMilliseconds(options.PollIntervalMilliseconds), timeProvider, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }

    [LoggerMessage(EventId = 3000, Level = LogLevel.Information,
        Message = "Evidence outbox dispatcher is disabled by configuration.")]
    private static partial void DispatcherDisabled(ILogger logger);

    [LoggerMessage(EventId = 3001, Level = LogLevel.Information,
        Message = "Evidence outbox dispatcher started with batch {BatchSize}, lease {LeaseSeconds}s and poll {PollMilliseconds}ms.")]
    private static partial void DispatcherStarted(
        ILogger logger, int batchSize, int leaseSeconds, int pollMilliseconds);

    [LoggerMessage(EventId = 3002, Level = LogLevel.Error,
        Message = "Evidence outbox dispatch cycle failed with {ErrorType}; the next bounded cycle will retry.")]
    private static partial void DispatchCycleFailed(ILogger logger, string errorType);
}
