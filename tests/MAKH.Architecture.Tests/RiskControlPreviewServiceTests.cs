using MAKH.Application.Risk;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class RiskControlPreviewServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 14, 12, 0, 0, TimeSpan.Zero);
    private readonly RiskControlPreviewService service = new();

    [Fact]
    public void SnapshotIsFailClosedAndHasEvidence()
    {
        var result = service.Snapshot(Guid.NewGuid(), "policy-v1", Now);
        Assert.True(result.EntryLocked);
        Assert.False(result.ReconciliationHealthy);
        Assert.False(result.CreatesTradingAuthority);
        Assert.Equal(64, result.StateSha256.Length);
    }

    [Theory]
    [InlineData(ContainmentAction.BlockEntries, false)]
    [InlineData(ContainmentAction.CancelOpenOrders, true)]
    [InlineData(ContainmentAction.LiquidatePositions, true)]
    public void PreviewNeverEnablesFinalConfirmationOrMutation(ContainmentAction action, bool reconciliation)
    {
        var result = service.Preview(Request(action), Now);
        Assert.True(result.EntryLocked);
        Assert.Equal(reconciliation, result.ReconciliationRequired);
        Assert.False(result.FinalConfirmationEnabled);
        Assert.False(result.CreatesTradingAuthority);
        Assert.False(result.MutatesTradingState);
        Assert.Equal(64, result.EvidenceSha256.Length);
    }

    [Fact]
    public void ExactReplayIsIdempotent()
    {
        var request = Request(ContainmentAction.CancelOpenOrders);
        Assert.Equal(service.Preview(request, Now), service.Preview(request, Now.AddMinutes(1)));
    }

    [Fact]
    public void ChangedIntentWithSameCommandIdIsRejected()
    {
        var id = Guid.NewGuid();
        service.Preview(Request(ContainmentAction.BlockEntries, id), Now);
        Assert.Throws<InvalidOperationException>(() => service.Preview(Request(ContainmentAction.LiquidatePositions, id), Now));
    }

    [Fact]
    public void ChangedReasonOrCorrelationWithSameCommandIdIsRejected()
    {
        var id = Guid.NewGuid();
        var original = Request(ContainmentAction.BlockEntries, id);
        service.Preview(original, Now);

        var changedReason = new ContainmentPreviewRequest(id, original.AccountId, original.Action,
            original.ExpectedPolicyVersion, "different containment reason", original.CorrelationId);
        var changedCorrelation = new ContainmentPreviewRequest(id, original.AccountId, original.Action,
            original.ExpectedPolicyVersion, original.Reason, "different-correlation");

        Assert.Throws<InvalidOperationException>(() => service.Preview(changedReason, Now));
        Assert.Throws<InvalidOperationException>(() => service.Preview(changedCorrelation, Now));
    }

    [Fact]
    public void UndefinedContainmentActionIsRejected() =>
        Assert.Throws<ArgumentOutOfRangeException>(() => new ContainmentPreviewRequest(Guid.NewGuid(),
            Guid.NewGuid(), (ContainmentAction)99, RiskControlPreviewService.CurrentPolicyVersion,
            "synthetic containment review", "corr-1"));

    [Fact]
    public void SensitiveReasonIsRejected() =>
        Assert.Throws<ArgumentException>(() => new ContainmentPreviewRequest(Guid.NewGuid(), Guid.NewGuid(),
            ContainmentAction.BlockEntries, "v1", "rotate secret now", "corr"));

    [Fact]
    public void StalePolicyVersionIsRejectedBeforePreviewCreation()
    {
        var request = new ContainmentPreviewRequest(Guid.NewGuid(), Guid.NewGuid(),
            ContainmentAction.BlockEntries, "stale-policy", "synthetic containment review", "corr-1");

        Assert.Throws<InvalidOperationException>(() => service.Preview(request, Now));
    }

    [Fact]
    public void OverviewProvidesFailClosedLimitsPausesAndBreaches()
    {
        var accountId = Guid.NewGuid();
        var result = service.Overview(accountId, Now);

        Assert.Equal(accountId, result.AccountId);
        Assert.True(result.EntryLocked);
        Assert.False(result.ReconciliationHealthy);
        Assert.False(result.CanMutateRisk);
        Assert.False(result.CreatesTradingAuthority);
        Assert.Equal(4, result.Limits.Count);
        Assert.Equal(2, result.ActivePauses.Count);
        Assert.Equal(2, result.OpenBreaches.Count);
        Assert.All(result.ActivePauses, pause => Assert.Equal(64, pause.EvidenceSha256.Length));
        Assert.All(result.OpenBreaches, breach => Assert.Equal(64, breach.EvidenceSha256.Length));
        Assert.Equal(64, result.EvidenceSha256.Length);
    }

    [Fact]
    public void LimitCapacityIsBoundedAndAuditable()
    {
        var result = service.Overview(Guid.NewGuid(), Now);
        var dailyLoss = result.Limits.Single(limit => limit.Code == "daily-loss");

        Assert.Equal(650m, dailyLoss.Remaining);
        Assert.False(dailyLoss.Exceeded);
        Assert.All(result.Limits, limit => Assert.True(limit.Limit > 0m));
    }

    [Theory]
    [InlineData(ContainmentAction.BlockEntries, 0, 0, 0)]
    [InlineData(ContainmentAction.CancelOpenOrders, 3, 0, 0)]
    [InlineData(ContainmentAction.LiquidatePositions, 3, 2, 8400)]
    public void PreviewSeparatesSyntheticImpactByAction(ContainmentAction action, int orders,
        int positions, int grossNotional)
    {
        var impact = service.Preview(Request(action), Now).Impact;

        Assert.Equal(orders, impact.OpenOrdersAffected);
        Assert.Equal(positions, impact.PositionsAffected);
        Assert.Equal(grossNotional, impact.EstimatedGrossNotional);
        Assert.Equal("synthetic-read-model", impact.Source);
        Assert.NotEmpty(impact.Warnings);
        Assert.False(impact.IsAuthoritative);
        Assert.False(impact.CanExecute);
        Assert.Equal(64, impact.EvidenceSha256.Length);
    }

    private static ContainmentPreviewRequest Request(ContainmentAction action, Guid? id = null) =>
        new(id ?? Guid.NewGuid(), Guid.NewGuid(), action, RiskControlPreviewService.CurrentPolicyVersion,
            "synthetic containment review", "corr-1");
}
