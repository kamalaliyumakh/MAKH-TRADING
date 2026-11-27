using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace MAKH.Application.Reconciliation;

public sealed class ReconciliationService(IReconciliationStore store, decimal cashTolerance = 0m)
{
    public ReconciliationRun Reconcile(AccountReconciliationSnapshot platform, AccountReconciliationSnapshot broker, DateTimeOffset completedAt)
    {
        ArgumentNullException.ThrowIfNull(platform);
        ArgumentNullException.ThrowIfNull(broker);
        if (platform.AccountId != broker.AccountId) throw new InvalidOperationException("Snapshot account scopes do not match.");
        ArgumentOutOfRangeException.ThrowIfNegative(cashTolerance);
        RequireUtc(completedAt, nameof(completedAt));
        if (completedAt < platform.AsOf || completedAt < broker.AsOf) throw new ArgumentException("Completion cannot predate a source snapshot.");
        var platformContentHash = ContentHash(platform);
        var brokerContentHash = ContentHash(broker);

        return store.Execute(state =>
        {
            var current = GetOrCreate(state, platform.AccountId);
            var previous = state.Runs.LastOrDefault(run => run.AccountId == platform.AccountId);
            if (current.LastCompletedAt is not null && completedAt < current.LastCompletedAt)
                throw new InvalidOperationException("Reconciliation completion chronology cannot regress.");
            if (previous is not null &&
                platform.AsOf == previous.PlatformAsOf && broker.AsOf == previous.BrokerAsOf &&
                string.Equals(platform.SourceChecksum, previous.PlatformChecksum, StringComparison.Ordinal) &&
                string.Equals(broker.SourceChecksum, previous.BrokerChecksum, StringComparison.Ordinal) &&
                string.Equals(platformContentHash, previous.PlatformContentHash, StringComparison.Ordinal) &&
                string.Equals(brokerContentHash, previous.BrokerContentHash, StringComparison.Ordinal))
                return previous;

            var items = Compare(platform, broker);
            var platformFence = FirstObservedFence(state.Runs, platform.AccountId, true);
            var brokerFence = FirstObservedFence(state.Runs, platform.AccountId, false);
            var freshnessFailure = Conflicts(platform, platformContentHash, platformFence) ||
                Conflicts(broker, brokerContentHash, brokerFence);
            var outcome = !platform.StateKnown || !broker.StateKnown || freshnessFailure
                ? ReconciliationOutcome.Unknown
                : items.Count == 0 ? ReconciliationOutcome.Matched : ReconciliationOutcome.Mismatch;
            if (outcome == ReconciliationOutcome.Unknown)
                items.Insert(0, new(ReconciliationEntityType.Snapshot, platform.AccountId.ToString(), "StateKnown",
                    platform.StateKnown.ToString(), broker.StateKnown.ToString(), freshnessFailure
                        ? "A source snapshot is stale or conflicts at an already observed timestamp."
                        : "A source snapshot is unknown or incomplete."));
            var sequence = checked(current.Sequence + 1);
            var run = new ReconciliationRun(Guid.NewGuid(), platform.AccountId,
                platform.AsOf < broker.AsOf ? platform.AsOf : broker.AsOf, completedAt,
                platform.AsOf, broker.AsOf,
                platform.SourceChecksum, broker.SourceChecksum, platformContentHash, brokerContentHash,
                outcome, items.ToArray(), sequence, outcome != ReconciliationOutcome.Matched);
            state.Runs.Add(run);
            state.Accounts[platform.AccountId] = new(platform.AccountId, outcome, run.EntryBlocked,
                outcome == ReconciliationOutcome.Matched ? "Latest broker comparison matched." : "Trading entry is locked pending a clean reconciliation.",
                sequence, run.RunId, completedAt);
            return run;
        });
    }

    public AccountReconciliationState GetState(Guid accountId) => store.Execute(state => GetOrCreate(state, accountId));

    public IReadOnlyList<ReconciliationRun> GetRuns(Guid accountId) => store.Execute(state =>
        state.Runs.Where(run => run.AccountId == accountId).ToArray());

    private List<ReconciliationItem> Compare(AccountReconciliationSnapshot platform, AccountReconciliationSnapshot broker)
    {
        var items = new List<ReconciliationItem>();
        CompareMoney(items, "Cash", platform.Cash, broker.Cash);
        CompareMoney(items, "BuyingPower", platform.BuyingPower, broker.BuyingPower);
        var platformOrders = platform.Orders.ToDictionary(item => item.ClientOrderId, StringComparer.Ordinal);
        var brokerOrders = broker.Orders.ToDictionary(item => item.ClientOrderId, StringComparer.Ordinal);
        foreach (var id in platformOrders.Keys.Union(brokerOrders.Keys, StringComparer.Ordinal).Order())
        {
            platformOrders.TryGetValue(id, out var left);
            brokerOrders.TryGetValue(id, out var right);
            if (left is null || right is null) Add(items, ReconciliationEntityType.Order, id, "Presence", left is null ? "Missing" : "Present", right is null ? "Missing" : "Present");
            else
            {
                if (left.State != right.State) Add(items, ReconciliationEntityType.Order, id, "State", left.State, right.State);
                if (left.Quantity != right.Quantity) Add(items, ReconciliationEntityType.Order, id, "Quantity", left.Quantity, right.Quantity);
                if (left.FilledQuantity != right.FilledQuantity) Add(items, ReconciliationEntityType.Order, id, "FilledQuantity", left.FilledQuantity, right.FilledQuantity);
            }
        }
        var platformPositions = platform.Positions.ToDictionary(item => item.SecurityId);
        var brokerPositions = broker.Positions.ToDictionary(item => item.SecurityId);
        foreach (var id in platformPositions.Keys.Union(brokerPositions.Keys).Order())
        {
            var left = platformPositions.GetValueOrDefault(id)?.Quantity ?? 0;
            var right = brokerPositions.GetValueOrDefault(id)?.Quantity ?? 0;
            if (left != right) Add(items, ReconciliationEntityType.Position, id.ToString(), "Quantity", left, right);
        }
        return items;
    }

    private void CompareMoney(List<ReconciliationItem> items, string field, decimal platform, decimal broker)
    {
        if (Math.Abs(platform - broker) > cashTolerance) Add(items, ReconciliationEntityType.Cash, "account", field, platform, broker);
    }

    private static void Add(List<ReconciliationItem> items, ReconciliationEntityType type, string id, string field, object platform, object broker) =>
        items.Add(new(type, id, field, Convert.ToString(platform, CultureInfo.InvariantCulture)!, Convert.ToString(broker, CultureInfo.InvariantCulture)!, "Platform and broker values differ."));

    private static AccountReconciliationState GetOrCreate(ReconciliationLedgerState state, Guid accountId)
    {
        if (accountId == Guid.Empty) throw new ArgumentException("Account ID is required.");
        return state.Accounts.TryGetValue(accountId, out var current) ? current
            : new(accountId, ReconciliationOutcome.Unknown, true, "No clean reconciliation has completed.", 0, null, null);
    }

    private sealed record SourceFence(DateTimeOffset AsOf, string Checksum, string ContentHash);

    private static SourceFence? FirstObservedFence(IEnumerable<ReconciliationRun> runs, Guid accountId, bool platform)
    {
        var scoped = runs.Where(run => run.AccountId == accountId).ToArray();
        if (scoped.Length == 0) return null;
        var maximum = platform ? scoped.Max(run => run.PlatformAsOf) : scoped.Max(run => run.BrokerAsOf);
        var first = scoped.Where(run => (platform ? run.PlatformAsOf : run.BrokerAsOf) == maximum)
            .OrderBy(run => run.Sequence).First();
        return platform
            ? new(first.PlatformAsOf, first.PlatformChecksum, first.PlatformContentHash)
            : new(first.BrokerAsOf, first.BrokerChecksum, first.BrokerContentHash);
    }

    private static bool Conflicts(AccountReconciliationSnapshot snapshot, string contentHash, SourceFence? fence) =>
        fence is not null && (snapshot.AsOf < fence.AsOf ||
            (snapshot.AsOf == fence.AsOf &&
             (!string.Equals(snapshot.SourceChecksum, fence.Checksum, StringComparison.Ordinal) ||
              !string.Equals(contentHash, fence.ContentHash, StringComparison.Ordinal))));

    private static string ContentHash(AccountReconciliationSnapshot snapshot)
    {
        var canonical = new StringBuilder();
        Add(canonical, snapshot.AccountId);
        Add(canonical, snapshot.AsOf);
        Add(canonical, snapshot.StateKnown);
        Add(canonical, snapshot.Cash);
        Add(canonical, snapshot.BuyingPower);
        foreach (var order in snapshot.Orders.OrderBy(item => item.ClientOrderId, StringComparer.Ordinal))
        {
            Add(canonical, order.ClientOrderId);
            Add(canonical, order.State);
            Add(canonical, order.Quantity);
            Add(canonical, order.FilledQuantity);
        }
        foreach (var position in snapshot.Positions.OrderBy(item => item.SecurityId))
        {
            Add(canonical, position.SecurityId);
            Add(canonical, position.Quantity);
        }
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(canonical.ToString()))).ToLowerInvariant();
    }

    private static void Add(StringBuilder target, object value)
    {
        var text = value is IFormattable formattable
            ? formattable.ToString(null, CultureInfo.InvariantCulture)
            : value.ToString() ?? string.Empty;
        target.Append(text.Length.ToString(CultureInfo.InvariantCulture)).Append(':').Append(text);
    }

    private static void RequireUtc(DateTimeOffset value, string name)
    {
        if (value == default || value.Offset != TimeSpan.Zero)
            throw new ArgumentException("Timestamp must be a non-default UTC value.", name);
    }
}
