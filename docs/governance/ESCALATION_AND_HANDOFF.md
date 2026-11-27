# MAKH Trading Platform — Escalation and Handoff Plan

Last updated: 12 August 2026

## Escalation severity

| Level | Trigger | Initial response target | Escalation |
|---|---|---:|---|
| E1 — Critical safety/security | known authorization/risk bypass, suspected unauthorized/live order, secret compromise, material broker-state uncertainty | immediate containment; notify within 15 min when operational | Incident commander, Security, Risk, Operations, Sponsor as required |
| E2 — Release/gate blocker | failed mandatory test, unresolved high finding, legal/vendor prohibition, unavailable accountable approval | same working day | PM to accountable gate owner; Sponsor if timing/scope impact |
| E3 — Delivery blocker | dependency, environment, design or decision blocks committed work | within one working day | Work owner → PM/Product/lead |
| E4 — Delivery issue | noncritical defect, ambiguity or improvement | normal backlog/refinement | Work owner and Product/Engineering |

Response targets are planning assumptions until support hours and named roles are approved.

## Safety-first response

For E1: stop new exposure or live enablement as applicable; preserve current order intent/idempotency keys; query/reconcile broker truth; revoke/isolate credentials or sessions when indicated; preserve evidence; communicate only verified state; recover through authorized workflows.

## Decision escalation path

- Scope/priority: Work owner → Product Owner → Sponsor for material change.
- Architecture: Engineer → Engineering Lead/Solution Architect → Sponsor if material business impact.
- Security/privacy: Contributor → Security/Privacy authority → Sponsor; affected release stops when required.
- Trading risk: Contributor → Risk Owner → Sponsor for capital/operating-model decision; new exposure fails closed.
- Legal/compliance/vendor rights: Contributor → qualified Legal/Compliance/Data Owner; affected capability stops pending decision.
- Operations: Engineer → Operations Owner → Incident/Sponsor path for material service impact.

## Handoff checklist

Each work-package handoff includes:

1. WBS ID, objective and acceptance status.
2. Changed artifacts/code and source-of-truth links.
3. Verification performed and environment/build identifiers.
4. Open defects, risks, assumptions and decisions.
5. Security, data, privacy, accessibility and operational impacts.
6. Migration/rollback/recovery details where applicable.
7. Required reviewer/owner and next action.
8. Explicit Paper/Live and external-publication status.

High-risk work is not handed off through chat alone. The receiving owner confirms acceptance or records remaining conditions.
