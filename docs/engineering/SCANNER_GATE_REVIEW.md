# Scanner and Data-Quality Certification Gate Review

Date: 24 October 2026  
WBS: 5.8  
Accountable role: Product Owner  
Status: Gate package reconciled; certification blocked

## Recommendation

The synthetic scanner vertical slice is coherent enough for accountable review, but it is not certified for provider data, shared operation, paper trading, or live trading. Keep WBS 5.8 in progress and defer certification until every predecessor is accepted, commercial data rights and licensed replay are evidenced, multi-replica hosted operation is proven, and the required owners sign the gate record.

Readiness decision: **Reject / Defer — Licensed and Hosted Certification Pending**

## Gate evidence

| ID     | Criterion                                                                        | Result            | Evidence / remaining action                                                                                                                        |
| ------ | -------------------------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| SCG-01 | Canonical security identity and eligibility fail closed                          | Ready — 82%       | WBS 5.1 domain controls pass; persistence, provider mapping, pinned test rerun and approval remain pending                                          |
| SCG-02 | Quote/trade/bar/status normalization preserves provenance and quality            | Ready — 82%       | WBS 5.2 contract controls pass; licensed provider contract, recovery, pinned test rerun and approval remain pending                                 |
| SCG-03 | Float/shares/corporate-action reference facts are controlled                     | Ready — 82%       | WBS 5.3 contract controls pass; definitions, licensed reconciliation, persistence, pinned test rerun and approvals remain pending                  |
| SCG-04 | Price, gain, RVOL, float, spread and liquidity calculations are versioned        | Ready — 85%       | WBS 5.4 integrity controls pass; definitions, precision, persistence, licensed replay, pinned test rerun and approvals remain pending              |
| SCG-05 | Scanner runs are reproducible, qualified and deterministically ranked            | Ready — 93%       | WBS 5.5 local service controls pass; licensed replay, distributed execution, pinned test rerun and approvals remain pending                        |
| SCG-06 | Scanner UI exposes rules, quality, freshness, exclusions and risk                | Ready — 99%       | WBS 5.6 local UI controls pass; Safari/Edge, assistive technology, hosted/field, representative-user and accountable acceptance remain pending     |
| SCG-07 | Real-time deltas are sequenced and recover through snapshots                     | Ready — 99%       | WBS 5.7 local real-time controls pass; selected backplane, multi-replica hosted certification and accountable acceptance remain pending           |
| SCG-08 | Strategy boundaries remain visible and testable                                  | Pass — synthetic  | $3–$7, RVOL ≥3× and public float ≤500,000 are covered                                                                                              |
| SCG-09 | A 100%–600% gain never creates executable authority                              | Pass — local      | Service/UI safety tests pass; independent Risk/Product acceptance pending                                                                          |
| SCG-10 | Licensed point-in-time replay meets data-quality thresholds                      | Fail              | No approved vendor, entitlement, licensed dataset or certification replay exists                                                                   |
| SCG-11 | Persistence, correction, outbox, recovery and observability are operational      | Partial — local   | PostgreSQL persistence/outbox, append-only correction lineage and local recovery pass; shared backplane, telemetry and drills pending              |
| SCG-12 | Security, privacy, licensing, accessibility and performance evidence is accepted | Fail              | Local performance passes; external facts, hosted/field evidence, audits and accountable approvals remain pending                                   |
| SCG-13 | WBS 5.1–5.7 and foundation predecessors are accepted                             | Fail — dependency | WBS 3.8 and WBS 5.1–5.7 remain In Progress                                                                                                         |
| SCG-14 | Product/Data/Risk/Security/Engineering/Operations owners certify the gate        | Pending           | Approval record is unsigned                                                                                                                        |

## Certification blockers

| Finding                                                                                                                                | Severity              | Required disposition                                                               |
| -------------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------- |
| No market/reference-data provider, entitlement or permitted display/storage/replay rights are approved.                                | Critical licensing    | Complete WBS 1.4 due diligence and retain executed rights evidence.                |
| No licensed point-in-time dataset or sampled provider reconciliation exists.                                                           | Critical data quality | Run approved replay/reconciliation and record thresholds, exceptions and sign-off. |
| Multi-replica outbox/SignalR coordination and hosted correction replay are not certified.                                              | High reliability      | Select a shared backplane and prove hosted multi-replica correction recovery.      |
| Hosted capacity, soak, network/process chaos, freshness SLO, alerting and recovery drills are incomplete.                              | High operations       | Execute at approved representative capacity and retain reproducible evidence.      |
| Assistive-technology, actual zoom, manual OS preferences, supported-browser, hosted and representative-user validation are incomplete. | High usability        | Complete the remaining manual/hosted accessibility matrix and remediation.         |
| WBS 3.8 and WBS 5.1–5.7 lack accountable acceptance.                                                                                   | High governance       | Complete predecessor gates or record authorized, time-bounded exceptions.          |
| Product, Data, Risk, Security, Engineering and Operations approvals are missing.                                                       | Critical governance   | Record authorized decisions in the gate approval record.                           |

## Local verification snapshot

- Retained local baselines cover 384 API/architecture tests and 83 portal tests. Newly authored WBS 5.1–5.5 cases have not been added to that claim because the repository-pinned .NET 10 rerun timed out while reading generated `obj` files before compilation.
- The retained warning-free portal production build is 474.44 kB initial plus a 55.88 kB lazy SignalR chunk.
- Angular import boundaries pass.
- Nine authenticated Chromium cases pass at 1280 × 800, 640 × 800 and 320 × 800 across standard, forced-colors and reduced-motion modes with zero violations, active preference safeguards, no overflow or console errors. The 640 px case is a reflow proxy only. Two keyboard-only and text-spacing journeys pass sequential/reverse navigation, visible focus, route-safe skip-to-content, details, filtering, symbol-link, clipping and overflow checks.
- Reconnecting, recovering and stale states now display fail-closed guidance; corrected snapshots retain correction provenance without exposing an action control.
- Loading, empty, unavailable and permission-denied states suppress candidate evidence until authoritative access succeeds.
- Eight production-artifact compatibility cases pass in bundled Chromium, Firefox, WebKit and installed Google Chrome at desktop and 320 px. Shipping Safari and Edge remain untested.
- Three authenticated production-artifact performance runs pass the local budget. Worst observed LCP is 216 ms, CLS 0.000, load 198 ms and total blocking 47 ms; this is local lab evidence, not hosted field performance.
- Browser checks at 1280 px and 320 px confirm status/risk disclosure, zero order buttons, no horizontal overflow and no console warnings/errors.
- Executable WBS 5.1–5.7 readiness manifests pass their local checks, preserve negative authorization flags, hash their source evidence and retain explicit certification blockers.
- The gate verifier hashes the seven predecessor acceptance records and current persistence, hub, client, E2E, load/chaos, accessibility and performance evidence while retaining certification blockers.
- No provider, licensed data, shared/production environment, broker, paper operation, or live action is connected or authorized.

## Decision boundary

This gate package supports review only. Local synthetic tests demonstrate internal consistency, not accuracy against licensed markets or operational readiness. The decision is **Reject / Defer — Licensed and Hosted Certification Pending**. It does not authorize provider purchase, real-data ingestion, public/shared deployment, broker connectivity, paper trading, or live trading.
