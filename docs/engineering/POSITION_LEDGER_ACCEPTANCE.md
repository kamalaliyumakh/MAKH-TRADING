# WBS 7.4 — Execution, Position, P&L and Protection Acceptance

## Status

In progress — 90%.

## Delivered locally

- Immutable fill, correction and bust facts with provider/account/execution identity.
- Exactly-once projection for exact replays and explicit rejection of conflicting duplicates.
- Average-cost, long-only position roll-up with fee-aware cost basis and realized P&L.
- Partial and full exits, timestamped marks and unrealized P&L projection.
- Desired versus broker-confirmed protection quantities with NotRequired, Pending, Protected, UnderProtected and Unknown states.
- Explicit UnderProtected and OverProtected states when desired or broker-confirmed coverage differs from the open position.
- Explicit reconciliation flags for unknown, insufficient or excess protection.
- Replay-idempotent mark and protection snapshots, stale-update suppression and same-timestamp conflict denial.
- Correction lineage that requires matching provider account, position scope, order, side and non-regressing chronology.
- Defined side/fact-kind validation and non-default UTC execution, mark and protection timestamps.
- Monotonic per-position execution chronology and rejection of nested correction/bust chains.
- Automatic invalidation of older mark and broker-protection evidence when a later execution changes the position.
- Rejection of marks/protection evidence that predate the latest execution and of confirmed protection quantities when broker state is unknown.
- Synthetic in-memory storage and non-authoritative position/P&L labels.

## Verification

- Nineteen previously executed focused execution-ledger, position, P&L, correction and protection tests passed.
- Three additional focused cases are authored for stale derived-evidence invalidation, execution-relative evidence chronology, unknown confirmation, undefined/UTC fact validation and nested/out-of-order execution denial.
- The repository-pinned .NET runner was retried for this increment, but compilation stalled and was cancelled; the new cases are not claimed as freshly executed evidence.
- The previous full-regression baseline remains historical evidence only and is not a fresh certification of this increment.

## Remaining acceptance work

- Implement atomic PostgreSQL execution ingestion, projections, concurrency control and outbox publication.
- Map selected-broker executions, corrections, busts and fees against certified paper responses.
- Approve P&L definitions for session boundaries, currency, corporate actions, taxes and rounding.
- Implement broker-versus-platform position and protection reconciliation with operator workflow.
- Integrate protective-order commands through the selected broker adapter.
- Complete load, race, failover, recovery, audit and representative-user evidence.
- Obtain accountable product, risk, compliance, finance and operations approvals and close predecessor gates.

## Safety boundary

All values and execution facts are synthetic. The implementation has no API endpoint, database, credential, real account or external broker connection. Broker records remain authoritative; this projection cannot authorize live trading.
