# MAKH Trading Platform — RAID Register

Last updated: 12 August 2026  
Owner: Project Manager  
Review cadence: weekly and at every stage gate

## Operating rules

- Types are Risk, Assumption, Issue and Dependency.
- Probability and impact use Low, Medium, High or Critical where applicable.
- Every open item has one accountable role, a trigger or due date, a response and evidence.
- Critical safety, security, compliance, data-integrity or live-trading exposure is escalated immediately under `ESCALATION_AND_HANDOFF.md`.
- Closed items remain in the register with closure evidence; they are never deleted.

## Active register

| ID | Type | Description | Probability | Impact | Accountable role | Trigger / due | Response or validation | Status |
|---|---|---|---|---|---|---|---|---|
| RAID-001 | Dependency | Sponsor and Product Owner are not yet named and authorized. | N/A | Critical | Sponsor | Before charter acceptance | Record named roles and authority in `CHARTER_APPROVAL.md`. | Open |
| RAID-002 | Dependency | Integrated delivery plan has not received Sponsor approval. | N/A | High | Sponsor | Before WBS 0.4 acceptance | Approve `INTEGRATED_PLAN_APPROVAL.md`; rebaseline affected dates if required. | Open |
| RAID-003 | Risk | Broker capability, eligibility and order behavior may not meet the platform contract. | High | Critical | Solution Architect | WBS 1.3 | Compare paper/live APIs, order types, events, rate limits, reconciliation and support; retain paper-first gate. | Open |
| RAID-004 | Risk | Market/reference/news/social data definitions, rights or quality may be unsuitable. | High | Critical | Data/vendor owner | WBS 1.4 | Validate licensing, provenance, float definition, latency, corrections and replay capability. | Open |
| RAID-005 | Risk | Low-float momentum instruments can have extreme spreads, halts, slippage and manipulation risk. | High | Critical | Risk Administrator | Risk design and every trading gate | Enforce price/float/RVOL rules as discovery filters only; require executable quote, liquidity, catalyst, exit plan and centralized risk approval. | Open |
| RAID-006 | Risk | Social signals may be false, manipulated or contractually restricted. | High | High | Legal / Compliance | Vendor selection and evidence release | Use permitted sources, limitation labels and independent catalyst verification; never authorize orders from social data alone. | Open |
| RAID-007 | Risk | Jurisdiction, entity, privacy, records and trading disclaimers are unresolved. | High | Critical | Legal / Compliance | WBS 1.2 and before public/live gates | Obtain qualified written advice and approved copy/retention rules. | Open |
| RAID-008 | Risk | Identity, hosting and observability vendors are undecided. | Medium | High | Solution Architect | Before Wave C1 | Complete evidence-based shortlists and ADRs; do not provision production or live secrets early. | Open |
| RAID-009 | Risk | Team capacity may not cover security, QA, accessibility and operations peaks. | Medium | High | Project Manager | Before each wave | Confirm named assignments, use capacity guardrails and block promotion when mandatory assurance roles are absent. | Open |
| RAID-010 | Assumption | MVP serves the owner as a self-directed trader; it does not provide advice or manage third-party accounts. | N/A | Critical | Product Owner | Scope and legal gates | Confirm in scope approval and legal analysis; raise a change request for any multi-user/advisory expansion. | To validate |
| RAID-011 | Assumption | Nasdaq/NYSE common shares are the initial universe and OTC is excluded. | N/A | High | Product Owner | Discovery gate | Validate provider/broker symbology and formal scope acceptance. | To validate |
| RAID-012 | Dependency | Representative-user usability and accessibility validation is required for UX acceptance. | N/A | High | UX Lead | WBS 2.6–2.8 | Execute the validation plan and retain measured findings/remediation evidence. | Open |
| RAID-013 | Risk | Order, execution or position divergence could create unintended exposure. | Medium | Critical | Backend Lead | Paper and live trading waves | Use idempotency, broker reconciliation, mismatch lockout, immutable audit and failure-blocks-new-entry behavior. | Open |
| RAID-014 | Risk | Formula/status records may overstate progress without acceptance evidence. | Medium | High | Project Manager | Weekly reporting | Require evidence links, independent gate review and explicit pending-approval status before completion. | Open |
| RAID-015 | Risk | Product features or monetization may constitute regulated advice, robo-advice or digital sub-broker activity in an applicable jurisdiction. | High | Critical | Legal / Compliance | Before external users, paid access or live flow | Confirm operator facts; obtain ISA 2025/U.S.-nexus classification and required registration or exclusion analysis. | Open |
| RAID-016 | Dependency | Controller/processor roles, lawful bases, DPIA and cross-border transfer safeguards are not approved. | N/A | Critical | Privacy owner | Before production personal data | Complete PR-01–12 and obtain qualified privacy acceptance. | Open |
| RAID-017 | Dependency | No reviewed individual live-broker route has passed eligibility and funding gates under the Nigeria-resident hypothesis. | N/A | Critical | Solution Architect | Before WBS 7.2/live planning | Confirm owner/entity/residence; obtain written provider eligibility; keep integration paper-only. | Open |
| RAID-018 | Risk | Paper simulators may materially differ from live fills, stops, complex orders, liquidity and partial-fill behavior. | High | Critical | Risk Administrator | Paper certification and live gate | Maintain paper limitation register, conservative risk assumptions, provider contract tests and separately approved live pilot. | Open |
| RAID-019 | Risk | Float definitions or stale/revised values may falsely include or exclude a security at the 500,000-share boundary. | High | Critical | Data owner | Scanner certification | Retain definition/date/source; compare samples to filings; treat ambiguity as not qualified. | Open |
| RAID-020 | Dependency | Market/news display, non-display calculation, retention and redistribution rights are not contracted. | N/A | Critical | Data owner | Before production provider use | Obtain signed rights schedule and implement entitlements/deletion controls. | Open |
| RAID-021 | Risk | Social data use may violate platform terms, privacy rights or deletion obligations and may amplify manipulation. | High | High | Legal / Compliance | Before any social adapter | Keep disabled until explicit commercial agreement, DPIA, minimization and deletion controls are accepted. | Open |
| RAID-022 | Dependency | Hosting region and cross-border safeguards cannot be approved until operator, controller, user and jurisdiction facts are confirmed. | N/A | Critical | Privacy owner | Before staging with real personal/trading data | Confirm facts, map data flows, verify service availability and obtain privacy/legal approval. | Open |
| RAID-023 | Risk | Managed-service recovery time may exceed the planning RTO even when PITR is available. | Medium | Critical | Operations Owner | Before paper production | Execute timed PITR, logical restore and application-redirection drills; block promotion on failure. | Open |
| RAID-024 | Risk | Telemetry volume, egress, HA, support or exchange-rate movement may make the cloud run rate exceed budget. | Medium | High | Sponsor | Before provider commitment and monthly | Obtain reproducible quotes, set budgets/alerts, measure paper workload and avoid premature commitments. | Open |

## Review record

| Review date | Reviewer | Added / changed / closed | Escalations | Evidence |
|---|---|---|---|---|
| 2026-08-12 | Codex preparation pass | RAID-001–014 established | None claimed | Initial governance package |
| 2026-08-12 | Codex hosting discovery pass | RAID-022–024 added | None claimed | `../hosting/` evaluation package |
