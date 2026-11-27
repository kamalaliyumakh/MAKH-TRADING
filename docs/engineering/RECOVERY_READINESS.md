# WBS 8.6 — Recovery Exercise Readiness

## Status

In progress — 72%.

## Local control position

- Recovery type must be defined; target RPO and RTO must be positive.
- Exercise start/completion and optional recovery-point evidence require non-default UTC.
- Completion must follow start; recovery-point evidence is rejected for non-restore exercises.
- Authorized exercises fail closed on entry lock, isolated target, source preservation, checksums, migration/schema verification, authorization, telemetry, reconciliation, RPO and RTO.
- Unauthorized execution remains `NotExecuted`, requires the entry lock and cannot be promoted as recovery proof.
- The SHA-256 evidence digest now uses length-prefixed canonical fields and binds the approved RPO/RTO targets plus the execution-authorization decision.
- The exercise record explicitly requires target-policy, authorization and digest evidence.
- No recovery exercise has run; no RPO/RTO was measured and no defect was closed.
- No new focused cases are claimed: the retained historical baseline is 22 focused evaluator cases, 455 architecture tests and 66 API-security tests, none freshly executed at this checkpoint.
- The executable verifier hashes only hydrated, inspectable artifacts. Cloud-managed contracts, focused tests, backup/restore runbook and original acceptance files were unavailable for safe hydration and are explicit blockers rather than proof.

## Decision

`Local Evaluation Integrity Ready / Authorized Recovery Exercise and Accountable Acceptance Pending`.

## Remaining work

- Hydrate and freshly review/execute the contracts, focused tests, runbook and original acceptance package.
- Provision an isolated approved target and immutable authorization/change record.
- Execute PostgreSQL restore/PITR, dependency-failure and incident-response exercises.
- Capture content-addressed logs, manifests, reconciliation evidence, measured RPO/RTO and defects.
- Retest closed defects and demonstrate repeatability under supervised conditions.
- Obtain Data, Security, Risk, Operations, Product and Sponsor approvals.

## Safety boundary

This checkpoint runs no restore or incident drill, changes no environment or trading state, clears no entry lock and creates no operational, paper-trading or live-trading authority.
