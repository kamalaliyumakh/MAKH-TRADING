# WBS 9.5 — Controlled-Live Pilot Operating Protocol

Date prepared: 14 August 2026  
Status: Preparation only — pilot prohibited by WBS 9.4 no-go

## Purpose and boundary

Define how a future, explicitly authorized controlled-live pilot would validate safety and operations using minimal approved capital. This protocol does not authorize a pilot, live account, credential, provider connection, entry-lock clearance or order. No return target or profit expectation is an acceptance criterion.

## Mandatory entry conditions

Every item must be satisfied for the exact release, environment, account and pilot window before a run can start:

1. WBS 7.9 paper certification and WBS 8.7 operational readiness are signed.
2. WBS 9.1 independent security testing is complete with all Critical/High findings closed and retested.
3. WBS 9.2 qualified legal/compliance, privacy, broker, data-rights and records approvals are signed.
4. WBS 9.3 segregation, live account/credential references, identity/MFA, hard limits and drills are verified.
5. WBS 9.4 is an authorized Go for the exact scope; its decision is unexpired and no condition is breached.
6. Release digest, SBOM, provenance, database migration, deployment and rollback evidence agree.
7. Named Trader, Risk, Operations, Security and Sponsor-authorized Pilot Owner are available with tested communications.
8. Entry lock begins true; provider health, calendar, data freshness, telemetry, broker/local reconciliation and zero-open-safety-defect checks pass before controlled clearance.

The current project satisfies none of these entry conditions as an approved whole. No run may begin.

## Roles and separation

| Role | Responsibility | Cannot self-approve |
|---|---|---|
| Pilot Owner | schedule, scope, evidence, daily continuation recommendation | final pilot acceptance |
| Trader | submit only approved intents within limits | risk/config changes or exception |
| Risk Owner | monitor capacity, loss, exposure and containment | own breach waiver |
| Operations | health, reconciliation, alerts, incidents and recovery | risk acceptance |
| Security | identity/MFA, privilege, credential and audit monitoring | business continuation |
| QA/Evidence | scenario coverage, metric integrity, defect and manifest review | D1/D2 waiver |
| Sponsor | authorize start/continuation/stop within signed conditions | technical evidence creation |

## Daily cadence

- Pre-open: verify gate validity, release/config/policy, LIVE presentation, masked account scope, approved capital/limits, market calendar, source freshness, telemetry, reconciliation, stop channels and evidence capture.
- Session: execute only scheduled low-exposure scenarios; monitor every intent, risk decision, broker state, execution, position, P&L, protection, reconciliation and alert by correlation ID.
- Post-session: block entries, cancel/reconcile as required, verify exposure/protection/cash, retain an integrity manifest, triage all deviations and obtain a continuation decision.
- Pilot review: compare cumulative exposure and evidence against authorized duration, trade count and capital; never extend scope implicitly.

## Immediate stop and capital-protection rules

Stop new entries immediately for any authorization/MFA failure, live/paper/account crossover, hard-limit breach or ambiguity, daily-loss threshold, unknown broker outcome, reconciliation mismatch, unprotected exposure, stale critical data, missing audit/telemetry, credential concern, D1/D2 defect, provider-rights concern, or expired/withdrawn approval.

Containment order is: entry block, idempotent cancellation, authoritative reconciliation, then separately authorized liquidation with fresh MFA, impact preview and second confirmation. Local shutdown never proves orders cancelled or positions flat.

Restart requires preserved evidence, root cause, corrective action, independent retest where applicable, clean broker reconciliation and authorized resumption by Risk, Operations, Security and Pilot Owner within the unexpired go decision.

## Exit criteria

All authorized sessions and scenarios have immutable evidence; zero unauthorized commands, duplicate live orders, risk bypasses or crossover events occurred; every unknown outcome was contained; reconciliation and protection meet approved thresholds; all D1/D2 defects are closed/retested; capital/loss/exposure stayed within approved ceilings; deviations and residual risks are accepted; and accountable owners sign the pilot report. WBS 9.6 closure remains a separate decision.
