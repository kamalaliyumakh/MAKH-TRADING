# Scanner snapshot API — 2026-09-14

> Superseded on 2026-09-15: authenticated snapshot reads now return `403`/`no-store` because persisted scanner runs lack account-owner binding. The initial 200/404 behavior below is historical test evidence, not the current authorization contract. See `SCANNER_SIGNALR_HUB_2026-09-14.md`.

## Outcome

WBS 5.7 now provides an authenticated, read-only REST endpoint for retrieving an immutable persisted scanner run and its complete candidate evidence. Missing runs return `404` and never fall back to synthetic data.

## Implemented

- Registered the PostgreSQL scanner repository behind the application-layer `IScannerRunRepository` boundary.
- Added `GET /api/v1/scanner/runs/{runId}` under the portal-access authorization policy.
- Added `Cache-Control: no-store` to prevent user-specific discovery evidence from being cached.
- Returned the run identifier, preset version, as-of time, canonical snapshot hash, data quality and ranked or excluded candidates.
- Returned an explicit `createsTradingAuthority: false` boundary. The endpoint exposes no order, broker or command operation.

## Verification

- API security tests: 34 passed, including three new cases for anonymous denial, authenticated evidence retrieval and missing-run fail-closed behavior.
- Architecture tests: 317 passed.
- Targeted .NET formatting verification: passed.
- All 14 secret-scanner regressions and the fail-closed scan across 598 tracked and eligible untracked files passed.

## Decision boundary

The endpoint is local API evidence only. An authenticated SignalR hub, authorized user groups, server outbox, monotonic publication, reconnect recovery, load/chaos evidence, hosted acceptance and accountable approvals remain pending. No paper or live order authority was created.

## Progress decision

WBS 5.7 advances from 65% to 72%. Formula-driven overall completion advances to 74.84% (75% displayed), with 6 Complete and 64 In Progress. It remains In Progress.
