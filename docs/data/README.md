# MAKH Trading Platform — Data Architecture

Last updated: 12 August 2026  
WBS evidence: 2.3 — logical data model, retention and migration strategy

## Contents

- `LOGICAL_DATA_MODEL.md` — PostgreSQL schemas, entity catalogue, relationships and ownership.
- `DATA_INVARIANTS.md` — database-enforced integrity and concurrency requirements.
- `RETENTION_AND_PRIVACY.md` — classification, provisional retention, archival and deletion policy.
- `MIGRATION_AND_RECOVERY.md` — EF Core migration, deployment, rollback, backup and restore strategy.
- `../architecture/adr/ADR-0003-POSTGRESQL-SCHEMA-OWNERSHIP.md` — schema-per-module and append-only evidence decision.

The model is logical rather than executable DDL. Physical column sizing, indexes and partitions must be confirmed with measured workloads and selected provider contracts.
