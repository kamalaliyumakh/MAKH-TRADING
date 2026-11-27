# Persisted Identity Resolution Acceptance

Last updated: 26 August 2026

WBS: 3.5

Status: Local implementation accepted; provider certification and accountable approvals pending

## Accepted behavior

- The validated OIDC issuer and subject are lookup inputs only.
- External identities resolve through the unique `iam.external_identities` issuer/subject key.
- Disabled users are rejected.
- Only entitlements effective at authentication time are considered.
- Only active paper accounts are eligible; live accounts and live grants cannot create a session.
- Zero or multiple eligible accounts reject authentication rather than guessing an account.
- Provider-supplied platform subject, role, account and mode claims are removed.
- The server issues the internal user UUID, persisted account UUID, paper mode and roles derived from `Trade` or `ManageRisk` entitlements.
- A successful lookup records the latest authentication time.
- Enabling OIDC without the PostgreSQL platform connection fails startup validation.

## Verification

- Zero-warning .NET 10 Release build: Pass
- Architecture/domain/application/infrastructure tests: 313 passed
- API security tests: 26 passed
- PostgreSQL 17.10 isolated role and two-migration smoke: Pass
- Angular tests: 87 passed
- Angular production builds: 7 passed

## Remaining conditions

- Select and contract the production identity provider and jurisdiction.
- Certify issuer, audience, discovery/JWKS, MFA, logout, revocation and provider-claim behavior.
- Implement approved identity/account provisioning and deprovisioning.
- Replace the development session cache and key storage with protected shared services.
- Complete independent security testing and obtain Backend and Security Lead acceptance.

This evidence creates no live-trading authority. The database and resolver remain paper-only and fail closed.
