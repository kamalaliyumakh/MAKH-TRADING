# PostgreSQL Foundation Acceptance — WBS 3.4

Last updated: 2 October 2026

## Acceptance status

Implementation evidence is ready. WBS 3.4 remains **In Progress at 98%** until WBS 3.1 is accepted, all sixteen migrations are certified on PostgreSQL 18, and the Data Engineer signs this record.

| ID      | Acceptance criterion                                                                                                                      | Evidence                                                                                                       | Status  |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------- |
| PGF-01  | PostgreSQL EF Core provider is centrally pinned for .NET 10.                                                                              | `Directory.Packages.props`                                                                                     | Pass    |
| PGF-01A | NuGet restore graph is committed and locked.                                                                                              | project `packages.lock.json` files; locked restore                                                             | Pass    |
| PGF-02  | Persistence implementation remains in Infrastructure.                                                                                     | `src/MAKH.Infrastructure/Persistence`                                                                          | Pass    |
| PGF-03  | Migrations use a separate deployment executable.                                                                                          | `src/MAKH.Migrations`                                                                                          | Pass    |
| PGF-04  | API and Worker do not automatically migrate or create databases.                                                                          | composition roots and migration executable                                                                     | Pass    |
| PGF-05  | Approved logical schemas are created centrally.                                                                                           | initial migration; eleven-schema smoke assertion                                                               | Pass    |
| PGF-06  | Owner, migrator, runtime and read-only roles are idempotent non-login groups.                                                             | `deploy/postgres/roles.sql`; bootstrap executed twice                                                          | Pass    |
| PGF-07  | Public schema creation is revoked from PUBLIC.                                                                                            | role bootstrap SQL                                                                                             | Pass    |
| PGF-08  | Runtime role cannot create objects in module schemas.                                                                                     | `has_schema_privilege` smoke assertion                                                                         | Pass    |
| PGF-09  | Runtime and read-only grants are applied through owner default privileges.                                                                | initial migration                                                                                              | Pass    |
| PGF-10  | Migration history is stored in the owned `platform` schema.                                                                               | `platform.__ef_migrations_history` assertion                                                                   | Pass    |
| PGF-11  | Role bootstrap and migration application are idempotent.                                                                                  | both operations executed twice                                                                                 | Pass    |
| PGF-12  | Down migration cannot drop module schemas and their future data.                                                                          | roll-forward-only migration guard                                                                              | Pass    |
| PGF-13  | Schema registry, named module boundaries and migration dependency direction have automated tests.                                         | focused database/architecture tests; current 464-test API/architecture suite                                   | Pass    |
| PGF-13A | IAM/account tables enforce unique identity/account keys, restricted relationships, valid windows and no live entitlement.                 | second migration; model tests; PostgreSQL negative inserts                                                     | Pass    |
| PGF-13B | New tables are owned by `makh_owner` with explicit runtime/read-only grants.                                                              | migration SQL; isolated ownership/privilege assertions                                                         | Pass    |
| PGF-13C | Scanner sequence, run/candidates and ordered outbox fact are transactionally persistent and uniquely constrained.                         | migrations 5–8; model/payload tests; PostgreSQL ordering and duplicate-rejection smoke                         | Pass    |
| PGF-13D | Concurrent dispatchers lease only due head-of-stream messages and conditionally record success or bounded retry.                          | migration 9; dispatcher tests; PostgreSQL sequence 1/2 lease smoke                                             | Pass    |
| PGF-13E | Evidence documents, source snapshots and outbox facts retain immutable lineage with owner-bound retry/publication.                        | migrations 11–13; PostgreSQL ownership, negative constraint, retry/reclaim and terminal-publication smoke      | Pass    |
| PGF-13F | Aggregate-only social attention persists without raw posts or user identifiers and enforces version, retention and tombstone constraints. | migration 14; model/repository tests; PostgreSQL ownership, duplicate, deleted-metric and bounded-expiry smoke | Pass    |
| PGF-13G | Expired social aggregates are deleted atomically with a durable, identifier-free and immutable deletion-audit record.                     | migration 15; model/store tests; PostgreSQL audit creation plus runtime mutation-denial smoke                  | Pass    |
| PGF-13H | Combined evidence snapshots persist immutably and reject conflicting point-in-time replay.                                                | migration 16; model/store tests; PostgreSQL uniqueness, JSON/count and immutable-runtime smoke                 | Pass    |
| PGF-14  | Migration is certified on the target PostgreSQL 18 release.                                                                               | PostgreSQL 18 migration/repeat/privilege run                                                                   | Pending |
| PGF-15  | Data Engineer accepts the baseline.                                                                                                       | signature below                                                                                                | Pending |

The local executable smoke test passed on PostgreSQL 17.10 with the eleven WBS 2.3 schemas (`iam`, `account`, `market`, `scanner`, `evidence`, `risk`, `trading`, `journal`, `notification`, `audit`, `platform`) across sixteen migrations. It covers five IAM/account tables, three scanner tables, five evidence tables, the immutable social deletion-audit table and both leased outboxes. It proves ownership/grants, scanner sequencing and correction lineage, evidence/social provider-version uniqueness, replay-safe immutable combined snapshots, immutable source/outbox lineage, social tombstone metric denial, atomic expired-aggregate deletion with a durable identifier-free audit record, runtime audit insertion/read access with update/delete/truncate denied, non-owner transition rejection, delayed retry, reclaim and terminal publication, session revocation, duplicate identity rejection and database-level live-entitlement denial. It does not replace certification against the selected PostgreSQL 18 managed target.

## Approval

- Data Engineer: ____________________
- Decision: Accept / Accept with conditions / Reject
- PostgreSQL 18 version/service: ____________________
- Date: ____________________
- Conditions or evidence references: ____________________

This approval covers only database foundation structure. It does not provision a hosted database, approve a cloud service, authorize production data, create provider credentials or enable live trading.

## Executable readiness verification — 14 October 2026

`eng/verify-postgresql-foundation-readiness.mjs` verifies 24 controls, four least-privilege roles, eleven schemas, the sixteen-migration PostgreSQL 17.10 evidence and pending PostgreSQL 18/Data Engineer gates. Its manifest hashes six artifacts and records five blockers; no hosted, production-data or live authority is created.
