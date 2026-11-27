# WBS 9.6 — Residual Backlog and Lessons Learned

Date prepared: 14 August 2026  
Status: Working transition baseline — not accepted

## Residual backlog themes

| Priority | Theme | Required outcome before acceptance |
|---|---|---|
| Critical | Governance and accountable approvals | named owners, approved scope/budget/schedule and signed mandatory gates |
| Critical | Legal, broker and data rights | confirmed entity/jurisdiction, qualified opinions, provider eligibility/contracts and permitted use |
| Critical | Durable production architecture | PostgreSQL persistence, outbox, protected sessions/secrets, authoritative adapters and reproducible deployment |
| Critical | Trading safety integration | approved risk policies, live-impossible-by-default paths, OMS/broker/reconciliation durability and containment drills |
| Critical | Operations and recovery | telemetry backend, alerting/on-call, backup/PITR, incident/recovery measurements and support escalation |
| Critical | Independent assurance | security test, accessibility, performance/load/soak/chaos and Critical/High remediation/retest |
| Critical | Paper certification | authorized paper trial, metrics, defects, reconciliation/recovery and signed WBS 7.9 decision |
| Critical | Controlled-live governance | signed ORR/security/compliance/config/go-no-go followed by an authorized bounded pilot, if ever approved |
| High | UX and product validation | representative-user, accessibility and Product Owner acceptance across critical journeys |
| High | Evidence and records | immutable evidence archive, retention/legal hold, privacy rights, audit export and transition custody |

The detailed source of truth remains the 70-row WBS and each package acceptance record. This summary does not replace package-level dependencies or criteria.

## Lessons learned

1. Evidence maturity and operational authority must remain separate; local code/tests can raise progress without satisfying acceptance.
2. Paper-first and fail-closed boundaries prevented documentation work from silently becoming live capability.
3. Explicit `Not executed`, `Unsigned`, `Pending` and `Reject/Defer` states are essential controls, not administrative wording.
4. Provider, jurisdiction, hosting and accountable-owner decisions are critical-path inputs and should be resolved earlier in the next baseline.
5. Synthetic contracts and deterministic tests create valuable seams, but persistence, licensed data, broker truth and recovery drills remain different classes of evidence.
6. Formula-driven WBS updates and durable project memory reduce status drift, provided completion is never inferred from percent alone.
7. Performance signals such as 100%–600% gain must remain risk/watch inputs; no metric or pilot result can override authorization and hard risk controls.
8. Future work should prioritize gate-closing vertical slices and external decisions over creating more parallel in-progress packages.

## Restart recommendation

If work resumes, first convene governance and discovery decisions, assign named owners, select providers/hosting/identity, obtain qualified legal/privacy direction, and rebaseline. Then close predecessor gates in dependency order before expanding feature scope or revisiting controlled live.
