# MAKH Trading Platform — Team and Capacity Plan

Last updated: 12 August 2026  
Status: Ready for staffing confirmation  
WBS: 0.3

## 1. Team model

Use a small cross-functional product team supported by named assurance and decision roles. People may cover multiple roles during early delivery, but responsibility, available capacity and conflicts must remain explicit.

## 2. Required capabilities

| ID | Capability / role | Core responsibility | Peak waves | Planning FTE range |
|---|---|---|---|---:|
| TC-01 | Sponsor | mandate, funding and stage/live go-no-go | C0, C7 | 0.05–0.10 |
| TC-02 | Product Owner | scope, priority, acceptance and stakeholder decisions | C0–C7 | 0.30–0.60 |
| TC-03 | Project Manager / Delivery Lead | plan, dependencies, RAID, reporting and gates | C0–C7 | 0.30–0.60 |
| TC-04 | Solution Architect | architecture, cross-cutting contracts and vendor decisions | C0–C3, C5 | 0.25–0.60 |
| TC-05 | Backend engineers | .NET domain/application/API/worker and integrations | C1, C3–C6 | 1.5–3.0 |
| TC-06 | Frontend engineers | Angular public/portal/UI/accessibility | C1–C6 | 1.0–2.0 |
| TC-07 | Data engineer | PostgreSQL, ingestion, quality, replay and retention | C1, C3–C6 | 0.5–1.5 |
| TC-08 | QA / automation / accessibility | test strategy, automation, E2E, accessibility evidence | C1–C7 | 0.75–1.5 |
| TC-09 | Security lead / engineer | threat controls, reviews, findings and live security gate | C0–C1, C5–C7 | 0.20–0.60 |
| TC-10 | Risk owner / SME | policy, tests, paper certification and containment | C0, C5–C7 | 0.20–0.50 |
| TC-11 | Operations / platform engineer | CI/CD, environments, observability, recovery and incidents | C1, C5–C7 | 0.50–1.0 |
| TC-12 | UX/product designer | research, design system, public and portal journeys | C0, C2, C4–C5 | 0.40–1.0 |
| TC-13 | Legal / compliance / privacy reviewer | jurisdiction, operating model, licensing, copy and records | C0, C2–C4, C7 | engagement-based |
| TC-14 | Data/vendor owner | definitions, contracts, entitlements and provider quality | C0, C3–C4 | 0.15–0.40 |

FTE ranges are planning hypotheses, not staffing commitments. Final schedule and budget require named people, calendars, vendor lead times and approved capacity.

## 3. Minimum viable team

For foundation through paper trading, maintain at least:

- one accountable Product Owner with recurring decision availability;
- one delivery/engineering lead;
- two implementation-capable engineers with frontend and backend coverage;
- one independent or separately accountable QA/security review path;
- access to risk, operations, data/vendor and legal/compliance decision makers.

If one person covers architecture, backend and operations, independent review is still required for security-critical, risk/order, production credential and live-release decisions.

## 4. Capacity allocation

- Plan no more than 70% of engineering capacity for committed feature work.
- Reserve approximately 15% for defects, dependency/vendor integration and technical discovery.
- Reserve approximately 10% for security, accessibility, quality and documentation evidence.
- Reserve approximately 5% for operational support/incident work once shared environments exist.
- Rebalance by wave; these are starting assumptions, not fixed budgets.

Critical approval roles must publish response-time expectations and delegate arrangements. A nominal role with no decision availability is treated as a schedule risk.

## 5. Staffing constraints

- No production/live secret custodian is assumed before Operations and Security assignments.
- No legal/compliance conclusion is inferred from delivery-team analysis.
- No Risk Owner approval is substituted by product or engineering convenience.
- External vendors may require procurement, onboarding and support lead times not included in engineering effort.
- Accessibility participant recruitment and independent security testing require planned external capacity.

## 6. Onboarding baseline

Every contributor reviews the charter, project memory, scope, relevant FSD, architecture/module boundaries, security model, data/API contracts, WBS acceptance rules and live-action prohibition. Access is least-privilege and removed when no longer required.
