# Recovery Exercise Record

Status: Not executed — template only

## Authorization and scope

- Exercise ID:
- Incident/change ID:
- Exercise type: PITR / logical restore / dependency failure / incident response
- Authorized operator and approval reference:
- Source environment/resource:
- Isolated target environment/resource:
- Application artifact digest:
- Requested recovery point (UTC):
- Approved RPO target and policy version:
- Approved RTO target and policy version:
- Execution authorization decision and immutable approval reference:

## UTC timeline

| Event | Time | Evidence reference |
|---|---|---|
| Entry lock confirmed and order-producing workers stopped | Not executed | Pending |
| Restore/exercise started | Not executed | Pending |
| Database available | Not executed | Pending |
| Migrations/invariants verified | Not executed | Pending |
| API/worker ready while entry locked | Not executed | Pending |
| Reconciliation completed | Not executed | Pending |
| Exercise completed | Not executed | Pending |

## Verification and measures

- Source preserved and target isolated: Not tested
- Backup/checksum verified: Not tested
- Twelve schemas and migration history verified: Not tested
- Runtime DDL denial and authorization verified: Not tested
- Telemetry and required alerts verified: Not tested
- Orders, executions, positions and cash reconciled: Not tested
- Last durable transaction (UTC): Not measured
- Measured RPO versus ≤5-minute target: Not measured
- Measured RTO versus ≤60-minute target: Not measured
- Defects and containment: None recorded because no exercise ran
- Evaluation evidence digest: Not generated

The evaluation digest must bind the complete exercise evidence, approved RPO/RTO targets and execution-authorization decision using unambiguous field framing. Re-evaluation under different targets or authorization must produce a different digest.

## Outcome

Not executed. Promotion remains blocked. This template cannot clear the entry lock, certify recovery, or authorize paper/live operation. Risk, Operations and Product approval records are required after an authorized successful exercise.
