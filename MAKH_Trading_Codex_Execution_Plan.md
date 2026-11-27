# MAKH Trading Platform — Codex Execution Plan

Version: 1.0  
Baseline date: 11 August 2026  
Source documents: MAKH Trading Platform BRD/PRD v1.0 and FSD v1.0  
Schedule baseline: 17 August 2026 to 2 June 2027 (ROM ±30%)

## Objective

Take the MAKH Trading Platform from approved requirements to a production-ready, paper-certified platform and then a separately authorized limited-capital live pilot. The target stack is Angular 22, .NET 10 LTS using Clean Architecture, and PostgreSQL 18.

The delivery rule is paper-first. Codex must not enable live credentials, place live orders, publish externally, or perform another consequential external action without explicit user authority and completion of the applicable project gates.

## Source of truth

- The WBS workbook is the project-control source of truth for scope, dates, dependencies, owners, status, completion and stage gates.
- The FSD is the functional and technical behavior source of truth.
- The BRD/PRD is the business-purpose and scope source of truth.
- Repository code, tests, migrations and generated API contracts become the implementation source of truth after approval.
- Conflicts are resolved in this order: explicit current user instruction, approved change request, FSD, BRD/PRD, WBS planning assumption.

## Codex operating protocol

For every implementation task, Codex shall:

1. Read the relevant approved requirements and any `AGENTS.md` instructions.
2. Inspect the current repository, branch, dependency versions, worktree status and related tests.
3. Confirm the WBS item, dependency gate and acceptance evidence being addressed.
4. Implement the smallest complete vertical slice that produces demonstrable value.
5. Keep domain and application logic independent of Angular, PostgreSQL and vendor implementations.
6. Add or update tests in proportion to risk, with mandatory coverage for authorization, risk, orders, reconciliation and migrations.
7. Run formatting, compilation, unit, integration, security and relevant end-to-end checks.
8. Record important architecture or vendor choices in an ADR.
9. Summarize files changed, checks run, known limitations and acceptance evidence.
10. Stop at any approval, vendor-credential, legal, live-trading or external-publication boundary that requires the user.

## Wave C0 — Architecture and decisions

WBS scope: 0.*–2.*  
Suggested branch: `codex/foundation-architecture`

Deliverables:

- Repository-ready solution architecture and dependency rules.
- Context, container, component and deployment views.
- API and SignalR contract baseline.
- PostgreSQL logical model and retention classification.
- Identity/session decision, threat model and security requirements.
- Angular route map, design tokens and approved UX flows.
- ADRs for modular monolith, identity, broker, data vendors and hosting.

Verification:

- Architecture dependency checklist passes.
- OpenAPI contract lints without errors.
- Data and threat models are reviewed.
- Vendor, hosting, identity and design decisions are signed.

Exit: WBS architecture gate 2.8 is complete.

## Wave C1 — Engineering foundation

WBS scope: 3.1–3.8  
Suggested branch: `codex/platform-foundation`

Deliverables:

- Angular workspace containing public web, portal and shared libraries.
- .NET solution containing Domain, Application, Infrastructure, API and Worker projects.
- PostgreSQL roles, schema conventions and controlled EF Core migrations.
- OIDC integration, policy authorization and MFA hooks.
- CI pipeline with compile, test, architecture, secret, dependency and migration gates.
- Development, test and staging infrastructure definitions.

Verification:

- Angular and .NET builds pass from a clean checkout.
- Architecture tests prohibit inward-layer dependency violations.
- Database migration applies and rolls forward in an isolated environment.
- Authentication and authorization smoke tests pass.
- Secrets scan and software bill of materials complete.

Exit: WBS foundation gate 3.8 is complete.

## Wave C2 — Public landing application

WBS scope: 4.1–4.6  
Suggested branch: `codex/public-web`

Deliverables:

- SSR/prerender public Angular application.
- Home, platform, security, about, status, risk and privacy routes.
- Versioned consent and request-access workflows.
- Responsive, accessible design system implementation.
- Privacy-safe analytics boundaries and approved security headers.

Verification:

- Unit and end-to-end tests pass.
- WCAG 2.2 AA-targeted checks pass for agreed journeys.
- Performance and SEO budgets pass.
- Legal, privacy and investment-risk wording is approved.

Exit: public-web milestone 4.6 is accepted.

## Wave C3 — Market data and scanner

WBS scope: 5.1–5.8  
Suggested branch: `codex/scanner`

Deliverables:

- Canonical security master and corporate-action handling.
- Market and reference-data provider ports and adapters.
- RVOL, spread, gain, liquidity and confidence calculations.
- Versioned scanner presets, runs, ranking and reproducible snapshots.
- Angular scanner, watchlists, saved views and risk badges.
- Sequenced SignalR quote/scanner updates with snapshot recovery.

Verification:

- Provider contract tests pass.
- Point-in-time replay produces reproducible candidates.
- Calculation property and boundary tests pass.
- Sequence gaps trigger safe resynchronization.
- Default $3–$7, RVOL ≥3 and float ≤500,000 filters are visible and testable.
- A 100%–600% gain cannot create executable authority.

Exit: scanner and data-quality gate 5.8 is signed.

## Wave C4 — Evidence and core portal

WBS scope: 6.1–6.7  
Suggested branch: `codex/portal-evidence`

Deliverables:

- News, issuer, filing and permitted social-data adapters.
- Evidence deduplication, entity matching, trust classification and snapshots.
- Symbol workspace, market-pulse dashboard and trading journal.
- Provenance labels and explicit social-signal limitations.

Verification:

- Evidence provenance and deduplication tests pass.
- Social data alone cannot confirm a catalyst.
- Portal accessibility and end-to-end journeys pass.
- Trade evidence can be snapshotted for later audit.

Exit: portal and provenance gate 6.7 is signed.

## Wave C5 — Risk engine and paper trading

WBS scope: 7.1–7.9  
Suggested branch: `codex/paper-trading`

Deliverables:

- Effective-dated risk policies and immutable rule decisions.
- Decimal-safe position sizing, exposure and daily-loss controls.
- Broker paper adapter and canonical order-state mapping.
- Idempotent order proposals, submission, cancellation and replacement.
- Execution, position, P&L and protective-order state.
- Broker reconciliation, mismatch lockout and kill-switch workflows.
- Angular order, position and risk consoles.

Verification:

- Risk property and boundary tests pass.
- Duplicate requests produce at most one intended broker order.
- Partial fills update confirmed position and protection quantities.
- Timeouts never cause blind order resubmission.
- Stale data, unknown broker state and mismatches fail closed.
- Paper end-to-end and recovery scenarios pass.
- Paper trial produces an approved performance and operations report.

Exit: paper-trading certification 7.9 is signed.

## Wave C6 — Reporting and production operations

WBS scope: 8.1–8.7  
Suggested branch: `codex/operations`

Deliverables:

- In-app and configured external notifications.
- Daily, strategy, execution, adherence and data-quality reports.
- Authorized audit evidence packages.
- Administrative portal with strict policy authorization.
- Metrics, logs, traces, alerts, SLO dashboards and runbooks.
- Backup, point-in-time recovery and incident-response procedures.

Verification:

- Report totals reconcile with orders, executions and positions.
- Export and administrative privilege tests pass.
- Restore, broker timeout, feed failure and mismatch drills pass.
- Production support ownership and escalation are documented.

Exit: operational-readiness gate 8.7 is signed.

## Wave C7 — Controlled live pilot and closure

WBS scope: 9.1–9.6  
Suggested branch: `codex/controlled-live`

Prerequisites:

- Paper certification is signed.
- Operational readiness is signed.
- Independent security review is approved.
- Legal, privacy, licensing and records reviews are approved.
- User explicitly authorizes any live credential configuration or live deployment action.

Deliverables:

- Remediated security findings.
- Segregated live configuration, MFA gates and tested kill switch.
- Limited-capital pilot release and monitored rollback window.
- Pilot evidence, open backlog, runbooks, ownership transfer and lessons learned.

Verification:

- Security and compliance evidence is complete.
- Live smoke checks do not bypass risk or authorization.
- Broker reconciliation and rollback drills pass.
- Pilot remains within approved capital and loss limits.

Exit: product completion certificate and operational handover 9.6 are accepted.

## Pull-request and change discipline

- One coherent work package or vertical slice per branch/PR.
- Branch prefix: `codex/`.
- Include WBS ID in the PR title or description.
- Do not mix unrelated refactoring with risk/order behavior changes.
- Every database change includes migration, compatibility note and recovery approach.
- Every external contract change updates OpenAPI/event schema and generated clients.
- Any scope, schedule, security, compliance or live-risk change is entered in the decision/change log before implementation.

## Completion definition

The platform is complete only when:

- All required WBS items and acceptance evidence are complete.
- No unresolved critical defect or known authorization/risk bypass exists.
- Paper certification, operational readiness, security and compliance gates are signed.
- Required backups and recovery exercises pass.
- The live pilot, if explicitly authorized, is accepted within approved limits.
- Documentation, source code, migrations, tests, runbooks, credentials ownership and backlog are handed over.

