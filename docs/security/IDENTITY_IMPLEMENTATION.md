# Identity and Authorization Implementation Baseline

Last updated: 27 August 2026

WBS: 3.5

Status: Provider-neutral foundation; external provider disabled

## Runtime topology

- ASP.NET Core is the OIDC confidential client and BFF.
- OIDC authorization code flow uses PKCE and HTTPS metadata.
- Provider tokens are not saved in the browser authentication cookie.
- The `__Host-makh-session` cookie is Secure, HttpOnly, host scoped and SameSite=Lax.
- The browser cookie contains only a random session key. The authentication ticket is held in an `ITicketStore` backed by `IDistributedCache`.
- The current development registration uses distributed memory cache for serialized tickets. Session inventory and revocation are durable in PostgreSQL. A protected shared ticket cache and shared data-protection keys are mandatory before multiple replicas or production.
- Sessions have a 20-minute idle expiry and an eight-hour absolute expiry by default. Renewal cannot extend the absolute boundary.
- Each successful OIDC session receives a server-generated `makh_session_id`. The ticket store registers it in `iam.user_sessions`, checks PostgreSQL on every retrieval and removes revoked tickets.

## Fail-closed configuration

`Identity:Enabled` defaults to `false`. Login returns HTTP 503 and no network call is attempted while disabled. Enabling identity requires an HTTPS authority, client ID, client secret and `ConnectionStrings:Platform`, all supplied through approved external configuration or secrets management.

Repository configuration contains no provider credential. The disabled `.invalid` OIDC placeholder exists only to satisfy handler option validation and is unreachable through the disabled login route.

## Normalized claim contract

| Claim | Meaning | Requirement |
|---|---|---|
| `sub` | stable internal platform-user UUID | replaced by the server after persisted identity resolution |
| `makh_role` | normalized platform role | server-issued mapping only |
| `account_mode` | `paper` or separately entitled `live` | server policy input |
| `makh_account_id` | unique active account selected from current persisted entitlements | mandatory for portal access |
| `makh_session_id` | server-generated session identifier | used for inventory and revocation; never accepted from the provider |
| `amr` | authentication method reference | must contain `mfa` for step-up policies |
| `auth_time` | Unix authentication timestamp | must be within the policy freshness window |

At OIDC token validation, the backend uses the validated token issuer and provider subject only as lookup keys. It removes all provider-supplied `sub`, `makh_role`, `makh_account_id` and `account_mode` claims, then issues an internal user UUID, the single eligible account UUID, `paper` mode and roles derived from current database entitlements. Missing identities, disabled users, inactive accounts, expired/future grants, live accounts and multiple eligible accounts all fail closed. Provider-specific issuer/audience behavior still requires certification after provider selection. Client claims or Angular route guards never grant server authority.

## Policies

| Policy | Required evidence |
|---|---|
| `PortalAccess` | authenticated internal subject and persisted account identifier |
| `PaperTrading` | authenticated identity and `account_mode=paper` |
| `FreshMfa` | MFA method and authentication time no older than 15 minutes |
| `RiskAdministration` | Risk Administrator role plus fresh MFA |
| `LiveTrading` | Trader role, explicit live entitlement and fresh MFA |

These policies are necessary authorization inputs, not sufficient trading authority. Order submission will additionally require account resource authorization, current risk approval, live gates, idempotency and broker/reconciliation health.

## CSRF and response handling

- Authenticated clients obtain a request token from `GET /auth/csrf`.
- Logout validates the `X-CSRF-TOKEN` request header and antiforgery cookie.
- Sensitive session and token responses use `Cache-Control: no-store`.
- Cookie authentication returns API-safe HTTP 401/403 responses rather than redirects.
- `GET /api/v1/session/inventory` returns only the authenticated internal user's sessions.
- `DELETE /api/v1/session/inventory/{sessionId}` requires antiforgery evidence and cannot revoke another user's session.

All future cookie-authenticated mutation endpoints must validate antiforgery and trusted origin before implementation acceptance.

## Open conditions

The platform now has provider-neutral persistence for users, unique external issuer/subject identities, canonical trading accounts and default-deny entitlements. PostgreSQL rejects live entitlements in the current pre-live migration. The OIDC callback resolves existing records and persisted entitlements are the sole source of account/role session claims. Automatic user/account provisioning is intentionally absent: an unlinked identity cannot sign in.

- Select and approve the identity provider and operating jurisdiction.
- Add an approved, auditable provisioning and deprovisioning workflow for `iam` identities and account entitlements.
- Certify issuer, audience, discovery/JWKS, claim mapping, MFA/step-up, logout and revocation behavior.
- Replace development distributed-memory session storage with an approved protected shared implementation.
- Replace the development in-memory ticket cache with a protected shared implementation and configure shared data-protection keys, encryption and rotation.
- Complete provider-specific penetration and negative authorization testing.
# Protected server tickets — 2026-08-27

The cookie ticket store now persists only a SHA-256 hash of the opaque browser key and a Data Protection encrypted/authenticated ticket in `iam.user_sessions`. Retrieval, renewal, expiry and revocation are database-backed and fail closed. Migration to this model invalidates cache-era sessions. A shared protected production key ring and its rotation/recovery runbook remain mandatory deployment gates.
