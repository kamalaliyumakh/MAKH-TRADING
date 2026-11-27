# Identity Foundation Acceptance — WBS 3.5

Last updated: 14 October 2026

## Acceptance status

Implementation evidence is ready. WBS 3.5 remains **In Progress at 99%** until the identity provider and jurisdiction are approved, provider-specific OIDC/MFA/session behavior is certified, shared certificate-protected key deployment is proven, WBS 3.2 and architecture dependencies are accepted, and the Backend/Security Leads approve this record.

| ID | Acceptance criterion | Evidence | Status |
|---|---|---|---|
| IDF-01 | OIDC uses confidential authorization code flow with PKCE. | OIDC options and security test | Pass |
| IDF-02 | Identity integration defaults disabled and fails closed. | disabled configuration and HTTP 503 test | Pass |
| IDF-03 | Enabled configuration requires HTTPS authority and external credentials. | options validator | Pass |
| IDF-04 | Browser cookie is host-scoped, Secure, HttpOnly and SameSite. | cookie options test | Pass |
| IDF-05 | Cookie contains only a random server-session key. | distributed ticket store and test | Pass |
| IDF-06 | Provider tokens are not saved in the cookie ticket. | `SaveTokens=false` test | Pass |
| IDF-07 | Idle and absolute session expiry are bounded. | cookie/ticket-store configuration | Pass |
| IDF-08 | Anonymous API access is denied without redirect. | session endpoint negative test | Pass |
| IDF-09 | Public readiness endpoints remain anonymous. | integration tests | Pass |
| IDF-10 | Portal session returns only normalized platform claims with no-store caching. | integration test | Pass |
| IDF-11 | Policy authorization covers paper, live, risk administration and MFA. | policy registration | Pass |
| IDF-12 | Fresh MFA validates both `amr=mfa` and bounded `auth_time`. | fresh, stale and password-only tests | Pass |
| IDF-13 | Cookie-authenticated logout rejects missing antiforgery evidence. | negative integration test | Pass |
| IDF-14 | Validated issuer/subject resolves to an enabled persisted user and exactly one active paper account. | PostgreSQL resolver and claim-mapper tests | Pass |
| IDF-15 | Provider-supplied account/role claims are discarded and reconstructed only from current entitlements. | replacement and fail-closed security tests | Pass |
| IDF-16 | Enabled identity cannot start without a PostgreSQL authorization connection. | options-validator test | Pass |
| IDF-17 | Sessions have server-generated IDs, user-scoped durable inventory and owner-only revocation. | PostgreSQL registry, migration and smoke test | Pass |
| IDF-18 | Revoked tickets fail retrieval from protected PostgreSQL persistence. | negative ticket-store and persisted revocation tests | Pass |
| IDF-19 | Identity provider, claim mapping, shared key repository and certificate rotation/recovery are certified. | provider-specific/hosted evidence | Pending |
| IDF-20 | Backend and Security Leads accept the foundation. | signatures below | Pending |

Thirty-one API-security tests and the full 314-test architecture/domain/application/infrastructure suite pass. No external provider was contacted and no credential was created or stored.

## Approval

- Backend Lead: ____________________
- Security Lead: ____________________
- Decision: Accept / Accept with conditions / Reject
- Identity provider and tenant: ____________________
- Date: ____________________
- Conditions or evidence references: ____________________

This approval does not authorize live trading. Live access remains separately gated by entitlement, fresh MFA, risk approval, paper certification, operational readiness, security and compliance approval.

## Executable readiness verification — 14 October 2026

`eng/verify-identity-foundation-readiness.mjs` verifies 20 controls, fail-closed OIDC, cookie/token boundaries, fresh MFA, antiforgery, persisted identity/session resolution, protected key requirements and predecessor state. Its manifest hashes eight artifacts and records five blockers; no production identity or live authority is created.
