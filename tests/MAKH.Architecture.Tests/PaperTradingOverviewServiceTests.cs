using MAKH.Application.Trading;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class PaperTradingOverviewServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 14, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void OverviewIsAccountBoundFailClosedAndNonAuthoritative()
    {
        var accountId = Guid.NewGuid();
        var result = new PaperTradingOverviewService().Overview(accountId, Now);

        Assert.Equal(accountId, result.AccountId);
        Assert.True(result.EntryLocked);
        Assert.Equal("Mismatch", result.Reconciliation);
        Assert.False(result.IsAuthoritative);
        Assert.False(result.CanSubmit);
        Assert.False(result.CreatesTradingAuthority);
        Assert.Equal(64, result.EvidenceSha256.Length);
    }

    [Fact]
    public void OverviewContainsBoundedSyntheticLifecycleEvidence()
    {
        var result = new PaperTradingOverviewService().Overview(Guid.NewGuid(), Now);

        Assert.Equal(2, result.Orders.Count);
        Assert.Equal(2, result.Positions.Count);
        Assert.All(result.Orders, order => Assert.InRange(order.Filled, 0, order.Quantity));
        Assert.Contains(result.Orders, order => order.State == "Partially filled");
        Assert.Contains(result.Positions, position => position.Protection == "Under-protected");
    }

    [Fact]
    public void EmptyAccountIsRejected() =>
        Assert.Throws<ArgumentException>(() => new PaperTradingOverviewService().Overview(Guid.Empty, Now));

    [Fact]
    public void ReviewEnforcesGuardrailsAndNeverEnablesSubmission()
    {
        var request = Request();
        var result = new PaperTradingOverviewService().Review(request, Now);

        Assert.Equal(525m, result.EstimatedNotional);
        Assert.True(result.EntryLocked);
        Assert.False(result.CanSubmit);
        Assert.False(result.CreatesTradingAuthority);
        Assert.False(result.MutatesTradingState);
        Assert.Equal(Now.AddMinutes(2), result.ExpiresAt);
        Assert.Equal(64, result.EvidenceSha256.Length);
    }

    [Fact]
    public void ExactReviewReplayIsIdempotent()
    {
        var service = new PaperTradingOverviewService();
        var request = Request();
        Assert.Equal(service.Review(request, Now), service.Review(request, Now.AddMinutes(1)));
    }

    [Fact]
    public void ChangedReviewIntentIsRejected()
    {
        var service = new PaperTradingOverviewService();
        var request = Request();
        service.Review(request, Now);
        var changed = new PaperOrderReviewRequest(request.RequestId, request.AccountId, "SYNB", "Buy", 101, 5.25m, 4.75m);
        Assert.Throws<InvalidOperationException>(() => service.Review(changed, Now));
    }

    [Theory]
    [InlineData(500001, 5.25)]
    [InlineData(100, 2.99)]
    [InlineData(100, 7.01)]
    public void ReviewRejectsOutOfScopeQuantityOrPrice(long quantity, decimal price) =>
        Assert.ThrowsAny<ArgumentException>(() => new PaperOrderReviewRequest(Guid.NewGuid(), Guid.NewGuid(),
            "SYNB", "Buy", quantity, price, 4.75m));

    private static PaperOrderReviewRequest Request() =>
        new(Guid.NewGuid(), Guid.NewGuid(), "synb", "Buy", 100, 5.25m, 4.75m);
}
