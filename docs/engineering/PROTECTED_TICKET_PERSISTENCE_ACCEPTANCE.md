# Protected Ticket Persistence Acceptance

Date: 2026-08-27  
WBS: 3.4 PostgreSQL, 3.5 Identity and access

## Accepted evidence

- Authentication tickets are serialized, authenticated and encrypted with ASP.NET Core Data Protection before persistence.
- The browser receives a random 256-bit opaque ticket key; PostgreSQL stores only its SHA-256 hash.
- `iam.user_sessions` now owns the protected payload, hash, expiry, revocation and version state under database constraints and a unique hash index.
- Retrieval, renewal and removal fail closed through the durable session registry; malformed or undecryptable payloads revoke the session.
- Migration `20260827150746_AddProtectedServerTickets` deliberately deletes existing cache-era sessions because those tickets cannot be recovered safely.

## Verification

- Release build: zero warnings and zero errors.
- .NET: 314 architecture tests and 31 API-security tests passed (345 total).
- Angular: 87 tests passed; all seven production targets built.
- PostgreSQL 17.10: 11 schemas, four migrations and five IAM/account tables verified, including protected durable tickets and runtime DDL denial.

## Remaining gate

Production identity now fails startup unless configuration supplies an absolute durable key-ring path, an existing certificate and an external certificate password. Production still requires deployment evidence proving that the path is shared/durable, certificate custody and rotation/recovery work in the target environment. Identity-provider selection, certification and accountable approvals remain open. This acceptance does not authorize production or live trading.
