# WBS 5.7 — Scanner Real-Time Updates Acceptance

Date reconciled: 24 October 2026  
Status: In progress — 99%

## Delivered locally

- Added a typed `scanner.updated` envelope for schema version, stream, sequence, run identity, as-of time, upserts, and removals.
- Applied only the next monotonic stream sequence and ignored at-least-once duplicate delivery.
- Detected gaps, incompatible envelopes, and updates received during uncertainty, then stopped delta application and required snapshot recovery.
- Marked the view Reconnecting after connection loss and required an authoritative snapshot after reconnection.
- Replaced local state and resumed from the snapshot stream sequence only after valid recovery.
- Preserved a visible Stale state when snapshot recovery fails; the client never fabricates current state.
- Displayed connection state and last applied sequence in the scanner without adding trading controls.
- Persisted account-scoped scanner run sequences through an atomic PostgreSQL account cursor and run transaction. The database rejects duplicate account/sequence values; legacy unsequenced runs remain evidence-only.
- Added authenticated `GET /api/v1/scanner/snapshot`, which returns the caller account's highest sequenced run with candidates and `streamSequence`. Anonymous, cross-account and legacy-unsequenced recovery attempts fail closed.
- Added `platform.outbox_messages`. Scanner run, candidates, account sequence and one `scanner.updated` outbox fact commit in the same database transaction. The event contains versioned recovery deltas and no order or broker command.
- Added a leased, retry-safe outbox dispatcher boundary. PostgreSQL claims due messages with `FOR UPDATE SKIP LOCKED`, enforces head-of-stream ordering per account/event, records lease ownership and attempt count, and conditionally records publication or bounded retry state.
- Added the SignalR scanner publisher and server-constructed account group. Subscription admission requires valid user, account and session identifiers plus an active persisted session; missing or revoked sessions fail closed before group membership.
- Added a connection registry keyed by connection, user, account and session. Explicit session revocation/logout aborts matching local connections, disconnect cleanup removes registrations, and every publication revalidates persisted session state before choosing connection IDs so expired/revoked sessions receive no delta.
- Added a feature-disabled Angular SignalR adapter and coordinator. Initial connect, reconnect and sequence gaps require `GET /api/v1/scanner/snapshot` replacement before the view becomes Connected; failed recovery remains visibly Stale. The SignalR package is lazy-loaded so the disabled path does not breach the initial bundle budget.
- Added a default-off hosted dispatch service with validated poll, lease and batch bounds. When explicitly enabled it creates a fresh scoped dispatcher per cycle, continues after bounded cycle failures and stops promptly on cancellation; committed configuration keeps it disabled.
- Added a controlled in-process end-to-end test using the real hosted dispatcher, SignalR hub protocol and long-polling client. Sequence 12 reaches the authorized account; revoking its persisted session aborts the connection and suppresses sequence 13. Test-only settings enable dispatch without changing committed defaults.
- Added deterministic local load/chaos coverage for 2,000 messages across 100 account streams and eight concurrent dispatchers. All per-account sequences 1–20 remain ordered through 118 injected transient failures and 2,118 total attempts, with zero lease-ownership violations.

## Verification evidence

- Eleven focused real-time service/coordinator tests and 73 total portal tests pass.
- Duplicate, gap, halted-application, reconnect, valid-snapshot, and failed-recovery cases are covered.
- The production portal build and Angular import-boundary verification pass.
- Browser checks at 1280 px and 320 px confirm the connected sequence status, zero order buttons, no horizontal overflow, and no console warnings or errors.
- The production portal build passes with a 470.56 kB initial bundle and a lazy 55.88 kB SignalR chunk; Angular boundary and targeted formatting checks pass.
- Current backend verification: 59 API security and 325 architecture tests pass. Controlled E2E proves hosted claim → publisher → real hub client delivery → persisted-session revocation → connection abort/suppression. A 100-account, 2,000-run reordered correction replay plus 200 duplicates reconstructs every final snapshot with zero lineage violations. Publisher validation rejects unsupported schema versions and malformed or ambiguous candidate/correction deltas before SignalR delivery. Ten-migration PostgreSQL 17.10 smoke passes.

## Acceptance still required

- Replace or coordinate the in-process connection registry with the selected SignalR backplane for multi-replica deployment.
- Complete hosted representative-capacity load/soak/chaos evidence and obtain Backend, Frontend, Security, Data, Risk, Product and Operations acceptance.
- Add hosted backward/forward compatibility drills, hosted correction replay at approved capacity, and multi-replica evidence.
- Obtain Backend, Frontend, Security, Data, Risk, Product, and Operations accountable approvals after predecessor gates.

## Safety boundary

The current protocol and data are synthetic and in-process. Publisher, admission, local revocation filtering, a disabled client adapter and a disabled hosted service exist; committed settings deliver no event automatically. The connection registry is process-local and is not multi-replica evidence. SignalR is never an authoritative command or trading path. A disconnect, gap, incompatible event, or failed recovery makes the projection degraded; no scanner update can create or authorize an order.

## Readiness decision

The executable readiness gate reconciles client sequencing/recovery, authenticated snapshot and hub boundaries, transactional outbox dispatch, revocation suppression, controlled end-to-end delivery and deterministic load/chaos evidence. Decision: `Local Real-Time Ready / Multi-Replica Hosted Certification Pending`. No deployment or trading authority is created.
