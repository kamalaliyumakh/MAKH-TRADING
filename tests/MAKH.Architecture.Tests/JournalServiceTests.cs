using MAKH.Application.Common.Ports;
using MAKH.Application.Journal;
using MAKH.Infrastructure.Journal;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class JournalServiceTests
{
    private static readonly JournalScope Scope = new(Guid.Parse("11111111-2222-3333-4444-555555555555"), Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"));
    private static readonly Guid SecurityId = Guid.Parse("99999999-8888-7777-6666-555555555555");

    [Fact]
    public void ContentRequiresThesisAndPlan() => Assert.Throws<ArgumentException>(() => Content(thesis: " "));

    [Fact]
    public void ContentNormalizesAndDeduplicatesTags()
    {
        var content = Content(tags: [" Momentum ", "momentum", "Review"]);
        Assert.Equal(["momentum", "review"], content.Tags);
    }

    [Fact]
    public void JournalContentHasNoTradingAuthority()
    {
        var content = Content();
        Assert.False(content.CanAuthorizeTrade);
        Assert.False(content.CanChangeRiskState);
        Assert.False(content.CanChangeBrokerState);
    }

    [Fact]
    public void CreateProducesDraftAndAppendOnlyAuditEvent()
    {
        var (service, _) = CreateService();
        var entry = service.Create(Scope, SecurityId, Content(), "Initial thesis", "corr-1");
        var audit = service.AuditTrail(Scope, entry.EntryId);
        Assert.Equal(JournalEntryState.Draft, entry.State);
        Assert.Equal(1, entry.Version);
        Assert.Single(audit);
        Assert.Equal(JournalAuditAction.Created, audit[0].Action);
        Assert.Null(audit[0].BeforeSha256);
        Assert.Equal(64, audit[0].AfterSha256.Length);
    }

    [Fact]
    public void UpdateIncrementsVersionAndRetainsAuditHistory()
    {
        var (service, clock) = CreateService();
        var entry = service.Create(Scope, SecurityId, Content(), "Initial", "corr-1");
        clock.Advance();
        var updated = service.Update(Scope, entry.EntryId, 1, Content(thesis: "Revised thesis"), "New evidence", "corr-2");
        var audit = service.AuditTrail(Scope, entry.EntryId);
        Assert.Equal(2, updated.Version);
        Assert.Equal("Revised thesis", updated.Content.Thesis);
        Assert.Equal(2, audit.Count);
        Assert.Equal(audit[0].AfterSha256, audit[1].BeforeSha256);
        Assert.NotEqual(audit[1].BeforeSha256, audit[1].AfterSha256);
    }

    [Fact]
    public void UpdateRejectsStaleVersion()
    {
        var (service, _) = CreateService();
        var entry = service.Create(Scope, SecurityId, Content(), "Initial", "corr-1");
        Assert.Throws<InvalidOperationException>(() =>
            service.Update(Scope, entry.EntryId, 99, Content(), "Conflict", "corr-2"));
    }

    [Fact]
    public void ReviewRequiresOutcome()
    {
        var (service, _) = CreateService();
        var entry = service.Create(Scope, SecurityId, Content(outcome: ""), "Initial", "corr-1");
        Assert.Throws<InvalidOperationException>(() => service.MarkReviewed(Scope, entry.EntryId, 1, "Review", "corr-2"));
    }

    [Fact]
    public void ReviewedEntryCapturesTransitionAudit()
    {
        var (service, _) = CreateService();
        var entry = service.Create(Scope, SecurityId, Content(), "Initial", "corr-1");
        var reviewed = service.MarkReviewed(Scope, entry.EntryId, 1, "Outcome reviewed", "corr-2");
        Assert.Equal(JournalEntryState.Reviewed, reviewed.State);
        Assert.Equal(JournalAuditAction.Reviewed, service.AuditTrail(Scope, entry.EntryId)[1].Action);
    }

    [Fact]
    public void ArchiveRemovesEntryFromDefaultListWithoutDeletingHistory()
    {
        var (service, _) = CreateService();
        var entry = service.Create(Scope, SecurityId, Content(), "Initial", "corr-1");
        service.Archive(Scope, entry.EntryId, 1, "No longer active", "corr-2");
        Assert.Empty(service.List(Scope));
        Assert.Single(service.List(Scope, includeArchived: true));
        Assert.Equal(2, service.AuditTrail(Scope, entry.EntryId).Count);
    }

    [Fact]
    public void ArchivedEntryCannotBeUpdated()
    {
        var (service, _) = CreateService();
        var entry = service.Create(Scope, SecurityId, Content(), "Initial", "corr-1");
        service.Archive(Scope, entry.EntryId, 1, "Archive", "corr-2");
        Assert.Throws<InvalidOperationException>(() =>
            service.Update(Scope, entry.EntryId, 2, Content(), "Edit", "corr-3"));
    }

    [Fact]
    public void CrossAccountOrUserAccessFailsClosed()
    {
        var (service, _) = CreateService();
        var entry = service.Create(Scope, SecurityId, Content(), "Initial", "corr-1");
        var other = new JournalScope(Guid.NewGuid(), Scope.UserId);
        Assert.Throws<UnauthorizedAccessException>(() => service.Get(other, entry.EntryId));
    }

    [Fact]
    public void ReasonAndCorrelationAreRequired()
    {
        var (service, _) = CreateService();
        Assert.Throws<ArgumentException>(() => service.Create(Scope, SecurityId, Content(), " ", "corr-1"));
        Assert.Throws<ArgumentException>(() => service.Create(Scope, SecurityId, Content(), "Initial", " "));
    }

    private static JournalEntryContent Content(
        string thesis = "Volume expansion may warrant review.",
        string outcome = "The synthetic setup was reviewed without execution.",
        IEnumerable<string>? tags = null) => new(
            thesis,
            "Wait for verified catalyst, current quote and approved risk result.",
            outcome,
            tags ?? ["synthetic", "review"],
            [Guid.Parse("10000000-0000-0000-0000-000000000001")]);

    private static (JournalService Service, TestClock Clock) CreateService()
    {
        var clock = new TestClock();
        return (new JournalService(new InMemoryJournalRepository(), clock), clock);
    }

    private sealed class TestClock : IClock
    {
        public DateTimeOffset UtcNow { get; private set; } = new(2026, 8, 12, 17, 0, 0, TimeSpan.Zero);
        public void Advance() => UtcNow = UtcNow.AddMinutes(1);
    }
}
