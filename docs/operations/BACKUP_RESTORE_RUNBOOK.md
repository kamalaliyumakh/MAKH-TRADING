# Backup and Restore Runbook

## Preconditions

1. Record incident/change ID, source environment, recovery point and authorized operator.
2. Activate/confirm entry lock and stop order-producing workers.
3. Preserve broker/provider truth and current audit evidence independently.
4. Restore to a new isolated server; never overwrite the source during the drill.

## Restore exercise

1. Select a recovery point inside the configured PITR window and start the timer.
2. Restore PostgreSQL to an isolated network and identity boundary.
3. Apply only approved forward migrations using the migrator identity.
4. Verify the eleven approved module schemas, migration history, runtime DDL denial and representative immutable facts.
5. Start API/Worker with synthetic or approved paper credentials and `Platform__EntryLocked=true`.
6. Verify health, telemetry, authorization and secret references.
7. Reconcile orders, executions, positions and cash against authoritative broker evidence.
8. Measure last durable transaction (RPO) and service readiness time (RTO).
9. Keep entries locked until Risk, Operations and Product approve clearance.
10. Destroy or quarantine the restored test environment under the approved retention policy.

## Evidence

Record source/target resource IDs, engine/application versions, artifact digest/signature, requested and actual recovery points, UTC timeline, row/checksum samples, migration result, reconciliation differences, entry-lock proof, measured RPO/RTO, defects and approvals. A failed target or unresolved divergence blocks promotion; it is not waived by infrastructure availability.
