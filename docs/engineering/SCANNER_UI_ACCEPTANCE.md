# WBS 5.6 — Scanner UI Acceptance

Date reconciled: 24 October 2026  
Status: In progress — 99%

## Delivered locally

- Added the authenticated portal route `/app/scanner` with a deterministic synthetic scanner snapshot.
- Displayed the preset/version, run identity, calculation version, as-of time, snapshot hash, and Complete/Partial/Failed quality context.
- Presented qualification rules and deterministic ranking context alongside price, gain, RVOL, public float, spread, dollar volume, risk, and exclusion evidence.
- Added Qualified, All, and Excluded views without turning scanner results into order authority.
- Added an accessible six-stage candidate funnel covering universe, price, RVOL, public float, gain and final qualification without implying trade quality.
- Added compact gain and RVOL metric bars while preserving exact text values.
- Added explicit stale/partial-data and extreme-move warnings; a 100%–600% gain is treated as elevated risk, never as a buy instruction.
- Implemented responsive table-to-card behavior with no horizontal viewport overflow at 320 CSS pixels.
- Preserved the paper-first boundary: the scanner contains no buy, sell, or order-entry control.
- Added explicit fail-closed guidance for reconnecting, recovering and stale states. Corrected snapshots retain their correction reason in a live status region without creating an action control.
- Added authoritative loading and empty states plus fail-closed unavailable and account-denied states. Candidate evidence is suppressed until authoritative access succeeds.

## Verification evidence

- Scanner page and real-time tests cover loading, empty, connected, reconnecting, recovering, stale, failed, denied and corrected states; all 83 trading-portal tests pass.
- Eight production-artifact compatibility cases pass in bundled Chromium, Firefox, WebKit and installed Google Chrome at desktop and 320 px; shipping Safari and Edge remain untested.
- The production portal build passes without warnings at 394.06 kB raw and 101.01 kB estimated transfer size.
- Angular import-boundary verification passes.
- Browser checks at 1440 × 900 and 390 × 844 confirm responsive funnel rendering, metric bars, state filtering, risk/exclusion disclosure, zero order buttons, and no horizontal document overflow.
- Browser console inspection found no errors or warnings during the tested workflow.
- The 26 August 2026 scanner-to-risk UAT corrected 68% `SYNA` from Qualified to Excluded, verified the 100%–600% gain stage and confirmed all exclusion reasons in the browser.

## Acceptance still required

- Replace the synthetic snapshot service with the authorized REST snapshot and recoverable SignalR delta contract from WBS 5.7.
- Verify loading, empty, failed, disconnected, reconnecting, corrected, and permission-denied states against the real integration.
- Local authenticated Chromium axe now passes at 1280, 640 and 320 px in standard, forced-colors and reduced-motion modes after remediating filter, state-badge and high-contrast shell defects. The 640 px case is a reflow proxy only. Two keyboard-only and text-spacing journeys also pass sequential/reverse navigation, visible focus, skip-to-content, details, filtering, symbol-link, clipping and overflow checks after remediation of a route-losing skip link. Three authenticated production-artifact performance runs pass the local budget. Complete assistive-technology, actual zoom, manual OS-preference, hosted/field performance, representative-user and shipping Safari/Edge evidence.
- Obtain Product, Risk, UX, Accessibility, Backend, and Frontend accountable approvals after predecessor gates.

## Safety boundary

This page is discovery and decision-support UI only. It does not recommend a security, create an order, bypass suitability or risk controls, or authorize paper/live trading. Data is synthetic and no broker, licensed market-data feed, database, or external service is connected.

## Readiness decision

The executable readiness gate reconciles the fail-closed UI states, safety boundary, accessibility, performance, browser compatibility and current WBS 5.5 predecessor. Decision: `Local UI Ready / Hosted and Accountable Acceptance Pending`. This does not authorize production data, an order action, paper trading or live trading.
