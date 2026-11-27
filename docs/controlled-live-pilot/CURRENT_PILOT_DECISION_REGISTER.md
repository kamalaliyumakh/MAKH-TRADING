# WBS 9.5 — Current Controlled-Live Pilot Decision Register

Register date: 28 October 2026  
Current decision: **DO NOT START**

## Immutable future pilot scope

| Field | Current value | Required accountable owner |
|---|---|---|
| Release digest, SBOM and provenance | Pending | Engineering / Security |
| Environment, deployment and migration identity | Pending | Operations |
| Broker, account and credential references | Pending | Operations / Security |
| Instruments, order types and scenario repetitions | Pending | Product / Risk |
| Pilot dates, session windows and duration | Pending | Pilot Owner / Operations |
| Capital, notional, position, loss and exposure ceilings | Pending | Risk / Sponsor |
| Participants, roles, backups and communications | Pending | Pilot Owner |
| Data/provider/calendar/freshness requirements | Pending | Data / Operations |
| Telemetry, reconciliation, recovery and evidence manifest | Pending | Operations / QA |

Any future decision is invalid unless it binds every field to immutable evidence, an effective window and a named accountable approver. A changed field requires a new decision; prior approval cannot be carried forward by implication.

## Accountable approvals

| Decision | Accountable role | State | Name | UTC date/time | Authorized signature/reference |
|---|---|---|---|---|---|
| Product scope acceptance | Product Owner | Pending | Pending | Pending | Pending |
| Risk limits and capital acceptance | Risk Owner | Pending | Pending | Pending | Pending |
| Operational readiness and window acceptance | Operations Owner | Pending | Pending | Pending | Pending |
| Security authorization | Security Owner | Pending | Pending | Pending | Pending |
| Compliance/legal authority | Qualified reviewer | Pending | Pending | Pending | Pending |
| Data/provider rights and readiness | Data Owner | Pending | Pending | Pending | Pending |
| Scenario/evidence plan acceptance | QA/Evidence Owner | Pending | Pending | Pending | Pending |
| Pilot ownership and staffing acceptance | Pilot Owner | Pending | Pending | Pending | Pending |
| Final start authorization | Sponsor | Pending | Pending | Pending | Pending |

## Decision rules

- All nine approvals must be authorized, current and bound to the same immutable scope.
- A condition, exception or waiver cannot bypass segregation, authorization, hard limits, entry lock, idempotency, reconciliation, audit, Critical/High remediation, qualified legal authority or evidence integrity.
- Any Fail, Pending, stale, conflicting, missing or revoked prerequisite preserves `DO NOT START`.
- Codex may prepare and verify evidence structure. Codex cannot approve, sign, waive, clear, allocate, connect, order, execute, attest results or authorize the pilot.

