# Portal and Provenance Gate Review

Date: 25 October 2026  
WBS: 6.7  
Accountable role: Product Owner  
Status: In progress — 95%; local controls pass, gate rejected/deferred

## Recommendation

The local synthetic evidence and portal workflows are coherent enough for accountable review, but the portal and provenance gate must not be signed. Keep WBS 6.7 In Progress until every predecessor is accepted, licensed content and privacy rights are evidenced, authoritative persistence and recovery are proven, representative accessibility/usability testing passes, and the required owners sign the approval record.

## Gate evidence

| ID     | Criterion                                                                                                   | Result            | Evidence / remaining action                                                                                                        |
| ------ | ----------------------------------------------------------------------------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| PPG-01 | News and filing records retain identity, chronology, provenance, rights and corrections                     | Pass — synthetic  | WBS 6.1 is 99%; local pipeline controls pass; licensed mapping, rights, hosted proof and approval remain pending                   |
| PPG-02 | Social attention is aggregate, limited, manipulation-labelled and never verifies a catalyst                 | Pass — synthetic  | WBS 6.2 is 99%; aggregate/privacy controls pass; permitted provider, DPIA, hosted operations and approval remain pending           |
| PPG-03 | Evidence matching, trust, deduplication and point-in-time snapshots are reproducible                        | Pass — synthetic  | WBS 6.3 is 99%; bounded immutable snapshot controls pass; licensed replay and protected storage remain pending                     |
| PPG-04 | Symbol workspace shows freshness, rule evidence, trust ordering and non-authority                           | Pass — local      | WBS 6.4 is 99%; bounded point-in-time UI and recovery controls pass; hosted/manual acceptance remains pending                      |
| PPG-05 | Dashboard distinguishes synthetic estimates from broker/risk/reconciliation authority                       | Pass — local      | WBS 6.5 is 99%; coherent bounded account evidence controls pass; authoritative sources and hosted/manual acceptance remain pending |
| PPG-06 | Journal records are scoped, versioned, reviewable and append-only audited                                   | Pass — local      | WBS 6.6 is 99%; lifecycle/content/browser controls pass; writes, PostgreSQL/privacy and accountable acceptance remain pending      |
| PPG-07 | Portal journeys pass representative accessibility, usability, performance and fault testing                 | Partial           | Automated desktop/narrow accessibility and fault checks pass; AT, actual zoom, representative usability and hosted proof remain    |
| PPG-08 | Licensed content, permitted social processing, retention and deletion controls are accepted                 | Fail              | Provider contracts, rights schedules, DPIA/privacy decisions and operational controls are absent                                   |
| PPG-09 | Evidence and journal facts persist with protected snapshots, audit and recoverable delivery                 | Partial           | Evidence PostgreSQL snapshots/outbox pass locally; journal persistence, protected objects and hosted reconstruction remain open    |
| PPG-10 | WBS 6.1–6.6 and required foundation/scanner predecessors are accepted                                       | Fail — dependency | WBS 6.1–6.6, 3.8 and applicable scanner predecessors remain In Progress                                                            |
| PPG-11 | Product, Data, Risk, Legal/Privacy, Security, UX/Accessibility, Engineering and Operations certify the gate | Pending           | Approval record is unsigned                                                                                                        |

## Acceptance blockers

| Finding                                                                                                                                        | Severity                   | Required disposition                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| No approved news/filing/social providers or explicit collection, display, storage, derived-data, deletion and replay rights exist.             | Critical legal/licensing   | Complete provider due diligence and attach executed rights schedules.                                |
| No DPIA or qualified privacy/records decision covers social aggregation, identifiers, retention, deletion, export and cross-border processing. | Critical privacy           | Complete and approve the privacy/records control set.                                                |
| Journal facts are not persisted, and licensed evidence replay/protected-object/hosted reconstruction evidence is incomplete.                   | High integrity/reliability | Complete journal PostgreSQL audit/outbox and hosted evidence reconstruction proof.                   |
| Portal data remains synthetic; authoritative providers, broker/risk/reconciliation services and deployed recovery proof are absent.            | High security/reliability  | Complete approved integrations and verify hosted isolation, revocation, recovery and reconciliation. |
| Representative keyboard, screen-reader, zoom, forced-colors, usability, performance, load and fault-state evidence is incomplete.              | High usability/quality     | Execute the approved test matrix and remediate findings.                                             |
| Catalyst-verification policy and accountable verification workflow are not approved or operational.                                            | High product/risk          | Approve the policy, roles, immutable decisions and user-facing language.                             |
| WBS 6.1–6.6 and applicable foundation/scanner predecessors lack accountable acceptance.                                                        | High governance            | Complete predecessor gates or record authorized, expiring exceptions.                                |
| Product, Data, Risk, Legal/Privacy, Security, UX/Accessibility, Engineering, QA and Operations approvals are missing.                          | Critical governance        | Record authorized decisions in the gate approval record.                                             |

## Local verification snapshot

- Current predecessor manifests report local-control PASS for WBS 6.1–6.6 while keeping every accountable acceptance flag false.
- Focused Angular verification passes for the symbol workspace (21), dashboard (23) and journal (17); prior backend/API evidence is retained but not claimed as freshly executed under the current pinned-runner constraint.
- Journal production-artifact Chromium audits pass at 1280 px and 320 px plus a denied state with zero WCAG A/AA axe violations, no overflow, journal controls or console errors.
- The gate verifier requires every WBS 6.1–6.6 acceptance record to be reconciled at 99%, consumes all six executable readiness manifests, runs twelve fail-closed checks, hashes seventeen artifacts and retains seven blockers.
- No provider, licensed content, database, protected archive, identity service, account, broker, risk engine, shared environment, paper operation or live action is connected or authorized.

## Decision boundary

This package supports review only. Synthetic consistency and local usability checks do not prove licensed provenance, privacy compliance, operational integrity or production accessibility. It does not authorize provider purchase, real-data ingestion, public/shared deployment, broker connectivity, paper trading or live trading.
