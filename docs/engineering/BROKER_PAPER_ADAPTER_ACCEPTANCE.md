# WBS 7.2 — Broker Paper Adapter Acceptance

Status: In progress — 90%

## Delivered locally

- Provider-neutral PAPER account, limit-order request, canonical order-state and adapter contracts.
- Strict separation that rejects LIVE account identity at paper-adapter construction and never creates live authority.
- Stable client-order identifiers with identical-request replay and changed-payload conflict behavior.
- Risk-approved-paper-proposal prerequisite before a synthetic provider submission is recorded.
- Canonical Accepted, Unknown, PartiallyFilled, PendingCancel, Cancelled, Filled and Rejected mappings.
- Fail-closed unknown-state normalization and timeout-after-possible-submission behavior requiring query/reconciliation before retry.
- Monotonic snapshot application that ignores stale updates, prevents partial-fill regression and preserves terminal broker truth.
- Validation of provider/client identity, order terms and cumulative fill bounds.
- Explicit account-scoped cancellation with required correlation, single provider-side effect and idempotent replay.
- Fail-closed cancel denial for missing, unknown, filled and rejected orders, while a later authoritative full-fill snapshot wins a cancel race.
- Undefined environment, order-side, time-in-force and synthetic-behavior enum values are rejected, and the account provider must match the adapter provider identity.
- Length-prefixed culture-invariant payload identity prevents delimiter and locale ambiguity in idempotent replay decisions.
- Provider-state normalization rejects blank state and invalid quantity/fill shape; stale snapshots are ignored, exact equal-time replay is stable and equal-time conflicts fail closed.

## Verification evidence

- The retained baseline contains twenty-one passing focused broker contract, mapping and cancellation cases. Four additional contract/idempotency/mapping/timestamp regressions are authored; the pinned .NET 10 runner stalled before compilation, was cancelled, and is not claimed as fresh execution evidence.
- Cases cover paper/live segregation, false live authority, risk prerequisite, canonical identity, duplicate replay, changed-payload conflict, timeout uncertainty, query-by-client-ID, provider mappings, fill precedence, stale/out-of-order events, monotonic partial fills, terminal-state protection, contradictory snapshots, idempotent cancellation and cancel/fill races.
- An executable readiness verifier checks twelve controls, hashes ten artifacts, records six blockers and emits `Local Synthetic Broker Adapter Ready / Selected-Provider Certification and Accountable Acceptance Pending`.

## Remaining acceptance work

- Select an eligible broker and obtain written account/jurisdiction, API-use and paper-environment confirmation.
- Map the selected broker's authenticated requests, responses, error taxonomy, rate limits, maintenance/session behavior and supported order capabilities.
- Implement server-side secret custody/rotation, account discovery, buying power, orders, executions, positions and approved replace semantics; map the local cancellation contract to the selected provider.
- Persist intents, provider calls, snapshots, executions, idempotency records and audit/outbox evidence in PostgreSQL.
- Execute BAT-01–18 against the selected provider, including timeout/query, duplicate, partial-fill, correction, reconciliation, restart, secret-rotation and paper/live-swap scenarios.
- Obtain Product, Broker/Vendor, Legal, Risk, Security, Engineering, QA and Operations approvals and satisfy WBS 1.3/3.8 predecessors.

## Safety boundary

The adapter is entirely synthetic and in memory. It performs no HTTP request, holds no credential, knows no real account and cannot submit an order to any broker. Its accepted state is test data only and does not prove paper-broker certification or authorize live trading.
