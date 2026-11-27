# WBS 9.6 — Current Transition and Closure Decision Register

Register date: 28 October 2026  
Current decision: **Reject / Defer closure**

## Immutable transition scope

| Field | Current value | Required accountable owner |
|---|---|---|
| Repository, release and evidence baseline | Pending | Engineering / Records Owner |
| Accepted product scope and exclusions | Pending | Product Owner |
| Residual backlog, defects, risks and technical debt | Pending | Project Manager / Engineering Lead |
| Production environments, integrations and operational service | Pending | Operations Owner |
| Security, privacy, records, legal and compliance obligations | Pending | Security / Qualified reviewer |
| Provider, broker, data-rights and commercial obligations | Pending | Data / Broker Owner |
| Support, incident, recovery and on-call ownership | Pending | Operations Owner |
| Funding, schedule, capacity and re-entry plan | Pending | Sponsor / Project Manager |
| Archive, retention, access, backup and evidence custody | Pending | Records Owner |
| Financial status, residual exposure and closure effective date | Pending | Sponsor / Finance Owner |

Any future acceptance must bind every field to immutable evidence, a named owner, an effective date and an authorized signature. A change to any field requires a new decision.

## Transition ownership areas

| Area | Required accountable owner | Acceptance state |
|---|---|---|
| Governance and scope | Sponsor / Project Manager / Product Owner | Pending |
| Legal, privacy and records | Legal/Compliance / Privacy Owner | Pending |
| Broker and providers | Broker Owner / Data Owner | Pending |
| Architecture and engineering | Engineering Lead / Solution Architect | Pending |
| Identity and security | Security Lead | Pending |
| Data, scanner and evidence | Data Owner / Product Owner | Pending |
| Risk, OMS and reconciliation | Risk Owner / Engineering Lead | Pending |
| UX and accessibility | Product Owner / Accessibility Lead | Pending |
| Operations and recovery | Operations Owner | Pending |
| Paper and controlled live | Sponsor / Product / Risk / Operations | Pending |
| Records and repository custody | Project Manager / Records Owner | Pending |

## Accountable closure approvals

| Decision | Accountable role | State | Name | UTC date/time | Authorized signature/reference |
|---|---|---|---|---|---|
| Product acceptance | Product Owner | Pending | Pending | Pending | Pending |
| Scope, schedule and backlog disposition | Project Manager | Pending | Pending | Pending | Pending |
| Engineering baseline and residual debt | Engineering Lead | Pending | Pending | Pending | Pending |
| Risk and security residual acceptance | Risk / Security Owner | Pending | Pending | Pending | Pending |
| Legal, compliance, privacy and records acceptance | Qualified reviewer | Pending | Pending | Pending | Pending |
| Operational handover | Operations Owner | Pending | Pending | Pending | Pending |
| Provider, broker and data-rights handover | Data / Broker Owner | Pending | Pending | Pending | Pending |
| QA, accessibility and evidence acceptance | QA / Accessibility Lead | Pending | Pending | Pending | Pending |
| Final project closure | Sponsor | Pending | Pending | Pending | Pending |

## Decision rules

- All ten transition-scope fields, eleven ownership areas and nine accountable approvals must be complete and consistent.
- An exception cannot waive mandatory gates, unresolved Critical/High findings, qualified legal authority, privacy/records duties, evidence custody, accepted operational ownership or Sponsor/Product acceptance.
- Any Fail, Pending, stale, conflicting, missing or revoked evidence preserves Reject/Defer.
- Codex may prepare and verify the transition baseline. Codex cannot accept, sign, waive, transfer, publish, close, authorize trading or attest that ownership has changed.

