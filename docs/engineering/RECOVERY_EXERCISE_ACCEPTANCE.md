# WBS 8.6 — Recovery Exercise Acceptance

## Status

In progress — 40% preparation maturity. No authorized recovery exercise has run.

## Delivered locally

- Fail-closed evaluator for PITR, logical restore, dependency-failure and incident-response evidence.
- RPO ≤5-minute and RTO ≤60-minute target evaluation without treating targets as guarantees.
- Mandatory entry lock, isolated target, source preservation, checksum, migration, authorization, telemetry and reconciliation checks.
- NotExecuted outcome when exercise authority is absent; promotion remains blocked.
- Deterministic SHA-256 evidence hash and explicit inability to clear entry lock or create live authority.
- Evidence construction rejects undefined exercise types and zero-duration timelines before evaluation.
- Artifact evidence requires an actual 64-character hexadecimal SHA-256 digest and canonicalizes it to lowercase before hashing.
- Ready-to-run `docs/operations/RECOVERY_EXERCISE_RECORD.md` that defaults every result to not executed/not measured.

## Verification

- 22 focused authorization, RPO/RTO, completeness, timeline, digest, invariant, redaction, hashing and authority tests pass.
- All 455 architecture tests and 66 API-security tests pass for the recorded build; the solution build has zero warnings and errors.

## Required execution evidence

- Authorized isolated PostgreSQL 18 PITR and logical-restore exercises using approved artifacts.
- Measured last durable transaction, requested/actual recovery point and complete UTC timeline.
- Schema, migration history, runtime DDL denial, authorization, telemetry and alert evidence.
- Order, execution, position, cash, risk and audit invariant reconciliation.
- Dependency failure and incident-response game days with containment, recovery and escalation results.
- Defect remediation/retest, restored-environment disposal/quarantine and Risk/Operations/Product approvals.

## Safety boundary

All passing cases are evaluator unit tests over synthetic evidence. They are not restore results. No database, cloud resource, provider, broker or environment was accessed; RPO/RTO were not measured; entry lock remains uncleared; promotion and paper/live authority remain blocked.
