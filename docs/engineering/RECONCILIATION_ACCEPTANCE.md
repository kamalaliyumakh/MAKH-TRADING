# WBS 7.5 — Order, Position and Cash Reconciliation Acceptance

## Status

In progress — 90%.

## Delivered locally

- Account-scoped platform and broker snapshots with source checksum and as-of evidence.
- Fail-closed account state before the first clean reconciliation and whenever either source is unknown.
- Deterministic comparison of order presence, state, quantity and cumulative fills.
- Position presence and quantity comparison across the complete security union.
- Cash and buying-power comparison with an explicit configurable cash tolerance.
- Itemized differences and immutable run history with monotonic account sequence.
- Immediate entry lockout for mismatch/unknown outcomes; only a later clean run clears the lock.
- Independent platform and broker snapshot fencing by as-of time and source checksum.
- Exact two-source replay returns the original immutable run without sequence churn.
- Stale or same-time conflicting source evidence produces Unknown and cannot clear a newer entry lock.
- Length-prefixed SHA-256 content fingerprints bind each snapshot's account, UTC time, known-state flag, cash, buying power, ordered orders and ordered positions independently of the caller checksum.
- Independent first-observed platform and broker high-water fences cannot be moved backward by stale, unknown or conflicting runs.
- Canonical order-state, nonnegative long-only position, bounded collection/checksum and non-default UTC snapshot/completion validation.
- Reconciliation completion chronology cannot regress.
- Explicit non-authority labels on synthetic reconciliation results.

## Verification

- Fifteen previously executed focused reconciliation and failure-mode tests passed.
- Three additional focused cases are authored for content/checksum replay conflicts, independent high-water retention and canonical/UTC contract validation.
- The repository-pinned .NET runner was retried for this increment, but compilation stalled and was cancelled; the new cases are not claimed as freshly executed evidence.
- The previous full-regression baseline remains historical evidence only and is not a fresh certification of this increment.

## Remaining acceptance work

- Implement PostgreSQL reconciliation runs/items, atomic account lock state, fencing and outbox events.
- Obtain complete selected-broker order, execution, position, cash and buying-power snapshots with pagination/checksum guarantees.
- Integrate the lock with risk evaluation, OMS entry submission, operator controls and authorized UI snapshots.
- Define approved tolerances, timing windows, settled/unsettled cash rules, corporate actions and resolution categories.
- Implement scheduled, event-triggered, startup and post-recovery reconciliation orchestration.
- Complete chaos, stale/partial snapshot, race, restart, recovery, load and audit-evidence drills.
- Obtain accountable broker, risk, finance, compliance, operations and product approvals and close predecessor gates.

## Safety boundary

All snapshots are synthetic and in memory. No API, database, credential, real account or external broker is connected. A clean local comparison is not broker certification and cannot authorize live trading.
