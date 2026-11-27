# PostgreSQL Deployment Baseline

Last updated: 2 October 2026

This directory contains database-administrator inputs only. It does not contain passwords, connection strings or production configuration.

## Roles

Run `roles.sql` once per PostgreSQL cluster/database boundary with an authorized administrator. It creates idempotent non-login group roles:

- `makh_owner` owns schemas and their objects.
- `makh_migrator` may assume the owner role during controlled deployment.
- `makh_runtime` receives schema usage and default DML privileges, never DDL ownership.
- `makh_readonly` receives schema usage and default table read privileges.

Environment-specific login roles are created by the approved secrets/IaC system and granted exactly one required membership. Do not add passwords to this script or repository.

## Migration execution

1. Run `roles.sql` with cluster-administrator authority.
2. Set `MAKH_POSTGRES_MIGRATION_CONNECTION` only in the deployment process.
3. Run `dotnet run --project src/MAKH.Migrations --configuration Release`.
4. Record the migration identifier, application build, database target and verification output.

The API and Worker do not call `Migrate`, `EnsureCreated` or role/bootstrap SQL. Production migration is a separate deployment action.

## Local verification

`eng/verify-postgres-foundation.sh` creates an isolated temporary PostgreSQL cluster, runs role bootstrap twice, applies all sixteen migrations twice and checks schema/table ownership, runtime/read-only privileges, database constraints, scanner ordering, conflicting replay denial and eight-writer combined-snapshot convergence, evidence retry/publication transitions, aggregate-only social retention/deletion/audit rules and runtime DDL denial. The current local compatibility run uses PostgreSQL 17.10; PostgreSQL 18 managed-service certification remains a WBS acceptance condition.
