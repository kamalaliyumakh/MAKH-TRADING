using System.Security.Claims;
using MAKH.Api.Realtime;
using MAKH.Application.Common;
using MAKH.Application.Common.Ports;
using MAKH.Application.Security;
using Xunit;

namespace MAKH.Api.SecurityTests;

public sealed class ScannerRealtimeSecurityTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 16, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid UserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid AccountId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid SessionId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task ActiveSessionResolvesOnlyItsClaimedAccountGroup()
    {
        var access = new ScannerRealtimeAccess(new SessionRegistry(active: true), new FixedClock(Now));

        var identity = await access.AuthorizeAsync(Principal());

        Assert.Equal(AccountId, identity?.AccountId);
        Assert.Equal(UserId, identity?.UserId);
        Assert.Equal(SessionId, identity?.SessionId);
        Assert.Equal($"scanner:account:{AccountId:N}", ScannerRealtimeGroups.ForAccount(identity!.AccountId));
    }

    [Theory]
    [InlineData(false, true, true)]
    [InlineData(true, false, true)]
    [InlineData(true, true, false)]
    public async Task MissingIdentityBindingFailsClosed(bool subject, bool account, bool session)
    {
        var access = new ScannerRealtimeAccess(new SessionRegistry(active: true), new FixedClock(Now));

        var accountId = await access.AuthorizeAsync(Principal(subject, account, session));

        Assert.Null(accountId);
    }

    [Fact]
    public async Task RevokedSessionFailsClosedBeforeGroupAdmission()
    {
        var access = new ScannerRealtimeAccess(new SessionRegistry(active: false), new FixedClock(Now));

        var accountId = await access.AuthorizeAsync(Principal());

        Assert.Null(accountId);
    }

    [Fact]
    public void ExplicitSessionRevocationAbortsAndRemovesEveryMatchingConnection()
    {
        var aborted = 0;
        var registry = new ScannerConnectionRegistry();
        registry.Register(new("connection-a", UserId, AccountId, SessionId, () => aborted++));
        registry.Register(new("connection-b", UserId, AccountId, SessionId, () => aborted++));
        registry.Register(new("connection-c", UserId, AccountId, Guid.NewGuid(), () => aborted++));

        var disconnected = registry.DisconnectSession(SessionId);

        Assert.Equal(2, disconnected);
        Assert.Equal(2, aborted);
        Assert.Single(registry.ForAccount(AccountId));
        Assert.Equal("connection-c", registry.ForAccount(AccountId)[0].ConnectionId);
    }

    [Fact]
    public async Task PublicationRevalidatesConnectionsAndExcludesRevokedSession()
    {
        var aborted = 0;
        var registry = new ScannerConnectionRegistry();
        var activeSession = SessionId;
        var revokedSession = Guid.NewGuid();
        registry.Register(new("active", UserId, AccountId, activeSession, () => aborted++));
        registry.Register(new("revoked", UserId, AccountId, revokedSession, () => aborted++));
        var delivery = new CapturingHubDelivery();
        var sessions = new SessionRegistry(sessionId => sessionId == activeSession);
        var sender = new SignalRScannerRealtimeSender(delivery, registry, sessions, new FixedClock(Now));
        var message = RealtimeEvent();

        await sender.SendAsync(AccountId, message, CancellationToken.None);

        Assert.Equal(["active"], delivery.ConnectionIds);
        Assert.Equal(1, aborted);
        Assert.Equal(["active"], registry.ForAccount(AccountId).Select(item => item.ConnectionId));
    }

    [Fact]
    public async Task PublisherRoutesVersionedEnvelopeOnlyToAccountGroup()
    {
        var sender = new CapturingSender();
        var publisher = new SignalRScannerOutboxPublisher(sender, new FixedClock(Now));
        var delivery = new OutboxDelivery(
            Guid.Parse("44444444-4444-4444-4444-444444444444"), AccountId,
            "scanner.updated", 1, 12, 1, Now.AddSeconds(-2), ValidPayload());

        await publisher.PublishAsync(delivery, CancellationToken.None);

        Assert.Equal(AccountId, sender.AccountId);
        Assert.Equal("scanner.updated", sender.Message?.EventType);
        Assert.Equal(12, sender.Message?.Sequence);
        Assert.Equal(Now, sender.Message?.PublishedAt);
        Assert.Equal("44444444-4444-4444-4444-444444444444",
            sender.Message?.Payload.GetProperty("runId").GetString());
    }

    [Theory]
    [InlineData("order.updated", "{}")]
    [InlineData("scanner.updated", "not-json")]
    public async Task PublisherRejectsUnsupportedOrMalformedMessages(string eventType, string payload)
    {
        var publisher = new SignalRScannerOutboxPublisher(new CapturingSender(), new FixedClock(Now));
        var delivery = new OutboxDelivery(Guid.NewGuid(), AccountId, eventType, 1, 12, 1, Now, payload);

        await Assert.ThrowsAnyAsync<Exception>(() => publisher.PublishAsync(delivery, CancellationToken.None));
    }

    [Theory]
    [InlineData(2, "unsupported schema")]
    [InlineData(1, "missing correction metadata")]
    [InlineData(1, "overlapping delta")]
    public async Task PublisherRejectsIncompatibleScannerContracts(int schemaVersion, string scenario)
    {
        var payload = scenario switch
        {
            "missing correction metadata" =>
                """{"scannerVersion":"test:1","runId":"44444444-4444-4444-4444-444444444444","asOf":"2026-09-16T12:00:00Z","upserts":[],"removals":[]}""",
            "overlapping delta" => PayloadWithOverlappingDelta(),
            _ => ValidPayload(),
        };
        var publisher = new SignalRScannerOutboxPublisher(new CapturingSender(), new FixedClock(Now));
        var delivery = new OutboxDelivery(
            Guid.NewGuid(), AccountId, "scanner.updated", schemaVersion, 12, 1, Now, payload);

        await Assert.ThrowsAnyAsync<Exception>(() => publisher.PublishAsync(delivery, CancellationToken.None));
    }

    private static string ValidPayload() =>
        """{"scannerVersion":"test:1","runId":"44444444-4444-4444-4444-444444444444","supersedesRunId":null,"correctionReason":null,"asOf":"2026-09-16T12:00:00Z","upserts":[],"removals":[]}""";

    private static string PayloadWithOverlappingDelta() =>
        """{"scannerVersion":"test:1","runId":"44444444-4444-4444-4444-444444444444","supersedesRunId":null,"correctionReason":null,"asOf":"2026-09-16T12:00:00Z","upserts":[{"securityId":"55555555-5555-5555-5555-555555555555","symbol":"TEST","rank":1,"qualified":true,"extremeMoveRisk":false,"price":4.0,"gainPercent":150.0,"relativeVolume":4.0,"publicFloat":300000,"spreadPercent":1.0,"dollarVolume":1200000,"exclusionReason":""}],"removals":["55555555-5555-5555-5555-555555555555"]}""";

    private static ClaimsPrincipal Principal(bool subject = true, bool account = true, bool session = true)
    {
        var claims = new List<Claim>();
        if (subject) claims.Add(new(PlatformClaims.Subject, UserId.ToString("D")));
        if (account) claims.Add(new(PlatformClaims.AccountId, AccountId.ToString("D")));
        if (session) claims.Add(new(PlatformClaims.SessionId, SessionId.ToString("D")));
        return new(new ClaimsIdentity(claims, "test"));
    }

    private sealed class FixedClock(DateTimeOffset utcNow) : IClock
    {
        public DateTimeOffset UtcNow { get; } = utcNow;
    }

    private static ScannerRealtimeEvent RealtimeEvent() => new(
        Guid.NewGuid(), "scanner.updated", 1, ScannerRealtimeGroups.ForAccount(AccountId),
        12, Now.AddSeconds(-1), Now, System.Text.Json.JsonDocument.Parse("{}").RootElement.Clone());

    private sealed class SessionRegistry : IServerSessionRegistry
    {
        private readonly Func<Guid, bool> isActive;

        public SessionRegistry(bool active) : this(_ => active) { }

        public SessionRegistry(Func<Guid, bool> isActive) => this.isActive = isActive;

        public Task<bool> IsActiveAsync(Guid sessionId, Guid userId, DateTimeOffset checkedAt,
            CancellationToken cancellationToken = default) => Task.FromResult(isActive(sessionId));

        public Task RegisterAsync(Guid sessionId, Guid userId, DateTimeOffset issuedAt, DateTimeOffset expiresAt,
            byte[] ticketKeyHash, byte[] protectedTicket, CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
        public Task<ProtectedServerTicket?> RetrieveTicketAsync(byte[] ticketKeyHash, DateTimeOffset checkedAt,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<bool> RenewTicketAsync(byte[] ticketKeyHash, byte[] protectedTicket, DateTimeOffset seenAt,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task RevokeByTicketKeyAsync(byte[] ticketKeyHash, DateTimeOffset revokedAt,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task TouchAsync(Guid sessionId, Guid userId, DateTimeOffset seenAt,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<bool> RevokeAsync(Guid sessionId, Guid userId, DateTimeOffset revokedAt,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<IReadOnlyCollection<ServerSessionView>> ListAsync(Guid userId, DateTimeOffset checkedAt,
            CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }

    private sealed class CapturingSender : IScannerRealtimeSender
    {
        public Guid? AccountId { get; private set; }
        public ScannerRealtimeEvent? Message { get; private set; }

        public Task SendAsync(Guid accountId, ScannerRealtimeEvent message, CancellationToken cancellationToken)
        {
            AccountId = accountId;
            Message = message;
            return Task.CompletedTask;
        }
    }

    private sealed class CapturingHubDelivery : IScannerHubDelivery
    {
        public IReadOnlyList<string> ConnectionIds { get; private set; } = [];

        public Task SendAsync(IReadOnlyList<string> connectionIds, ScannerRealtimeEvent message,
            CancellationToken cancellationToken)
        {
            ConnectionIds = connectionIds;
            return Task.CompletedTask;
        }
    }
}
