using MAKH.Application.Notifications;
using MAKH.Infrastructure.Notifications;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class NotificationServiceTests
{
    private static readonly Guid UserId = Guid.Parse("10000000-0000-0000-0000-000000000001");
    private static readonly DateTimeOffset Now = new(2026, 8, 13, 14, 0, 0, TimeSpan.Zero);

    [Fact]
    public void MissingPreferenceSuppressesDeliveryFailClosed()
    {
        var result = Service().Queue(Event(), NotificationChannel.Email, "notify-1");
        Assert.Equal(DeliveryState.Suppressed, result.State);
    }

    [Fact]
    public void EnabledPreferenceQueuesMatchingSeverity()
    {
        var service = Service();
        service.SetPreference(new(UserId, NotificationChannel.InApp, "risk.breach", NotificationSeverity.Warning, true));
        var result = service.Queue(Event(), NotificationChannel.InApp, "notify-1");
        Assert.Equal(DeliveryState.Pending, result.State);
        Assert.False(result.IsAuthoritativeTradingState);
        Assert.False(result.CreatesLiveAuthority);
    }

    [Fact]
    public void SeverityBelowPreferenceIsSuppressed()
    {
        var service = Service();
        service.SetPreference(new(UserId, NotificationChannel.Email, "risk.breach", NotificationSeverity.HardBlock, true));
        Assert.Equal(DeliveryState.Suppressed, service.Queue(Event(NotificationSeverity.Warning), NotificationChannel.Email, "notify-1").State);
    }

    [Fact]
    public void DisabledPreferenceSuppressesEvenHardBlockDelivery()
    {
        var service = Service();
        service.SetPreference(new(UserId, NotificationChannel.Email, "risk.breach", NotificationSeverity.Information, false));
        Assert.Equal(DeliveryState.Suppressed, service.Queue(Event(NotificationSeverity.HardBlock), NotificationChannel.Email, "notify-1").State);
    }

    [Fact]
    public void MandatorySafetyPolicyCannotBeWeakenedByDisabledPreference()
    {
        var service = MandatorySafetyService();
        service.SetPreference(new(UserId, NotificationChannel.InApp, "risk.breach", NotificationSeverity.Information, false));

        var result = service.Queue(Event(NotificationSeverity.HardBlock), NotificationChannel.InApp, "mandatory-1");

        Assert.Equal(DeliveryState.Pending, result.State);
        Assert.Equal("Delivery queued from mandatory safety policy.", result.Reason);
        Assert.False(result.IsAuthoritativeTradingState);
        Assert.False(result.CreatesLiveAuthority);
    }

    [Fact]
    public void MandatorySafetyPolicyStillRequiresConfiguredSeverity()
    {
        var result = MandatorySafetyService().Queue(Event(NotificationSeverity.Warning), NotificationChannel.InApp, "mandatory-1");

        Assert.Equal(DeliveryState.Suppressed, result.State);
    }

    [Fact]
    public void MandatorySafetyPolicyDoesNotExpandToUnconfiguredChannel()
    {
        var result = MandatorySafetyService().Queue(Event(NotificationSeverity.HardBlock), NotificationChannel.Email, "mandatory-1");

        Assert.Equal(DeliveryState.Suppressed, result.State);
    }

    [Fact]
    public void MandatorySafetyPolicyRequiresExactEventType()
    {
        var otherEvent = new NotificationEvent(Guid.NewGuid(), UserId, null, "risk.warning", NotificationSeverity.HardBlock,
            "Risk warning requires review", "audit/event/other", Now, "corr-notify-other");

        Assert.Equal(DeliveryState.Suppressed,
            MandatorySafetyService().Queue(otherEvent, NotificationChannel.InApp, "mandatory-1").State);
    }

    [Fact]
    public void MandatorySafetyPolicyRejectsDuplicateEventChannelRules()
    {
        Assert.Throws<ArgumentException>(() => new NotificationSafetyPolicy([
            new("risk.breach", NotificationSeverity.Warning, NotificationChannel.InApp),
            new("risk.breach", NotificationSeverity.HardBlock, NotificationChannel.InApp),
        ]));
    }

    [Fact]
    public void ChannelPreferencesAreIndependent()
    {
        var service = Service();
        service.SetPreference(new(UserId, NotificationChannel.InApp, "risk.breach", NotificationSeverity.Warning, true));
        Assert.Equal(DeliveryState.Pending, service.Queue(Event(), NotificationChannel.InApp, "in-app").State);
        Assert.Equal(DeliveryState.Suppressed, service.Queue(Event(), NotificationChannel.Email, "email").State);
    }

    [Fact]
    public void ExactIdempotentReplayReturnsOriginalAttempt()
    {
        var service = Service();
        service.SetPreference(new(UserId, NotificationChannel.InApp, "risk.breach", NotificationSeverity.Warning, true));
        var first = service.Queue(Event(), NotificationChannel.InApp, "notify-1");
        var replay = service.Queue(Event(), NotificationChannel.InApp, "notify-1");
        Assert.Equal(first, replay);
        Assert.Single(service.GetAudit(UserId));
    }

    [Fact]
    public void ChangedEventOrChannelWithSameKeyConflicts()
    {
        var service = Service();
        service.Queue(Event(), NotificationChannel.InApp, "notify-1");
        Assert.Throws<InvalidOperationException>(() => service.Queue(Event() with { }, NotificationChannel.Email, "notify-1"));
        Assert.Throws<InvalidOperationException>(() => service.Queue(NewEvent(), NotificationChannel.InApp, "notify-1"));
    }

    [Fact]
    public void ChangedEventContentWithSameIdentityAndKeyConflicts()
    {
        var service = Service();
        service.Queue(Event(), NotificationChannel.InApp, "notify-1");

        var changed = new NotificationEvent(Event().EventId, UserId, null, "risk.breach", NotificationSeverity.HardBlock,
            "Changed risk breach", "audit/event/changed", Now, "corr-notify-changed");

        Assert.Throws<InvalidOperationException>(() => service.Queue(changed, NotificationChannel.InApp, "notify-1"));
    }

    [Fact]
    public void UndefinedEnumsAndNonUtcOrFutureEventsFailClosed()
    {
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new NotificationPreference(UserId, (NotificationChannel)99, "risk.breach", NotificationSeverity.Warning, true));
        Assert.Throws<ArgumentOutOfRangeException>(() =>
            new NotificationPreference(UserId, NotificationChannel.InApp, "risk.breach", (NotificationSeverity)99, true));
        Assert.Throws<ArgumentException>(() => new NotificationEvent(Guid.NewGuid(), UserId, null, "risk.breach",
            NotificationSeverity.Warning, "Risk breach", "audit/event/utc", Now.ToOffset(TimeSpan.FromHours(1)), "corr"));
        Assert.Throws<InvalidOperationException>(() => Service().Queue(
            new NotificationEvent(Guid.NewGuid(), UserId, null, "risk.breach", NotificationSeverity.Warning,
                "Risk breach", "audit/event/future", Now.AddMinutes(1), "corr"), NotificationChannel.InApp, "future"));
    }

    [Fact]
    public void DeliveredResultRedactsProviderReceipt()
    {
        var service = ReadyService();
        var pending = service.Queue(Event(), NotificationChannel.Email, "notify-1");
        var delivered = service.RecordResult(pending.AttemptId, true, "provider-receipt-123456", "accepted");
        Assert.Equal(DeliveryState.Delivered, delivered.State);
        Assert.Equal("prov…3456", delivered.ProviderReceipt);
        Assert.Equal(1, delivered.AttemptNumber);
    }

    [Fact]
    public void FailureCanBeRetriedAndThenDelivered()
    {
        var service = ReadyService();
        var pending = service.Queue(Event(), NotificationChannel.Email, "notify-1");
        var failed = service.RecordResult(pending.AttemptId, false, null, "synthetic timeout");
        var delivered = service.RecordResult(pending.AttemptId, true, "receipt-12345678", "accepted on retry");
        Assert.Equal(DeliveryState.Failed, failed.State);
        Assert.Equal(2, delivered.AttemptNumber);
        Assert.Equal(DeliveryState.Delivered, delivered.State);
    }

    [Fact]
    public void DeliveredResultIsTerminalAndReplaySafe()
    {
        var service = ReadyService();
        var pending = service.Queue(Event(), NotificationChannel.Email, "notify-1");
        var delivered = service.RecordResult(pending.AttemptId, true, "receipt-12345678", "accepted");
        Assert.Equal(delivered, service.RecordResult(pending.AttemptId, false, null, "late failure"));
    }

    [Fact]
    public void SuppressedAttemptCannotReceiveProviderResult()
    {
        var service = Service();
        var suppressed = service.Queue(Event(), NotificationChannel.Email, "notify-1");
        Assert.Throws<InvalidOperationException>(() => service.RecordResult(suppressed.AttemptId, true, "receipt", "invalid"));
    }

    [Fact]
    public void EventRejectsDirectAddressAndTokenMaterial()
    {
        Assert.Throws<ArgumentException>(() => new NotificationEvent(Guid.NewGuid(), UserId, null, "risk.breach", NotificationSeverity.Warning,
            "send to user@example.com", "audit/ref", Now, "corr"));
        Assert.Throws<ArgumentException>(() => new NotificationEvent(Guid.NewGuid(), UserId, null, "risk.breach", NotificationSeverity.Warning,
            "Risk breach", "token=secret", Now, "corr"));
    }

    [Fact]
    public void ResultAuditRejectsSensitiveOrRegressingEvidence()
    {
        var service = ReadyService();
        var pending = service.Queue(Event(), NotificationChannel.Email, "notify-1");
        Assert.Throws<ArgumentException>(() => service.RecordResult(pending.AttemptId, false, null, "token leaked"));

        var current = Now;
        var regressing = new NotificationService(new InMemoryNotificationStore(), () => current);
        regressing.SetPreference(new(UserId, NotificationChannel.Email, "risk.breach", NotificationSeverity.Warning, true));
        var regressingAttempt = regressing.Queue(Event(), NotificationChannel.Email, "notify-2");
        current = Now.AddMinutes(-1);
        Assert.Throws<InvalidOperationException>(() =>
            regressing.RecordResult(regressingAttempt.AttemptId, false, null, "synthetic timeout"));
    }

    private static NotificationService Service() => new(new InMemoryNotificationStore(), () => Now);
    private static NotificationService ReadyService()
    {
        var service = Service();
        service.SetPreference(new(UserId, NotificationChannel.Email, "risk.breach", NotificationSeverity.Warning, true));
        return service;
    }
    private static NotificationService MandatorySafetyService() => new(
        new InMemoryNotificationStore(),
        () => Now,
        new NotificationSafetyPolicy([
            new MandatoryNotificationRule("risk.breach", NotificationSeverity.HardBlock, NotificationChannel.InApp),
        ]));
    private static NotificationEvent Event(NotificationSeverity severity = NotificationSeverity.Warning) =>
        new(Guid.Parse("20000000-0000-0000-0000-000000000002"), UserId, null, "risk.breach", severity,
            "Risk breach requires review", "audit/event/2000", Now, "corr-notify-1");
    private static NotificationEvent NewEvent() => new(Guid.NewGuid(), UserId, null, "risk.breach", NotificationSeverity.Warning,
        "Another risk breach", "audit/event/new", Now, "corr-notify-2");
}
