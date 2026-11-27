# MAKH Trading Platform — Quality Management Plan

Last updated: 12 August 2026  
Accountable owner: Project Manager  
Technical quality owner: Engineering Lead

## Quality objectives

| ID | Objective | Evidence / measure | Release consequence |
|---|---|---|---|
| QO-01 | Requirements are traceable to implementation and acceptance evidence. | WBS/requirement/test links; no unowned critical requirement | Gate blocked |
| QO-02 | Trading and risk behavior fails safe. | property, integration, chaos and paper-trial evidence | New entries blocked |
| QO-03 | Orders are authorized, idempotent and reconciled. | authorization, duplicate, partial-fill, timeout and mismatch tests | Trading promotion blocked |
| QO-04 | Market/reference/evidence data is reproducible and provenance-preserving. | contract, replay, correction and data-quality reports | Scanner/portal gate blocked |
| QO-05 | Security and privacy controls are verified throughout delivery. | threat/control traceability, SAST/SCA/secrets tests, access reviews and independent test | Promotion blocked |
| QO-06 | Angular experiences are accessible, usable and resilient. | automated/manual WCAG evidence, representative-user results and failure-state tests | UX/release gate blocked |
| QO-07 | Operations can detect, contain and recover failures. | SLOs, alerts, backup/PITR, incident and dependency drills | ORR blocked |
| QO-08 | Evidence accurately represents completion and approvals. | reviewable artifacts, named acceptance and formula/error checks | Status remains incomplete |

## Definition of ready

A work item is ready only when scope, accountable owner, dependencies, acceptance criteria, risk/security/privacy considerations, test approach, environment/data needs and required approvals are known. Critical unresolved dependencies remain visible and prevent commitment.

## Definition of done

Done requires implemented or authored output; peer review; required automated/manual tests; security and accessibility checks appropriate to the change; documentation and traceability; deploy/recovery evidence where applicable; no open release-blocking defect; and acceptance by the authorized role. Drafts awaiting external decisions remain in progress.

## Quality gates

| Gate | Mandatory checks | Accountable acceptance |
|---|---|---|
| Charter | governance, scope method, capacity, RAID/change/decision/quality controls | Sponsor |
| Discovery | legal, broker, vendors, hosting, scope and UX evidence | Sponsor |
| Architecture | architecture, threat model, data/API contracts and UX acceptance | Solution Architect |
| Foundation | builds, architecture tests, auth, migrations, CI security and environment readiness | Engineering Lead |
| Public Web | content/legal approval, accessibility, SEO, performance, privacy analytics and E2E | Product Owner |
| Scanner | provider contracts, calculations, replay, data quality, UI and recovery | Product Owner |
| Portal | provenance, accessibility, usability, authorization and workflow acceptance | Product Owner |
| Paper Trading | risk/OMS/reconciliation tests, paper trial metrics and defect closure | Sponsor |
| Operations | SLO, monitoring, access, backup/restore, incident and dependency drills | Project Manager |
| Controlled Live | independent security, legal/vendor/privacy, segregated credentials, limits, MFA, kill switch, rollback and explicit go/no-go | Sponsor |

## Defect policy

| Severity | Example | Required response |
|---|---|---|
| D1 Critical | unauthorized order, risk bypass, live/paper crossover, credential exposure, unreconciled exposure | stop/contain immediately; block promotion and new entries; E1 escalation |
| D2 High | material calculation, data, privacy, accessibility or recovery failure | block affected gate; prioritize correction and regression evidence |
| D3 Medium | degraded non-critical workflow with workaround | schedule with owner and due date; disclose at gate |
| D4 Low | cosmetic or minor documentation defect | backlog and address by agreed priority |

No D1 or D2 defect may be waived for controlled live. Any earlier-gate exception requires a time-bound, named risk acceptance from the accountable authority and cannot override security, legal or trading-safety prohibitions.

## Review and reporting controls

- Weekly status reconciles workbook formulas with evidence links and the RAID/change/decision logs.
- Gate packs include criteria, evidence, open findings, residual risk and named approval.
- Independent reviewers are used for security testing and any specialist legal/compliance conclusion.
- Metrics include weighted completion, escaped/blocked defects, test pass trends, vulnerability age, accessibility findings, reconciliation exceptions, provider-data quality and recovery objectives.
- Retrospective actions receive owners and due dates and enter RAID/change control when material.

