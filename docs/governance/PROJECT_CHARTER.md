# MAKH Trading Platform — Project Charter

Last updated: 12 August 2026  
Status: Ready for Sponsor and Product Owner approval  
WBS: 0.1

## 1. Mandate

Design, build and validate a risk-controlled platform for self-directed discovery and trading of selected low-priced U.S.-listed equities. The platform must separate candidate discovery, evidence verification, centralized risk approval and broker execution; preserve auditability; deliver paper trading before any separately authorized controlled-live pilot; and never imply guaranteed performance.

## 2. Objectives

1. Produce an accessible Angular public application and authenticated trading portal.
2. Implement a .NET Clean Architecture modular monolith with PostgreSQL as platform system of record.
3. Integrate approved market/reference/evidence providers and an eligible regulated broker through provider-neutral ports.
4. Enforce pre-trade, intraday and operational risk controls with idempotent orders and broker reconciliation.
5. Make every material signal, decision, policy, order, execution, correction and privileged action reconstructable.
6. Certify paper trading, security, recovery and operational readiness before any controlled-live decision.

## 3. Success measures

- No known authorization or hard-risk bypass.
- Duplicate requests produce at most one intended broker order.
- Critical stale/unknown/mismatched state blocks new exposure.
- Paper workflows pass risk, order, partial-fill, timeout, reconciliation and kill-switch tests.
- Critical public and portal journeys meet agreed WCAG 2.2 AA-targeted evidence.
- Legal/compliance, broker eligibility, vendor licensing, security and operations gates are recorded before live.
- A completed trade/incident can be reconstructed from evidence through final broker outcome.

## 4. Scope authority

The approved scope baseline is `docs/discovery/SCOPE_BASELINE.md`. The Product Owner owns product scope and acceptance within charter constraints. The Sponsor approves material scope, funding, schedule and stage changes. Neither role may waive legal restrictions, security/risk release gates or explicit user authority for live/external consequential actions.

## 5. Non-negotiable guardrails

- Self-directed owner-only operating model until separately approved.
- No custody, third-party fund management or advisory discretion in MVP.
- Paper before controlled live; live credentials and capital remain segregated.
- Central risk approval before broker submission.
- Social signals and extreme gain never independently authorize an order.
- Fail closed for new exposure on critical identity, risk, data, broker or reconciliation uncertainty.
- Idempotent order mutation, query-before-retry and continuous reconciliation.
- Immutable/corrective-fact evidence for risk, orders, executions and audit.
- No external publication, live order or production credential without explicit authority and applicable signed gates.

## 6. Governance roles

| Role | Charter accountability | Named person |
|---|---|---|
| Sponsor | Business mandate, funding, material scope/schedule, stage go/no-go and final live authorization | Pending confirmation |
| Product Owner | Product value, prioritized scope, acceptance criteria, UX/product acceptance | Pending confirmation |
| Project Manager | Integrated plan, dependencies, RAID, reporting, change control and gate evidence | Codex-supported; accountable human pending |
| Solution Architect | Architecture integrity, cross-cutting decisions and architecture gate recommendation | Pending assignment |
| Security Lead | Threat/control baseline, security acceptance and critical finding disposition | Pending assignment |
| Risk Owner / Risk Administrator | Trading-risk policy, non-bypassable limits, paper/live risk acceptance | Pending assignment |
| Legal / Compliance | Jurisdiction, entity, operating-model, disclosures, licensing, privacy and records advice | Qualified reviewer pending |
| Engineering Lead | Build quality, technical delivery, CI/CD and engineering readiness | Pending assignment |
| Operations Owner | Environments, providers, observability, backup/recovery and operational readiness | Pending assignment |
| Data Owner | Provider definitions, quality, licensing, lineage and retention | Pending assignment |
| QA / Accessibility Lead | Test strategy, release evidence and accessibility verification | Pending assignment |

One person may hold multiple roles initially, but conflicts and unavailable segregation must be recorded. No one approves their own high-risk exception alone.

## 7. Stage gates

| Gate | Accountable approval | Minimum evidence |
|---|---|---|
| Charter | Sponsor | Named roles, charter, integrated plan and controls |
| Discovery | Sponsor | Product scope, jurisdiction, broker, data and hosting decisions |
| Architecture & UX | Sponsor on recommendations | Architecture/security/data/API plus accepted public/portal UX |
| Foundation | Engineering Lead | Builds, CI, migrations, authorization smoke and secret/SBOM gates |
| Public web | Product Owner + Legal/Privacy | Usability/accessibility, approved copy/privacy and security controls |
| Scanner/data | Product Owner + Data Owner | Replay/quality/licensing and UX acceptance |
| Evidence/portal | Product Owner + Data/Legal as applicable | Provenance, accessibility and portal acceptance |
| Paper trading | Risk Owner + Product Owner | Risk/order/reconciliation certification and paper broker approval |
| Operational readiness | Operations Owner + Security Lead | Restore, incident, monitoring, access and evidence drills |
| Controlled live | Sponsor + Risk + Security + Legal/Compliance + Operations | All prior gates, explicit capital/loss limits and written go/no-go |

## 8. Delivery method

Work proceeds in evidence-gated increments. A task is complete only when its acceptance evidence exists. Documentation, decisions, tests and WBS status change together. Human/vendor/legal approvals are never inferred from technical completion.

## 9. Charter constraints

- Named roles, budget, capacity, jurisdiction, entity, vendors and hosting remain unresolved.
- Dates and estimates in the current WBS are planning assumptions until the integrated plan is approved.
- Codex may prepare artifacts and implement authorized local project work but cannot provide business, legal, compliance, security-risk or live-trading approval on behalf of accountable humans.
