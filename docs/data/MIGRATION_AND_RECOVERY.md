# MAKH Trading Platform — Migration and Recovery Strategy

Last updated: 12 August 2026

## 1. Migration ownership

- EF Core migrations are generated and reviewed from module-owned mappings in a dedicated migrations project.
- CI checks for model drift, destructive operations, unbounded data rewrites, missing compatibility notes and migration naming/order.
- A deployment identity applies migrations; API/worker runtime roles cannot alter schema.
- Applied migrations and application build identifiers are observable in health/release evidence.
- Production migration is an explicit deployment step, never automatic application startup behavior.

## 2. Expand, migrate, contract

1. **Expand:** add nullable columns, new tables/indexes or compatible views without breaking the running version.
2. **Deploy compatible code:** read old/new safely and write the required transitional representation.
3. **Backfill:** use resumable, bounded, observable jobs with checkpoints; do not hold long transactions.
4. **Validate:** reconcile counts, constraints, checksums and business invariants.
5. **Switch:** enable the new path through a controlled deployment flag that cannot bypass risk/authorization.
6. **Contract later:** remove old columns/contracts only after rollback compatibility expires and evidence is approved.

High-lock indexes/constraints use PostgreSQL online-safe patterns where supported and are rehearsed on production-like volume. Transactional and non-transactional migration steps are separated explicitly.

## 3. Change risk classes

| Class | Example | Required evidence |
|---|---|---|
| Low | additive nullable field or lookup row | compile/integration test and rollback note |
| Medium | index, backfill, new constraint or type widening | production-like timing/lock test and validation query |
| High | rename/drop, type conversion, partition change or order/risk data rewrite | architecture/data/security review, backup/restore point, rehearsal and go/no-go |
| Prohibited direct change | delete/overwrite execution, risk decision or audit history | new corrective fact and audited repair workflow instead |

## 4. Rollback and roll-forward

Application rollback is supported within the declared compatibility window. Database rollback scripts are used only when demonstrably lossless. Once new-version writes make reversal unsafe, recovery is roll-forward through a corrective migration. Destructive changes require verified backup/PITR and delayed contraction; down-migration is not assumed safe.

Each change record contains purpose, affected modules/tables, compatibility window, estimated locks/duration, backfill/reconciliation queries, failure threshold, roll-forward/rollback action and owner.

## 5. Seed and reference data

- Migrations create schema, constraints and immutable bootstrap codes only.
- Venues, calendars, providers, risk templates and other reference data use versioned idempotent import commands with provenance and effective dates.
- No live account, credential, entitlement or permissive risk policy is seeded.
- Development/test seed data is synthetic and clearly non-live.

## 6. Backup, restore and continuity

| Control | Baseline |
|---|---|
| Backups | encrypted managed backups plus continuous WAL/PITR where supported |
| RPO planning target | ≤ 5 minutes for live trading data; validate with selected hosting service |
| RTO planning target | ≤ 60 minutes for critical paper/live service; validate operationally |
| Restore cadence | automated verification regularly; full staging exercise at least quarterly and before live |
| Evidence archive | independent checksummed object retention; keys and restore access tested |
| Cross-region | decision deferred to hosting/risk assessment; live gate requires documented choice |

Restored platform state is not automatically trusted for trading. Recovery enters maintenance/entry-lock mode, restores database and evidence, validates migration/version/checksums, reconciles all orders/executions/positions/buying power with the broker, refreshes current market/session state, and requires authorized clearance before new entries.

## 7. Migration and recovery tests

- Create an empty database and migrate to current.
- Upgrade from the prior supported release with representative data.
- Re-run deployment/idempotent reference imports safely.
- Exercise concurrent old/new application compatibility during expand/contract windows.
- Verify constraints and domain invariants after backfill.
- Measure locks, duration, replication/WAL impact and worker backlog.
- Restore to a point in time, verify checksums/evidence links, then reconcile broker truth.
- Prove runtime roles cannot execute DDL or delete immutable records.

Paper release requires clean migration and restore rehearsal. Controlled live additionally requires selected-service RPO/RTO evidence, broker reconciliation after restore and signed operational go/no-go.
