using MAKH.Application.Broker;

namespace MAKH.Application.Positions;

public sealed class PositionLedgerService(IPositionLedgerStore store)
{
    public PositionSnapshot Apply(ExecutionFact fact)
    {
        ArgumentNullException.ThrowIfNull(fact);
        return store.Execute(state =>
        {
            var executionKey = (fact.Provider, fact.ProviderAccountReference, fact.ProviderExecutionId);
            if (state.Executions.TryGetValue(executionKey, out var existing))
                return existing == fact ? GetOrEmpty(state, fact.AccountId, fact.SecurityId) : throw new InvalidOperationException("Execution identity conflict.");

            var position = GetOrEmpty(state, fact.AccountId, fact.SecurityId);
            if (position.LastExecutionAt is not null && fact.ExecutedAt < position.LastExecutionAt)
                throw new InvalidOperationException("Execution chronology cannot regress within a position.");
            if (fact.Kind != ExecutionFactKind.Fill)
            {
                var correctedKey = (fact.Provider, fact.ProviderAccountReference, fact.CorrectsExecutionId!);
                if (!state.Executions.TryGetValue(correctedKey, out var corrected))
                    throw new InvalidOperationException("Corrected execution was not found.");
                if (corrected.Kind != ExecutionFactKind.Fill)
                    throw new InvalidOperationException("Nested correction or bust lineage is not supported.");
                if (corrected.AccountId != fact.AccountId || corrected.SecurityId != fact.SecurityId)
                    throw new InvalidOperationException("Correction scope does not match the original execution.");
                if (corrected.OrderId != fact.OrderId || corrected.Side != fact.Side)
                    throw new InvalidOperationException("Correction order or side does not match the original execution.");
                if (fact.ExecutedAt < corrected.ExecutedAt)
                    throw new InvalidOperationException("Correction cannot precede the original execution.");
                if (state.Executions.Values.Any(item => item.CorrectsExecutionId == fact.CorrectsExecutionId
                    && item.Provider == fact.Provider && item.ProviderAccountReference == fact.ProviderAccountReference))
                    throw new InvalidOperationException("Execution has already been corrected or busted.");
                position = Reverse(position, corrected);
                if (fact.Kind == ExecutionFactKind.Correction) position = ApplyFill(position, fact);
            }
            else
            {
                position = ApplyFill(position, fact);
            }

            state.Executions.Add(executionKey, fact);
            var ids = position.AppliedExecutionIds.Append(fact.ProviderExecutionId).ToArray();
            var protection = position.Protection.AsOf < fact.ExecutedAt
                ? new PositionProtection(0, 0, null, DateTimeOffset.MinValue, false)
                : position.Protection;
            position = Reprice(position with
            {
                MarkPrice = position.MarkAsOf < fact.ExecutedAt ? null : position.MarkPrice,
                MarkAsOf = position.MarkAsOf < fact.ExecutedAt ? null : position.MarkAsOf,
                LastExecutionAt = fact.ExecutedAt,
                Protection = protection,
                Version = position.Version + 1,
                AppliedExecutionIds = ids
            });
            state.Positions[(fact.AccountId, fact.SecurityId)] = position;
            return position;
        });
    }

    public PositionSnapshot Mark(Guid accountId, Guid securityId, decimal markPrice, DateTimeOffset asOf)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(markPrice);
        RequireUtc(asOf, nameof(asOf));
        return store.Execute(state =>
        {
            var current = GetOrEmpty(state, accountId, securityId);
            if (current.LastExecutionAt is not null && asOf < current.LastExecutionAt)
                throw new InvalidOperationException("A mark cannot predate the latest execution.");
            if (current.MarkAsOf is not null && asOf < current.MarkAsOf) return current;
            if (current.MarkAsOf == asOf)
            {
                if (current.MarkPrice == markPrice) return current;
                throw new InvalidOperationException("Conflicting mark exists at the same timestamp.");
            }
            var updated = Reprice(current with { MarkPrice = markPrice, MarkAsOf = asOf, Version = current.Version + 1 });
            state.Positions[(accountId, securityId)] = updated;
            return updated;
        });
    }

    public PositionSnapshot SetProtection(
        Guid accountId, Guid securityId, long desiredQuantity, long confirmedQuantity,
        decimal? stopPrice, DateTimeOffset asOf, bool brokerStateKnown)
    {
        ArgumentOutOfRangeException.ThrowIfNegative(desiredQuantity);
        ArgumentOutOfRangeException.ThrowIfNegative(confirmedQuantity);
        if (stopPrice <= 0m) throw new ArgumentOutOfRangeException(nameof(stopPrice));
        RequireUtc(asOf, nameof(asOf));
        if (!brokerStateKnown && confirmedQuantity != 0)
            throw new ArgumentException("Unknown broker state cannot assert confirmed protection quantity.", nameof(confirmedQuantity));
        return store.Execute(state =>
        {
            var current = GetOrEmpty(state, accountId, securityId);
            if (current.LastExecutionAt is not null && asOf < current.LastExecutionAt)
                throw new InvalidOperationException("Protection evidence cannot predate the latest execution.");
            if (asOf < current.Protection.AsOf) return current;
            var protection = new PositionProtection(desiredQuantity, confirmedQuantity, stopPrice, asOf, brokerStateKnown);
            if (asOf == current.Protection.AsOf)
            {
                if (protection == current.Protection) return current;
                throw new InvalidOperationException("Conflicting protection state exists at the same timestamp.");
            }
            var updated = Reprice(current with { Protection = protection, Version = current.Version + 1 });
            state.Positions[(accountId, securityId)] = updated;
            return updated;
        });
    }

    public PositionSnapshot Get(Guid accountId, Guid securityId) => store.Execute(state => GetOrEmpty(state, accountId, securityId));

    private static PositionSnapshot ApplyFill(PositionSnapshot position, ExecutionFact fact)
    {
        if (fact.Side == CanonicalOrderSide.Buy)
        {
            var newQuantity = checked(position.Quantity + fact.Quantity);
            var cost = position.CostBasis + (fact.Quantity * fact.Price) + fact.Fee;
            return position with { Quantity = newQuantity, CostBasis = cost, AverageCost = cost / newQuantity, Fees = position.Fees + fact.Fee };
        }
        if (fact.Quantity > position.Quantity) throw new InvalidOperationException("Sell execution cannot create a short position in the MVP ledger.");
        var allocatedCost = position.AverageCost * fact.Quantity;
        var proceeds = fact.Quantity * fact.Price;
        var remaining = position.Quantity - fact.Quantity;
        return position with
        {
            Quantity = remaining,
            CostBasis = remaining == 0 ? 0m : position.CostBasis - allocatedCost,
            AverageCost = remaining == 0 ? 0m : position.AverageCost,
            RealizedPnl = position.RealizedPnl + proceeds - allocatedCost - fact.Fee,
            Fees = position.Fees + fact.Fee,
        };
    }

    private static PositionSnapshot Reverse(PositionSnapshot position, ExecutionFact corrected)
    {
        if (corrected.Side == CanonicalOrderSide.Buy)
        {
            if (corrected.Quantity > position.Quantity) throw new InvalidOperationException("Buy correction cannot be safely reversed after dependent sells; reconciliation is required.");
            var remaining = position.Quantity - corrected.Quantity;
            var originalCost = corrected.Quantity * corrected.Price + corrected.Fee;
            return position with
            {
                Quantity = remaining,
                CostBasis = remaining == 0 ? 0m : position.CostBasis - originalCost,
                AverageCost = remaining == 0 ? 0m : (position.CostBasis - originalCost) / remaining,
                Fees = position.Fees - corrected.Fee
            };
        }
        var restored = checked(position.Quantity + corrected.Quantity);
        var restoredCost = position.CostBasis + (position.AverageCost * corrected.Quantity);
        return position with
        {
            Quantity = restored,
            CostBasis = restoredCost,
            AverageCost = restoredCost / restored,
            RealizedPnl = position.RealizedPnl - ((corrected.Quantity * corrected.Price) - (position.AverageCost * corrected.Quantity) - corrected.Fee),
            Fees = position.Fees - corrected.Fee
        };
    }

    private static PositionSnapshot Reprice(PositionSnapshot position)
    {
        decimal? unrealized = position.MarkPrice is null ? null : (position.MarkPrice.Value - position.AverageCost) * position.Quantity;
        var protectionState = position.Protection.State(position.Quantity);
        return position with
        {
            UnrealizedPnl = unrealized,
            ProtectionState = protectionState,
            ReconciliationRequired = protectionState is ProtectionState.Unknown or ProtectionState.UnderProtected or ProtectionState.OverProtected
        };
    }

    private static PositionSnapshot GetOrEmpty(PositionLedgerState state, Guid accountId, Guid securityId)
    {
        if (accountId == Guid.Empty || securityId == Guid.Empty) throw new ArgumentException("Account and security IDs are required.");
        if (state.Positions.TryGetValue((accountId, securityId), out var existing)) return existing;
        var protection = new PositionProtection(0, 0, null, DateTimeOffset.MinValue, false);
        return new(Guid.NewGuid(), accountId, securityId, 0, 0m, 0m, 0m, 0m, null, null, null, null, 0,
            protection, ProtectionState.NotRequired, false, []);
    }

    private static void RequireUtc(DateTimeOffset value, string name)
    {
        if (value == default || value.Offset != TimeSpan.Zero)
            throw new ArgumentException("Timestamp must be a non-default UTC value.", name);
    }
}
