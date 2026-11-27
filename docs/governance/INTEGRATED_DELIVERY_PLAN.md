# MAKH Trading Platform — Integrated Delivery Plan

Last updated: 12 August 2026  
Status: Ready for governance approval  
WBS: 0.2

## 1. Planning basis

- Planning window: 17 August 2026 to 2 June 2027.
- Estimate class: ROM ±30% until roles, capacity, vendors, jurisdiction and hosting are confirmed.
- Control source: `outputs/makh-wbs/MAKH_Trading_Platform_WBS.xlsx`.
- Delivery source: `MAKH_Trading_Codex_Execution_Plan.md`.
- Scope source: `docs/discovery/SCOPE_BASELINE.md`, subject to Product Owner approval.
- Work advances by evidence gates, not dates alone.

Dates do not override missing legal, security, risk, vendor, accessibility or live-authorization evidence.

## 2. Delivery method

Use iterative, vertical-slice delivery with explicit stage gates:

1. Select the highest-priority dependency-ready WBS item.
2. Confirm scope, acceptance evidence and accountable reviewer.
3. Implement the smallest end-to-end slice that demonstrates the behavior.
4. Run risk-proportionate quality, security and accessibility checks.
5. Record decisions, limitations and evidence.
6. Obtain required human/vendor approval before marking a gated item complete.

Planning uses two-week working iterations for coordination, while production releases remain evidence-driven. Architecture, risk, order, reconciliation and migration changes receive focused review and are not mixed with unrelated refactoring.

## 3. Delivery waves

| Wave | WBS | Outcome | Exit authority/evidence |
|---|---|---|---|
| C0 | 0.*–2.* | Governance, discovery, architecture, contracts and UX | Sponsor-approved architecture gate 2.8 |
| C1 | 3.1–3.8 | Buildable Angular/.NET/PostgreSQL foundation | Engineering foundation gate |
| C2 | 4.1–4.6 | Accessible public application | Product/legal/privacy acceptance |
| C3 | 5.1–5.8 | Reliable market-data and scanner capability | Data-quality and licensing gate |
| C4 | 6.1–6.7 | Evidence, symbol workspace, dashboard and journal | Product/provenance/accessibility gate |
| C5 | 7.1–7.9 | Central risk and certified paper trading | Risk/Product paper certification |
| C6 | 8.1–8.7 | Reporting and production operations | Operations/Security readiness |
| C7 | 9.1–9.6 | Separately authorized limited-capital live pilot | Multi-party live go/no-go and closure |

## 4. Scope control

- In scope and out of scope are governed by `SCOPE_BASELINE.md`.
- Product Owner prioritizes within approved scope.
- Sponsor approves material budget, schedule, operating-model or stage changes.
- Legal/compliance, risk and security constraints cannot be traded away as ordinary product priority.
- Changes affecting asset class, jurisdiction, third-party accounts, autonomy, custody, risk authority, live execution, providers, privacy or retention require formal impact assessment.

## 5. Schedule control

- WBS dependencies are finish-to-start unless the approved record states otherwise.
- Work may be prepared ahead of an approval gate, but completion and dependent release authority remain blocked.
- Baseline dates change only through approved reforecast/change control; actual status is reported separately.
- Critical-path assumptions are reviewed weekly.
- Forecast uses remaining effort, actual capacity, unresolved decision dates and gate lead time—not percentage-complete extrapolation alone.
- Schedule variance thresholds: Green ≤5 working days, Amber 6–15, Red >15 or a missed mandatory gate.
- A date-driven shortcut cannot bypass testing, security, risk, reconciliation, accessibility or human approval.

## 6. Environment plan

| Environment | Purpose | Data/credential rule | Promotion evidence |
|---|---|---|---|
| Local development | Unit work and local integration | Synthetic fixtures, emulators or vendor sandbox only | Local build/tests |
| Shared test | Contract/integration/E2E automation | Dedicated synthetic users/accounts and non-production secrets | Automated quality gates |
| Staging | Production-like migration, security and recovery rehearsal | Paper broker; masked/synthetic data; non-live credentials | Release candidate, migration and recovery evidence |
| Paper production | Operational paper trial with permitted real market data | Paper broker account only; segregated configuration and visual mode | Paper certification |
| Live production | Limited-capital controlled pilot | Separate live accounts, credentials, allowlists and approvals | Signed controlled-live go/no-go |

Production data is not copied into lower environments. Runtime, migration and privileged identities are separate where supported. Hosting selection and exact regions remain DEC-004.

## 7. Release and promotion

- Build once; promote the same signed/identified artifact through environments.
- Configuration and secrets are environment-specific and externally managed.
- Database changes follow expand/migrate/contract and are rehearsal-tested.
- Releases expose build, migration, contract and configuration-version identifiers.
- Rollback is allowed only when data-compatible; otherwise roll forward through corrective migration.
- A restored trading environment starts entry-locked and reconciles broker truth before clearance.

## 8. Reporting cadence

| Cadence | Audience | Content | Owner |
|---|---|---|---|
| Continuous | Delivery team | Build/test/security results and task evidence | Engineering/QA |
| Daily when active | Delivery team | Work completed, next work, blockers and decision needs | Work-package owner |
| Weekly | Sponsor/Product/leads | WBS progress, milestone forecast, RAID, decisions, change and gate readiness | Project Manager |
| Fortnightly | Stakeholders | Demonstration, acceptance feedback, forecast and reprioritization | Product Owner/PM |
| Monthly | Sponsor/governance | Budget/capacity, critical risks, vendor/legal status and stage forecast | Sponsor/PM |
| Gate-specific | Accountable approvers | Evidence checklist, exceptions, residual risks and decision record | Gate coordinator |
| Incident | Authorized response roles | Safety state, broker exposure, containment, evidence and recovery | Incident commander |

## 9. Status definitions

| Status | Meaning |
|---|---|
| Not Started | No accepted work evidence yet |
| In Progress | Work evidence exists but acceptance is incomplete |
| Complete | Acceptance evidence and all required approvals exist |
| Blocked | Approved work cannot progress because a specific dependency/authority/external state is unavailable |

Percent complete expresses evidence maturity, not permission to use a feature. Gate status and live authorization are always explicit.

## 10. Quality and completion

Each work package declares requirements, implementation/design evidence, verification, residual risks, reviewer and decision. High-risk paths require automated tests and operational drills in their delivery waves. No known critical authorization/risk bypass may cross a release gate.

## 11. Planning assumptions requiring approval

- Sponsor, Product Owner, accountable delivery leads and actual capacity.
- Budget and procurement lead times.
- User jurisdiction and legal entity.
- Identity, broker, market/evidence and hosting vendors.
- Supported browser/assistive-technology policy.
- Final RPO/RTO, retention and live capital/loss ceilings.
