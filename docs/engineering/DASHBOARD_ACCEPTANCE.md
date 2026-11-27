# WBS 6.5 — Dashboard Acceptance

Status: In progress — 99%

Readiness decision: `Local Read-Only Dashboard Ready / Hosted and Accountable Acceptance Pending`

## Delivered locally

- Added the `/app` trading dashboard as the portal default and added Dashboard/Scanner shell navigation.
- Placed PAPER mode, synthetic account scope and the critical entry lock before financial or candidate information.
- Added timestamped realized, unrealized and total daily P&L labelled as a synthetic estimate rather than reconciled broker truth.
- Added policy-versioned remaining daily-loss capacity, open-risk and unavailable buying-power context.
- Added explicit Market Data, Evidence, Risk Service, Broker and Reconciliation health with freshness and operational effects.
- Added non-authoritative position/order counts, severity-labelled alerts and secondary watch-candidate context.
- Added links to the scanner and symbol workspaces without adding order, risk-administration or other consequential controls.
- Redesigned the responsive portal shell as a professional workstation with clearer branding, navigation and paper-mode status.
- Added an accessible synthetic session P&L SVG chart and comparative candidate gain bars without presenting either as recommendation or authority.
- Added an authenticated, account-scoped `GET /api/v1/dashboard` read API with `no-store` and clock-relative snapshot/P&L timestamps.
- The contract explicitly marks data as Synthetic, broker reconciliation as false, and trading-authority/order-submission flags as false while keeping entry Locked and authority dependencies Unavailable.
- Connected the Angular dashboard to the credentialed API and removed the hardcoded page fixture from the running view.
- Added strict runtime validation for account identity, PAPER/Locked state, P&L and loss-capacity reconciliation, unavailable broker/risk/reconciliation authority, critical entry-lock alert and immutable false authority flags.
- Bounded dependencies, alerts and candidates to 20/50/100 records respectively and required unique dependency names, alert IDs and candidate symbols.
- Enforced nonnegative open risk and candidate relative volume, safe-integer dependency ages and activity ceilings, P&L time no later than the dashboard snapshot, and rejection of materially future snapshots.
- Loading, denied, unavailable, stale and malformed responses clear the entire snapshot and expose no financial, risk, activity, alert or candidate content.
- Added optional authenticated SignalR coordination that establishes an authoritative scanner sequence, refreshes the dashboard on valid next events, ignores duplicates and recovers through REST after gaps or reconnects.
- Disconnects, incompatible events, sequence gaps and failed recovery immediately clear all account content; forbidden recovery remains explicitly denied.

## Verification evidence

- Five focused dashboard cases and all forty-nine portal tests pass.
- The trading portal production build and Angular-boundary verification pass without warnings.
- Desktop verification at 1440 × 900 and narrow verification at 390 × 844 show no horizontal page overflow or browser console warnings/errors.
- Browser semantics confirm the critical entry alert is present, three authority dependencies are unavailable, watch candidates follow connectivity, and the dashboard contains zero buttons and zero forms.
- Three focused backend cases and two API-security cases pass. The full zero-warning Release build passes with 405 architecture and 64 API-security tests.
- Twenty-three focused dashboard UI/recovery tests pass, including new collection-integrity, timestamp and nonnegative-risk cases.
- `eng/verify-dashboard-readiness.mjs` passes twelve controls across fourteen SHA-256-hashed artifacts and emits a fail-closed manifest with six explicit blockers.

## Acceptance still required

- Add authorized broker, risk, market, evidence and reconciliation sources and complete deployed multi-client/backplane verification.
- Implement explicit snapshot versioning, stale/gap recovery, server-authoritative P&L/risk definitions and cross-account authorization.
- Add approved position/order drill-downs, alert acknowledgement rules and operations support paths.
- Complete representative-user usability, keyboard, screen-reader, zoom, forced-colors, performance, load and fault-state testing.
- Obtain Product, Risk, Frontend, UX/Accessibility, Broker/Operations, Security and QA accountable approvals and satisfy WBS 5.7.

## Safety boundary

All values are synthetic and read-only. The API is account-scoped but creates no entitlement or authority. The Angular page renders only after validating the non-authority contract and hides all account information during any error, disconnect, sequence gap or stale state. Real-time coordination remains default-off outside controlled configuration. The dashboard has no broker connection, real account, credentials, risk authority, reconciliation truth, order form or consequential control. P&L and capacity are illustrative and must never be used for a real trading decision.
