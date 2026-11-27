# IAM and Account Persistence Acceptance

Date: 26 August 2026  
WBS: 3.4 supporting 3.5  
Status: Local coded acceptance passed; production integration pending

## Implemented scope

- `iam.users` stores the platform profile lifecycle without credentials or reusable provider tokens.
- `iam.external_identities` stores a normalized HTTPS issuer and stable subject, unique across the platform.
- `account.trading_accounts` stores provider-qualified paper/live identity, lifecycle state and optimistic version.
- `account.account_entitlements` binds user, account, access and effective window with restricted foreign keys.
- All four tables use snake-case physical names, application-generated UUID keys and explicit module schemas.
- The migration assigns `makh_owner`, grants runtime DML/read-only access deliberately and does not grant DDL.
- The pre-live database constraint rejects every live entitlement. This migration creates no live authority.

## Verification

- Five focused object/model tests cover issuer validation, monotonic authentication time, closed-account/version behavior, default-deny entitlements and EF mappings.
- The isolated PostgreSQL 17.10 test applies role bootstrap and both migrations twice.
- The integration test verifies eleven schemas, four tables, owner/runtime privileges and two migration-history rows.
- A valid synthetic paper user, external identity, trading account and trade entitlement insert successfully.
- Duplicate issuer/subject and `allows_live_trading = TRUE` inserts are rejected by PostgreSQL.
- Full verification passes 334 .NET tests, 87 Angular tests and all seven Angular production builds with zero .NET warnings.

## Remaining conditions

- Select and certify the production OIDC provider and jurisdiction-specific identity lifecycle.
- Provision/resolve users and entitlements from the authenticated callback without trusting client claims.
- Add persistent session inventory/revocation and approved shared protected session storage.
- Certify the migrations on PostgreSQL 18 and the selected managed service.
- Add retention, erasure/hold and privileged entitlement administration workflows.
- Obtain Data Engineer, Backend Lead and Security Lead acceptance.

## Decision

Accept the local persistence slice and raise WBS 3.4 to 90%. Retain WBS 3.5 at 85%. No production identity, paper-trial authority or live-trading authority is created.
