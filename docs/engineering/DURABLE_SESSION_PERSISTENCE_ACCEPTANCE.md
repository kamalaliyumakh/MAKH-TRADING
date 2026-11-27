# Durable Session Persistence Acceptance

Last updated: 27 August 2026

WBS: 3.4 and 3.5

Status: Implemented and locally verified; hosted PostgreSQL 18 and production ticket-cache/key certification pending

## Database controls

- `iam.user_sessions` stores the server session UUID, internal user UUID, issued, last-seen, expiry and revocation timestamps, and a concurrency version.
- Foreign keys prevent orphan sessions; user deletion remains restricted.
- Check constraints enforce expiry after issue, last-seen within the session window, revocation no earlier than issue, and positive versions.
- The `(user_id, expires_at)` index supports scoped inventory and expiry maintenance.
- `makh_owner` owns the table, `makh_runtime` receives bounded DML, and `makh_readonly` receives read-only access.

## Runtime controls

- The registry creates a fresh DbContext per operation so the singleton ticket store can safely operate across concurrent requests.
- Active checks, touches, revocation and inventory execute against PostgreSQL.
- Touch and revocation use bounded atomic updates with version increments.
- Revocation requires the matching internal user and affects at most one session.

## Verification

- Three migrations apply idempotently in isolated PostgreSQL 17.10.
- Five IAM/account tables, table ownership, runtime grants and durable revocation are verified.
- Invalid session windows are rejected by PostgreSQL.
- Zero-warning .NET 10 Release build passes.
- 314 architecture/domain/application/infrastructure and 29 API security tests pass.
- Seven Angular production builds and 87 Angular tests pass.

No live credentials, order execution, external identity provider or trading authority was introduced.
# Addendum — protected tickets (2026-08-27)

Durability now includes the encrypted authentication-ticket payload and hashed opaque lookup key, not only session inventory/revocation. See `PROTECTED_TICKET_PERSISTENCE_ACCEPTANCE.md`. Production shared encryption-key deployment remains unaccepted.
