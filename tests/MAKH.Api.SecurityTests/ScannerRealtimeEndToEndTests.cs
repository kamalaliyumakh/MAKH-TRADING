using System.Collections.Concurrent;
using System.Security.Claims;
using System.Text.Encodings.Web;
using MAKH.Api.Realtime;
using MAKH.Application.Common;
using MAKH.Application.Security;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Options;
using Xunit;

namespace MAKH.Api.SecurityTests;

public sealed class ScannerRealtimeEndToEndTests
{
    private static readonly Guid UserId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid AccountId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid SessionId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    [Fact]
    public async Task EnabledTestDispatcherPublishesThenRevocationAbortsAndSuppressesNextDelta()
    {
        var store = new ControlledOutboxStore();
        var sessions = new ControlledSessionRegistry();
        await using var factory = CreateFactory(store, sessions);
        var received = new ConcurrentQueue<long>();
        var firstReceived = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        var closed = new TaskCompletionSource(TaskCreationOptions.RunContinuationsAsynchronously);
        await using var connection = new HubConnectionBuilder()
            .WithUrl(new Uri(factory.Server.BaseAddress, "/hubs/trading-v1"), options =>
            {
                options.Transports = HttpTransportType.LongPolling;
                options.HttpMessageHandlerFactory = _ => factory.Server.CreateHandler();
            })
            .Build();
        connection.On<ScannerRealtimeEvent>("scanner.updated", message =>
        {
            received.Enqueue(message.Sequence);
            firstReceived.TrySetResult();
        });
        connection.Closed += _ =>
        {
            closed.TrySetResult();
            return Task.CompletedTask;
        };

        await connection.StartAsync();
        await connection.InvokeAsync("SubscribeScannerUpdates");
        store.Enqueue(Delivery(12));

        await firstReceived.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await store.WaitForPublishedAsync(12).WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal([12L], received);

        sessions.Active = false;
        store.Enqueue(Delivery(13));

        await store.WaitForPublishedAsync(13).WaitAsync(TimeSpan.FromSeconds(5));
        await closed.Task.WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Equal([12L], received);
    }

    private static WebApplicationFactory<Program> CreateFactory(
        ControlledOutboxStore store, ControlledSessionRegistry sessions) =>
        new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Realtime:OutboxDispatcher:Enabled", "true");
            builder.UseSetting("Realtime:OutboxDispatcher:PollIntervalMilliseconds", "100");
            builder.UseSetting("Realtime:OutboxDispatcher:LeaseSeconds", "5");
            builder.UseSetting("Realtime:OutboxDispatcher:BatchSize", "1");
            builder.ConfigureTestServices(services =>
            {
                services.AddAuthentication(options =>
                    {
                        options.DefaultAuthenticateScheme = RealtimeAuthenticationHandler.SchemeName;
                        options.DefaultChallengeScheme = RealtimeAuthenticationHandler.SchemeName;
                    })
                    .AddScheme<AuthenticationSchemeOptions, RealtimeAuthenticationHandler>(
                        RealtimeAuthenticationHandler.SchemeName, _ => { });
                services.RemoveAll<IOutboxStore>();
                services.AddSingleton<IOutboxStore>(store);
                services.RemoveAll<IServerSessionRegistry>();
                services.AddSingleton<IServerSessionRegistry>(sessions);
            });
        });

    private static OutboxDelivery Delivery(long sequence) => new(
        Guid.NewGuid(), AccountId, "scanner.updated", 1, sequence, 0,
        DateTimeOffset.UtcNow,
        $$"""
        {"scannerVersion":"test:1","runId":"{{Guid.NewGuid()}}","supersedesRunId":null,"correctionReason":null,"asOf":"2026-09-16T12:00:00Z","upserts":[],"removals":[]}
        """);

    private sealed class ControlledOutboxStore : IOutboxStore
    {
        private readonly ConcurrentQueue<OutboxDelivery> deliveries = new();
        private readonly ConcurrentDictionary<long, TaskCompletionSource> published = new();

        public void Enqueue(OutboxDelivery delivery)
        {
            published[delivery.StreamSequence] =
                new(TaskCreationOptions.RunContinuationsAsynchronously);
            deliveries.Enqueue(delivery);
        }

        public Task WaitForPublishedAsync(long sequence) => published[sequence].Task;

        public Task<IReadOnlyList<OutboxDelivery>> ClaimNextAsync(
            string owner, DateTimeOffset now, TimeSpan leaseDuration, int limit,
            CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<OutboxDelivery>>(
                deliveries.TryDequeue(out var delivery) ? [delivery with { AttemptCount = 1 }] : []);

        public Task MarkPublishedAsync(
            Guid messageId, string owner, DateTimeOffset publishedAt, CancellationToken cancellationToken)
        {
            var sequence = published.Keys.Single(key => !published[key].Task.IsCompleted);
            published[sequence].TrySetResult();
            return Task.CompletedTask;
        }

        public Task MarkFailedAsync(Guid messageId, string owner, DateTimeOffset nextAttemptAt,
            string errorMessage, CancellationToken cancellationToken) =>
            throw new InvalidOperationException($"Unexpected publication failure: {errorMessage}");
    }

    private sealed class ControlledSessionRegistry : IServerSessionRegistry
    {
        public bool Active { get; set; } = true;

        public Task<bool> IsActiveAsync(Guid sessionId, Guid userId, DateTimeOffset checkedAt,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(Active && sessionId == SessionId && userId == UserId);

        public Task RegisterAsync(Guid sessionId, Guid userId, DateTimeOffset issuedAt,
            DateTimeOffset expiresAt, byte[] ticketKeyHash, byte[] protectedTicket,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<ProtectedServerTicket?> RetrieveTicketAsync(byte[] ticketKeyHash,
            DateTimeOffset checkedAt, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
        public Task<bool> RenewTicketAsync(byte[] ticketKeyHash, byte[] protectedTicket,
            DateTimeOffset seenAt, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
        public Task RevokeByTicketKeyAsync(byte[] ticketKeyHash, DateTimeOffset revokedAt,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task TouchAsync(Guid sessionId, Guid userId, DateTimeOffset seenAt,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<bool> RevokeAsync(Guid sessionId, Guid userId, DateTimeOffset revokedAt,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<IReadOnlyCollection<ServerSessionView>> ListAsync(Guid userId,
            DateTimeOffset checkedAt, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }

    private sealed class RealtimeAuthenticationHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
    {
        public const string SchemeName = "RealtimeTest";

        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            var identity = new ClaimsIdentity(
            [
                new(PlatformClaims.Subject, UserId.ToString("D")),
                new(PlatformClaims.AccountId, AccountId.ToString("D")),
                new(PlatformClaims.SessionId, SessionId.ToString("D")),
                new(PlatformClaims.AccountMode, "paper"),
            ], SchemeName);
            return Task.FromResult(AuthenticateResult.Success(
                new AuthenticationTicket(new ClaimsPrincipal(identity), SchemeName)));
        }
    }
}
