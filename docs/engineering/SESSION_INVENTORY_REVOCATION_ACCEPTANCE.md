# Session Inventory and Revocation Acceptance

Last updated: 27 August 2026

WBS: 3.5

Status: Durable PostgreSQL implementation accepted; shared ticket cache/key deployment pending

## Accepted behavior

- A fresh cryptographic session identifier is added only after persisted OIDC identity resolution.
- The server ticket store requires both internal user and session UUIDs and fails closed when either is absent.
- Inventory is persisted in `iam.user_sessions` and scoped to the authenticated internal user.
- A user cannot revoke another user's session.
- Revoked or expired sessions cannot be renewed or retrieved.
- Revocation survives API process restarts and is visible to every replica using the same PostgreSQL database.
- A revoked ticket is removed from the distributed ticket cache on the next retrieval.
- Inventory and revocation endpoints return `Cache-Control: no-store`; revocation requires antiforgery evidence.
- Absolute and sliding expiry remain bounded by existing identity options.

## Verification

- Zero-warning .NET 10 Release build: Pass
- Architecture/domain/application/infrastructure tests: 314 passed
- API security tests: 29 passed
- PostgreSQL 17.10 isolated role and three-migration smoke: Pass; five IAM/account tables, durable revocation, constraints and grants verified
- Angular tests: 87 passed
- Angular production builds: 7 passed

## Production boundary

The revocation inventory is durable, but the serialized authentication-ticket cache remains development in-memory storage. Before production or multiple replicas, replace that cache with an approved protected shared store, configure shared data-protection keys, prove failover behavior, add device/security metadata and complete provider-specific logout/revocation testing.

This implementation grants no trading authority and does not enable live mode.
