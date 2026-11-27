# WBS 7.6 — Paper-Trading UI Acceptance

## Status

In progress — 99%.

## Delivered locally

- Angular `/app/trading` route and portal navigation.
- Paper-only order ticket for symbol, side, quantity, limit and protective-stop intent.
- Client validation for the MVP $3–$7 price and 500,000-share maximum guardrails.
- Mandatory review step with estimated notional, protection and no-guarantee language.
- Disabled submission whenever reconciliation/risk/broker authority is unavailable.
- Synthetic orders, partial fills, positions, realized/unrealized P&L and protection states.
- Prominent paper-mode, entry-lock, timestamp and non-authority labels.
- Responsive tables and accessible labelled form controls, alert, headings and status content.
- Protected-session resolution with subject, paper-mode and account-ID validation before synthetic ledger display.
- Fail-closed clearing of account, orders and positions plus Unknown reconciliation when session context is invalid, live-mode, unavailable or revoked.
- Order review remains disabled until authenticated paper-account context exists.
- Authenticated account-bound `GET /api/v1/trading/accounts/{accountId}/overview` with no-store responses and cross-account denial.
- Synthetic order/position lifecycle evidence, aggregate SHA-256 hash, freshness and account-echo validation supplied by the backend rather than Angular fixtures.
- Explicit `EntryLocked=true`, `IsAuthoritative=false`, `CanSubmit=false` and `CreatesTradingAuthority=false` boundaries.
- Account-bound antiforgery-protected paper-order review endpoint with server-enforced symbol, side, $3–$7 price and 500,000-share quantity rules.
- Idempotent request replay and changed-intent rejection before any review response is produced.
- Pre-review session revalidation, server-calculated notional and strict response validation in Angular.
- Explicit review `CanSubmit=false`, `MutatesTradingState=false` and `CreatesTradingAuthority=false` boundaries.
- Server-issued two-minute review expiry included in the SHA-256 evidence input and displayed in the confirmation panel.
- Client rejection of expired, materially future-dated or incorrectly bounded review windows.
- Strict runtime validation for unique order/position identities, symbols, sides, timestamps, share/price/fill bounds, finite position economics and recognized protection states.
- Direct service calls now receive the same symbol, side, quantity, price and stop validation as the visible ticket before any review request can leave the browser.
- Order lifecycle states are allow-listed, overview collections are capped at 1,000 rows each and unrealized P&L must reconcile to quantity, average cost and mark within one cent.
- Validated backend `asOf` evidence displayed in the position section and cleared with all account data on any invalid response.
- Executable readiness verification hashes the UI/API evidence, checks predecessor manifests and preserves explicit false acceptance, broker, submission and trading-authority flags.

## Verification

- 137 trading-portal tests pass, including sixteen focused paper-trading UI cases.
- Nine focused service and four focused API cases pass; complete backend regressions are green at 426 architecture and 66 API-security tests.
- Angular application type-check passes. The last successful production build remains 487.68 kB initial raw / 115.65 kB estimated transfer; the fresh build process aborted in the current host after starting and is retained as a verification blocker rather than represented as a pass.
- Angular import-boundary verification passes.
- Browser verification confirms the review interaction, disabled submit control, paper-only language, no console warnings/errors and visible order/position tables.

## Remaining acceptance work

- Replace the synthetic backend read model with authorized OMS, position, reconciliation and broker snapshots; add SignalR deltas.
- Integrate authoritative risk proposals, expiring confirmations and OMS commands; synthetic server review and reconciliation lockout are implemented.
- Add cancel/replace/protect workflows with idempotency and fresh-version conflict handling.
- Implement stale/gap/reconnect recovery and clear partial/unknown/failure states.
- Complete keyboard, screen-reader, zoom, forced-colors, browser, performance and representative-user testing.
- Add end-to-end paper lifecycle, timeout, duplicate, partial-fill, reconciliation and recovery evidence.
- Obtain accountable product, UX, accessibility, risk, security and compliance approvals and close predecessor gates.
- Re-run the warning-free production build in a healthy build host and retain the new bundle report.

## Safety boundary

All displayed orders, positions and prices come from synthetic read/review APIs. Submission is disabled; there is no mutation endpoint, credential, real account or external broker connection. The UI cannot authorize live trading.
