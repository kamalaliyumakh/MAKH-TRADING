# Scanner SignalR hub — 2026-09-14

## Outcome

WBS 5.7 now exposes the authenticated SignalR endpoint defined by the API baseline at `/hubs/trading-v1`. Anonymous negotiation fails with `401`; an authenticated portal session can negotiate the connection.

Update on 16 September: authenticated negotiation works and `SubscribeScannerUpdates()` admits only a valid user/account/session claim set whose persisted session is still active. The server constructs the account group; clients cannot name a group or another account. Scanner runs have account binding and transactional account-scoped sequences. `GET /api/v1/scanner/snapshot` returns only the caller account's highest sequenced run; another account, no current snapshot and legacy unsequenced evidence return `404`/`no-store`. No order, broker or other trading command is exposed through SignalR.

The same run transaction writes a unique `scanner.updated` fact to `platform.outbox_messages`. A leased dispatcher can claim the next due head-of-stream message with `FOR UPDATE SKIP LOCKED`, record success, or defer failure with bounded retry. The registered publisher builds a versioned envelope, revalidates every registered session and targets only active connection IDs for the account. Explicit revocation/logout aborts matching local connections. The dispatcher is not registered as a hosted loop, so it does not publish automatically.

## Implementation

- `src/MAKH.Api/Realtime/TradingHub.cs`
- `src/MAKH.Api/Program.cs`
- `tests/MAKH.Api.SecurityTests/IdentitySecurityTests.cs`

Detailed SignalR errors are disabled. The hub requires the existing `PortalAccess` policy for negotiation. Subscription revalidates the persisted session and aborts invalid/revoked callers before joining the server-derived account group and connection registry. Disconnect removes the registration.

## Verification

- 52 API security tests pass, including active/revoked admission, explicit session disconnect, per-publication revoked-session exclusion, account-only routing, malformed-event rejection, latest snapshot recovery and anonymous/cross-account denial.
- 321 architecture tests pass, including successful dispatch, failed-publication retry, the outbox payload and no-trading-authority contract.
- A zero-warning Release migration build and no-pending-model check pass. Isolated PostgreSQL 17.10 smoke applies all nine migrations and proves sequence 1 is leased and completed before sequence 2, plus uniqueness, account ownership and runtime privileges.
- 14 secret-scanner regressions pass.
- The fail-closed source scan passes across 600 tracked and eligible untracked files.
- Git whitespace validation passes.
- The feature-disabled Angular adapter uses cookie-authenticated `/hubs/trading-v1`, invokes only `SubscribeScannerUpdates`, lazy-loads SignalR and replaces state from the REST snapshot after initial connect, reconnect or a sequence gap. Eleven focused real-time tests and 73 portal tests pass; the warning-free production build stays within its initial bundle budget.
- The hosted dispatcher is registered but committed `Realtime:OutboxDispatcher:Enabled` is `false`. Startup validation constrains polling to 100–60000 ms, leases to 5–300 seconds and batches to 1–100; tests prove default-off inactivity, cycle retry and cancellation-safe shutdown.
- A controlled in-process E2E enables the dispatcher only in the test host, connects through the real SignalR long-polling protocol, receives sequence 12, revokes the persisted session, observes connection abort and confirms sequence 13 is suppressed. Committed feature gates remain off.

The verification used a fresh official .NET SDK 10.0.400 under `/tmp` because the ignored project-local SDK had become cloud-dataless. This changed no application configuration.

## Decision boundary

WBS 5.7 is 99% and remains In Progress. Account ownership, recovery, durable outbox, leased dispatch, publisher mapping, revocation filtering, Angular recovery, default-off hosting and controlled E2E delivery/revocation are implemented. Multi-replica backplane, representative load/chaos testing and accountable approval remain pending. No paper or live trading authority was created.
