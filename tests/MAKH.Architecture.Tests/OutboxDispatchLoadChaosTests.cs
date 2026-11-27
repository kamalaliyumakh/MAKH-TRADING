using System.Collections.Concurrent;
using System.Diagnostics;
using MAKH.Application.Common;
using Xunit;

namespace MAKH.Architecture.Tests;

public sealed class OutboxDispatchLoadChaosTests
{
    private const int AccountCount = 100;
    private const int MessagesPerAccount = 20;
    private const int WorkerCount = 8;
    private static readonly DateTimeOffset StartedAt = new(2026, 9, 16, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task ConcurrentDispatchPreservesAccountOrderAndRecoversInjectedFailures()
    {
        var deliveries = Enumerable.Range(0, AccountCount)
            .SelectMany(account => Enumerable.Range(1, MessagesPerAccount)
                .Select(sequence => Delivery(account, sequence)))
            .ToArray();
        var store = new LeasedChaosStore(deliveries);
        var publisher = new FailOncePublisher(deliveries
            .Where((_, index) => index % 17 == 0)
            .Select(delivery => delivery.Id));
        var stopwatch = Stopwatch.StartNew();
        var logicalTick = 0L;

        await Task.WhenAll(Enumerable.Range(0, WorkerCount).Select(worker => Task.Run(async () =>
        {
            var dispatcher = new OutboxDispatcher(store, publisher);
            while (store.PublishedCount < deliveries.Length)
            {
                var now = StartedAt.AddSeconds(Interlocked.Increment(ref logicalTick) * 10);
                await dispatcher.DispatchOnceAsync(
                    $"load-worker-{worker}", now, TimeSpan.FromDays(1), 25);
                await Task.Yield();
            }
        })));
        stopwatch.Stop();

        Assert.Equal(deliveries.Length, store.PublishedCount);
        Assert.Equal(118, publisher.InjectedFailures);
        Assert.Equal(deliveries.Length + 118, publisher.Attempts);
        Assert.Equal(0, store.LeaseOwnershipViolations);
        Assert.True(stopwatch.Elapsed < TimeSpan.FromSeconds(10));
        foreach (var account in deliveries.Select(delivery => delivery.AccountId).Distinct())
        {
            Assert.Equal(
                Enumerable.Range(1, MessagesPerAccount).Select(value => (long)value),
                publisher.SuccessfulSequences(account));
        }
    }

    private static OutboxDelivery Delivery(int account, int sequence)
    {
        var accountId = Guid.Parse($"00000000-0000-0000-{account + 1:x4}-000000000001");
        var messageId = Guid.Parse($"10000000-{account + 1:x4}-{sequence:x4}-0000-000000000001");
        return new(
            messageId, accountId, "scanner.updated", 1, sequence, 0,
            StartedAt.AddMilliseconds(account * MessagesPerAccount + sequence), "{}");
    }

    private sealed class FailOncePublisher(IEnumerable<Guid> failOnceIds) : IOutboxPublisher
    {
        private readonly ConcurrentDictionary<Guid, byte> failuresRemaining =
            new(failOnceIds.Select(id => new KeyValuePair<Guid, byte>(id, 1)));
        private readonly ConcurrentDictionary<Guid, ConcurrentQueue<long>> successful = new();
        private int attempts;
        private int injectedFailures;

        public int Attempts => attempts;
        public int InjectedFailures => injectedFailures;

        public async Task PublishAsync(OutboxDelivery delivery, CancellationToken cancellationToken)
        {
            Interlocked.Increment(ref attempts);
            await Task.Yield();
            if (failuresRemaining.TryRemove(delivery.Id, out _))
            {
                Interlocked.Increment(ref injectedFailures);
                throw new TimeoutException("Injected transient publication failure.");
            }

            successful.GetOrAdd(delivery.AccountId, _ => new()).Enqueue(delivery.StreamSequence);
        }

        public long[] SuccessfulSequences(Guid accountId) =>
            successful.TryGetValue(accountId, out var sequences) ? sequences.ToArray() : [];
    }

    private sealed class LeasedChaosStore(IEnumerable<OutboxDelivery> deliveries) : IOutboxStore
    {
        private readonly object sync = new();
        private readonly Dictionary<Guid, State> states = deliveries.ToDictionary(
            delivery => delivery.Id, delivery => new State(delivery));
        private int leaseOwnershipViolations;

        public int PublishedCount
        {
            get { lock (sync) return states.Values.Count(state => state.Published); }
        }

        public int LeaseOwnershipViolations => leaseOwnershipViolations;

        public Task<IReadOnlyList<OutboxDelivery>> ClaimNextAsync(
            string owner, DateTimeOffset now, TimeSpan leaseDuration, int limit,
            CancellationToken cancellationToken)
        {
            lock (sync)
            {
                var claimed = states.Values
                    .Where(state => !state.Published
                        && state.NextAttemptAt <= now
                        && (state.LeaseUntil is null || state.LeaseUntil <= now)
                        && !states.Values.Any(earlier =>
                            !earlier.Published
                            && earlier.Delivery.AccountId == state.Delivery.AccountId
                            && earlier.Delivery.EventType == state.Delivery.EventType
                            && earlier.Delivery.StreamSequence < state.Delivery.StreamSequence))
                    .OrderBy(state => state.Delivery.OccurredAt)
                    .Take(limit)
                    .ToArray();
                foreach (var state in claimed)
                {
                    state.LeaseOwner = owner;
                    state.LeaseUntil = now.Add(leaseDuration);
                    state.AttemptCount++;
                }

                return Task.FromResult<IReadOnlyList<OutboxDelivery>>(claimed
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

        public Task MarkFailedAsync(Guid messageId, string owner, DateTimeOffset nextAttemptAt,
            string errorMessage, CancellationToken cancellationToken)
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

        private sealed class State(OutboxDelivery delivery)
        {
            public OutboxDelivery Delivery { get; } = delivery;
            public int AttemptCount { get; set; }
            public bool Published { get; set; }
            public string? LeaseOwner { get; set; }
            public DateTimeOffset? LeaseUntil { get; set; }
            public DateTimeOffset NextAttemptAt { get; set; } = delivery.OccurredAt;
        }
    }
}
