# WBS 6.4 — Symbol Workspace Acceptance

Status: In progress — 99%

Readiness decision: `Local Read-Only Workspace Ready / Hosted and Accountable Acceptance Pending`

## Delivered locally

- Added the authenticated portal route `/app/symbols/:symbol` and linked scanner rows through `Review symbol`.
- Added canonical symbol, venue, review-only tradability, snapshot time, quote age/state and a prominent extreme-move warning.
- Added an accessible synthetic price trace with a text alternative and explicit non-executable-data disclosure.
- Upgraded the trace to a responsive gradient area chart with reference grid lines and a visible latest-point marker.
- Added transparent price, RVOL, float, gain, spread and dollar-volume rule evidence with qualification limitations.
- Presented Primary and Attributed evidence before Low-trust social attention, with provenance, observation times and visible limitation labels.
- Kept catalyst status Not verified even when primary-source evidence is present.
- Added a read-only thesis, invalidation and exit-plan review.
- Added a four-stage proposal-readiness panel that exposes missing exit plan and risk service while providing no form, button or submission path.
- Added an authenticated `GET /api/v1/symbols/{symbol}/workspace` read contract with `no-store`, strict bounded symbol validation, `404` for unknown symbols and no synthetic fallback.
- The API returns clock-relative synthetic quote/evidence timestamps, ordered trust evidence, explicit `dataMode: Synthetic`, and immutable false trading-authority/order-submission flags.
- Connected the Angular route to the authenticated REST snapshot with credentials and removed the hardcoded workspace fixture from the running page.
- Added strict runtime validation for canonical identity, symbol agreement, quote/metric shape, evidence hash, trust ordering, unverified catalysts and immutable false trading-authority flags.
- Bounded chart payloads to 500 strictly chronological `HH:mm` points with nonnegative prices; bounded evidence to 100 uniquely identified items observed no later than the workspace snapshot.
- Rejected negative relative-volume/spread values and added regression cases for duplicate/future evidence, negative chart prices, out-of-order chart points and negative relative volume.
- Added fail-closed loading, denied, unknown-symbol, unavailable, stale and invalid-response states. These states clear the workspace and show no quote, evidence or proposal content.
- Added an optional authenticated SignalR coordinator that first establishes the authoritative scanner sequence, reloads only relevant symbol updates, ignores duplicates and recovers through the REST snapshots after gaps or reconnects.
- Connection loss, incompatible events, sequence gaps and failed recovery immediately clear workspace content; access-denied recovery remains explicitly denied.

## Verification evidence

- Seven focused backend contract cases and three API-security cases retain prior pass evidence. A fresh .NET run is not claimed under the current pinned-runner constraint.
- Twenty-one focused Angular workspace/recovery tests pass, including the newly added payload-integrity cases and three parameterized HTTP-denial cases.
- `eng/verify-symbol-workspace-readiness.mjs` passes twelve controls across fourteen SHA-256-hashed artifacts and emits a fail-closed manifest with six explicit blockers.
- All 402 architecture and 62 API-security tests pass in the zero-warning Release build; EF reports no model drift.
- All 94 trading-portal tests, the Angular-boundary check and the warning-free 479.55 kB production build pass.
- Desktop verification at 1440 × 900 and narrow verification at 390 × 844 show no horizontal overflow or browser console warnings/errors.
- Browser semantics confirm the chart has an accessible image role, evidence order is Primary/Attributed/Low trust, catalyst remains unverified, and the page contains zero buttons and zero forms.

## Acceptance still required

- Complete hosted multi-client SignalR verification against the deployed backplane and real account/session lifecycle.
- Add approved charting behavior, quote/session semantics, corporate-action adjustments and provider attribution.
- Integrate governed catalyst-verification, editable thesis/journal persistence and the separately authorized risk/proposal workflow.
- Complete representative-user usability, keyboard, screen-reader, zoom, forced-colors, performance, data-volume and fault-state testing.
- Obtain Product, Risk, Frontend, UX/Accessibility, Data, Security and Operations accountable approvals and satisfy WBS 5.6/6.3 predecessors.

## Safety boundary

The workspace API and Angular view are synthetic and read-only. The page accepts data only after validating the API's explicit non-authority contract, and every error, disconnect, gap or stale state hides market/evidence content. Real-time wiring remains default-off outside controlled configuration. Neither surface contains a broker connection, account credentials, live data, order form, executable control, risk decision or proposal command. Scanner qualification, evidence trust and social attention never authorize a trade.
