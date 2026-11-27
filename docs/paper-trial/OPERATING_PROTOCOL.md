# WBS 7.8 — Paper-Trial Operating Protocol

## Purpose and boundary

Demonstrate that the approved release candidate can support repeatable, safe paper trading using a segregated paper broker account and permitted market data. The trial evaluates workflow, controls, reliability and operational readiness—not expected investment return and never live authority.

## Preconditions

The Trial Owner must record all items as satisfied before starting:

1. WBS 7.1–7.7 acceptance evidence and accountable conditional approval.
2. Selected broker eligibility, paper-account terms and API certification.
3. Market/evidence-data contracts permitting the intended display, storage, derived use and replay.
4. Segregated paper configuration with proof that no live credential/account/endpoint is present.
5. Approved risk policy, strategy scope, trading calendar, instruments and paper notional ceiling.
6. Authorized participants, role separation, fresh-MFA behavior and support/on-call coverage.
7. Tested monitoring, reconciliation, kill-switch, backup/recovery and evidence retention.
8. Release-candidate artifact digest, migrations, configuration versions and rollback decision.
9. No open D1/D2 defect or known authorization, risk, reconciliation or paper/live-separation bypass.
10. Signed start authorization from Product, Risk, Security, Operations and Sponsor-designated authority.

If any precondition becomes false, the trial is stopped and new entries remain blocked.

## Roles

| Role | Responsibility | Cannot self-approve |
|---|---|---|
| Trial Owner | schedule, scope, daily record and report | final certification |
| Trader | execute approved paper scenarios | policy/control changes |
| Risk Administrator | monitor limits, pauses, breaches and containment | own exceptional action review |
| Operations | health, alerts, incidents, recovery and evidence | risk acceptance |
| QA | scenario evidence, defect triage and retest | waive D1/D2 |
| Security | identity, privilege, secret and audit review | product acceptance |
| Product Owner | workflow/strategy-validation acceptance | Sponsor certification |

Named people and delegates must be recorded before the first run.

## Trial cadence

- Start-of-day: verify artifact/config/policy, PAPER banner, account identity, market calendar, source freshness, reconciliation and zero unresolved safety stop.
- During session: execute only scheduled scenarios; capture correlation IDs and timestamps; monitor order/execution/reconciliation/risk/alert timelines.
- End-of-day: block entries, reconcile orders/executions/positions/cash, retain signed evidence manifest, triage defects and record deviations.
- Weekly: review metrics by denominator, trend defects, assess coverage and authorize continuation.

## Immediate stop conditions

- Any live endpoint, credential, account or live-capable configuration is observed.
- Unauthorized order/control action, privilege failure or missing audit evidence.
- Unknown or mismatched broker order, execution, position, cash or buying-power state.
- Risk bypass, policy ambiguity, stale critical data or failure to enforce an entry block.
- Uncontained D1/D2 defect, security incident, vendor-rights breach or inability to reconcile/restore.

Stopping creates an incident record; it never converts unknown state to success. Restart requires containment, root cause, corrective evidence, clean reconciliation and authorized resumption.

## Exit criteria

All mandatory scenarios have accountable evidence; metrics meet approved thresholds with valid denominators; all D1/D2 defects are closed and retested; D3/D4 disposition is accepted; reconciliation and recovery drills pass; accessibility/usability evidence is complete; deviations and residual risks are explicit; and required roles sign the final report. Certification is a separate WBS 7.9 Sponsor decision.
