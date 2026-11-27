# WBS 7.3 — Paper OMS Acceptance

Status: In progress — 90%

## Delivered locally

- Immutable risk-approved PAPER order proposals with deterministic SHA-256 digests and explicit expiry.
- Proposal consumption that creates one canonical managed order from the synthetic paper-broker result.
- Serialized submission command handling so concurrent exact replays reach the provider at most once.
- Scoped idempotency behavior for submit, cancel and replace: exact commands replay their original result and changed payloads conflict.
- Optimistic order-version checks for cancel and replace commands.
- Unknown broker outcomes that require reconciliation and block further mutation without blind resubmission.
- Cancel-pending and replace-pending lifecycle states with terminal-state protection.
- Replace validation that prevents total quantity from falling below cumulative fills.
- Reconciliation checks for account/client identity and non-regressing cumulative fills.
- Reconciliation validation for provider and provider-order identity, security scope, side, time-in-force, positive quantity/price and cumulative-fill bounds.
- Fail-closed unauthorized term-change handling, stale/exact replay suppression, partial-fill state protection and authoritative fill-over-cancel precedence.
- Defined-enum validation at proposal and reconciliation boundaries, plus length-prefixed culture-invariant proposal evidence.
- Independent validation of broker submission responses against the approved proposal before managed state is created.
- Equal-time reconciliation fencing: exact observations replay while conflicting snapshots fail closed.
- Explicit false live authority across proposals and managed orders.

## Verification evidence

- Twenty previously executed focused OMS lifecycle, reconciliation and failure-mode cases passed.
- Three additional focused cases are authored for undefined proposal enums, contradictory broker submission responses, and equal-time/undefined-state reconciliation conflicts.
- Cases cover risk/expiry prerequisites, deterministic proposal evidence, submission/consumption, exact and concurrent replay, changed-payload conflict, consumed-proposal denial, unknown-outcome lockout, cancel/replace idempotency, stale versions, cumulative-fill constraints, provider/order/account/security identity, execution-term denial, invalid or unauthorized term changes, stale/exact reconciliation replay, state regression and terminal mutation/race handling.
- The repository-pinned .NET runner was retried for this increment, but compilation stalled and was cancelled; the three new cases are not claimed as freshly executed evidence.
- The previous baseline remains 419 architecture tests and 66 API-security tests passing with a zero-warning Release build; it is historical evidence, not a fresh certification of this increment.

## Remaining acceptance work

- Authenticated and authorized REST endpoints with CSRF, server-scoped idempotency keys, `If-Match`, current-risk checks and explicit user confirmation.
- PostgreSQL proposal/order/command persistence with atomic claims, transactions, concurrency tokens, immutable history and outbox delivery.
- Selected-broker submit, query, cancel and approved replace integration with rate limits and provider-specific reconciliation.
- Execution/correction handling, positions, protective-order state and cross-process restart recovery.
- Database race, multi-instance concurrency, broker timeout/query, partial-fill cancel/replace, load, chaos, recovery and audit-reconstruction tests.
- Product, Risk, Security, Broker/Vendor, Engineering, QA and Operations approvals and acceptance of WBS 7.1/7.2 predecessors.

## Safety boundary

The OMS is entirely synthetic and in memory. It has no API, database, credential, real account or external broker connection and cannot submit an order to any broker. Submission reaches only the synthetic paper adapter. No proposal, command or managed-order state can authorize live trading.
