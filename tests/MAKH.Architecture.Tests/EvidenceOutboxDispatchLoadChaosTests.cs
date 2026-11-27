using System.Collections.Concurrent;
using System.Diagnostics;
using MAKH.Application.Evidence;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class EvidenceOutboxDispatchLoadChaosTests
{
    private const int MessageCount = 2_000;
    private const int WorkerCount = 8;
    private static readonly DateTimeOffset StartedAt = new(2026, 10, 1, 16, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task ConcurrentDispatchRecoversFailuresAndExpiredLeasesWithoutDuplicateCompletion()
    {
        var deliveries = Enumerable.Range(1, MessageCount).Select(Delivery).ToArray();
        var store = new LeasedChaosStore(deliveries);
        var publisher = new FailOncePublisher(deliveries
            .Where((_, index) => index % 17 == 0)
            .Select(delivery => delivery.Id));
        var logicalTick = 0L;
        var stopwatch = Stopwatch.StartNew();

        await Task.WhenAll(Enumerable.Range(0, WorkerCount).Select(worker => Task.Run(async () =>
        {
            var dispatcher = new EvidenceOutboxDispatcher(store, publisher);
            while (store.PublishedCount < deliveries.Length)
            {
                var now = StartedAt.AddSeconds(Interlocked.Increment(ref logicalTick) * 10);
                await dispatcher.DispatchOnceAsync(
                    $"evidence-load-{worker}", now, TimeSpan.FromDays(1), 25);
                await Task.Yield();
            }
        })));
        stopwatch.Stop();

        Assert.Equal(MessageCount, store.PublishedCount);
        Assert.Equal(118, publisher.InjectedFailures);
        Assert.Equal(MessageCount + 118, publisher.Attempts);
        Assert.Equal(MessageCount, publisher.SuccessfulIds.Length);
        Assert.Equal(0, store.LeaseOwnershipViolations);
        Assert.Equal(0, store.DuplicateCompletionAttempts);
        Assert.True(stopwatch.Elapsed < TimeSpan.FromSeconds(10));
    }

    private static EvidenceOutboxDelivery Delivery(int sequence) => new(
        Guid.Parse($"10000000-0000-{sequence:x4}-0000-000000000001"),
        Guid.Parse($"20000000-0000-{sequence:x4}-0000-000000000002"),
        "evidence.updated",
        1,
        0,
        StartedAt.AddMilliseconds(sequence),
        "{}");

    private sealed class FailOncePublisher(IEnumerable<Guid> failOnceIds) : IEvidenceOutboxPublisher
    {
        private readonly ConcurrentDictionary<Guid, byte> failuresRemaining =
            new(failOnceIds.Select(id => new KeyValuePair<Guid, byte>(id, 1)));
        private readonly ConcurrentDictionary<Guid, byte> successfulIds = new();
        private int attempts;
        private int injectedFailures;

        public int Attempts => attempts;
        public int InjectedFailures => injectedFailures;
        public Guid[] SuccessfulIds => successfulIds.Keys.ToArray();

        public async Task PublishAsync(EvidenceOutboxDelivery delivery, CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref attempts);
            await Task.Yield();
            if (failuresRemaining.TryRemove(delivery.Id, out _))
            {
                Interlocked.Increment(ref injectedFailures);
                throw new TimeoutException("Injected transient publication failure.");
            }

            if (!successfulIds.TryAdd(delivery.Id, 0))
                throw new InvalidOperationException("Duplicate terminal publication detected.");
        }
    }

    private sealed class LeasedChaosStore(IEnumerable<EvidenceOutboxDelivery> deliveries) : IEvidenceOutboxStore
    {
        private readonly object sync = new();
        private readonly Dictionary<Guid, State> states = deliveries
            .Select((delivery, index) => new State(delivery)
            {
                LeaseOwner = index % 23 == 0 ? "expired-worker" : null,
                LeaseUntil = index % 23 == 0 ? StartedAt.AddSeconds(-1) : null,
            })
            .ToDictionary(state => state.Delivery.Id);
        private int leaseOwnershipViolations;
        private int duplicateCompletionAttempts;

        public int PublishedCount
        {
            get { lock (sync) return states.Values.Count(state => state.Published); }
        }

        public int LeaseOwnershipViolations => leaseOwnershipViolations;
        public int DuplicateCompletionAttempts => duplicateCompletionAttempts;

        public Task<IReadOnlyList<EvidenceOutboxDelivery>> ClaimNextAsync(
            string owner,
            DateTimeOffset now,
            TimeSpan leaseDuration,
            int limit,
            CancellationToken cancellationToken)
        {
            lock (sync)
            {
                var claimed = states.Values
                    .Where(state => !state.Published
                        && state.NextAttemptAt <= now
                        && (state.LeaseUntil is null || state.LeaseUntil <= now))
                    .OrderBy(state => state.Delivery.OccurredAt)
                    .ThenBy(state => state.Delivery.Id)
                    .Take(limit)
                    .ToArray();
                foreach (var state in claimed)
                {
                    state.LeaseOwner = owner;
                    state.LeaseUntil = now.Add(leaseDuration);
                    state.AttemptCount++;
                }

                return Task.FromResult<IReadOnlyList<EvidenceOutboxDelivery>>(claimed
                    .Select(state => state.Delivery with { AttemptCount = state.AttemptCount })
                    .ToArray());
            }
        }

        public Task MarkPublishedAsync(
            Guid messageId, string owner, DateTimeOffset publishedAt, CancellationToken cancellationToken)
        {
            lock (sync)
            {
                var state = states[messageId];
                if (state.Published) duplicateCompletionAttempts++;
                if (state.LeaseOwner != owner || state.Published)
                {
                    leaseOwnershipViolations++;
                    throw new InvalidOperationException("Lease ownership lost.");
                }

                state.Published = true;
                state.LeaseOwner = null;
                state.LeaseUntil = null;
                return Task.CompletedTask;
            }
        }

        public Task MarkFailedAsync(
            Guid messageId,
            string owner,
            DateTimeOffset nextAttemptAt,
            string errorMessage,
            CancellationToken cancellationToken)
        {
            lock (sync)
            {
                var state = states[messageId];
                if (state.LeaseOwner != owner || state.Published)
                {
                    leaseOwnershipViolations++;
                    throw new InvalidOperationException("Lease ownership lost.");
                }

                state.NextAttemptAt = nextAttemptAt;
                state.LeaseOwner = null;
                state.LeaseUntil = null;
                return Task.CompletedTask;
            }
        }

        private sealed class State(EvidenceOutboxDelivery delivery)
        {
            public EvidenceOutboxDelivery Delivery { get; } = delivery;
            public int AttemptCount { get; set; }
            public bool Published { get; set; }
            public string? LeaseOwner { get; set; }
            public DateTimeOffset? LeaseUntil { get; set; }
            public DateTimeOffset NextAttemptAt { get; set; } = delivery.OccurredAt;
        }
    }
}
