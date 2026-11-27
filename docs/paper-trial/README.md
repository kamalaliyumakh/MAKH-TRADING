# Paper-Trial Evidence Pack

WBS 7.8 remains **In Progress**. This directory prepares the controlled paper trial; it does not prove that a trial, broker session, real-market-data session or certification has occurred.

## Documents

- `OPERATING_PROTOCOL.md` — authorization, roles, entry/exit, daily cadence and stop conditions.
- `SCENARIO_MATRIX.md` — mandatory normal, failure, recovery and containment scenarios.
- `METRICS_AND_DEFECTS.md` — definitions, denominators, thresholds and defect handling.
- `RUN_RECORD_TEMPLATE.md` — immutable per-session evidence record.
- `PAPER_TRIAL_REPORT_TEMPLATE.md` — final report and strategy-validation structure.
- `PAPER_TRIAL_READINESS_ACCEPTANCE.md` — readiness checklist and current gaps.
- `trial-readiness-state.json` — authoritative machine-readable precondition, scenario, approval and no-authority state.

## Executable readiness check

Run `node eng/verify-paper-trial-readiness.mjs` to verify the evidence-pack structure and produce `outputs/paper-trial/readiness-manifest.json`. The manifest must remain fail-closed with no executed trial, recorded result, gate acceptance, certification or live authority until authorized external evidence exists.

Only authorized people may populate actual results. Every result must identify the tested build, environment, paper account, data rights, policy version and retained evidence. Synthetic rehearsals must be labelled as rehearsals and cannot count toward paper certification.

The JSON state register is the current control source. Changing any `Pending` or `NotRun` value requires a retained evidence reference and accountable authorization; the verifier rejects fabricated completion, results, acceptance or authority.
