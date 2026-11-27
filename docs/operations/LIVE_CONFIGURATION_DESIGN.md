# WBS 9.3 — Controlled-Live Configuration Design

Last updated: 13 August 2026  
Status: Design only — no live environment, credentials or authority

## Purpose and non-authority boundary

Define the configuration evidence required for a later, separately authorized controlled-live pilot. This document does not create a production environment, enable the existing broker contracts for live submission, identify a real account, store a secret, call a provider or authorize capital deployment.

The current application remains fail-closed: `BrokerAccountIdentity.CanSubmitLiveOrders` is always false, production/live environments are absent, and lower-environment schemas accept only synthetic or paper modes.

## Segregation model

| Control | Required design | Evidence before activation |
|---|---|---|
| Environment | Dedicated live environment and subscription/project boundary | immutable environment/resource inventory |
| Broker identity | Dedicated approved live account; no paper account reuse | broker eligibility and masked account-reference attestation |
| Credentials | Separate managed-vault references; never values in config, logs or evidence | secret metadata, access policy, rotation/expiry evidence |
| Identity | Explicit live entitlement plus fresh MFA; server-side account authorization | provider certification and negative authorization tests |
| Network | Deny-by-default egress with approved live broker/data allowlist | firewall/private-link policy and observed connection evidence |
| Database | Live-isolated data plane, runtime/migration role separation and encryption | resource, role, backup/PITR and restore evidence |
| Presentation | Persistent non-color-only LIVE state and account scope | accessibility and representative-user evidence |
| Telemetry | Redacted traces, order/reconciliation alerts and named on-call | dashboard, alert delivery and runbook drill evidence |

## Mandatory startup assertions

A future live service must refuse readiness and order-producing work unless every assertion passes:

1. release digest, SBOM and deployment evidence match the approved go/no-go record;
2. environment is exactly `controlled-live`, data class is production-authorized and live mode is explicitly enabled by a time-bounded gate reference;
3. paper and live account, credential, vault, database and network identifiers are distinct;
4. credential configuration contains vault references only and passes expiry/rotation/access checks;
5. identity issuer/audience, entitlement, account authorization and MFA freshness are certified;
6. approved risk-policy version and immutable pilot ceilings are loaded;
7. entry lock starts true and cannot clear until provider health, broker reconciliation, market calendar, telemetry and named-operator checks pass;
8. kill switch, cancellation, reconciliation, rollback and incident contacts have valid evidence references; and
9. WBS 7.9, 8.7, 9.1, 9.2 and 9.4 approvals are signed and unexpired.

Any missing, stale, conflicting or unverifiable assertion keeps entry locked and disables order-producing workers.

## Pilot limit envelope

Values are deliberately absent. Risk/Sponsor must approve bounded values for total pilot capital, maximum daily loss, maximum position exposure, maximum order notional, maximum share quantity, maximum open positions, maximum orders/day, permitted symbols/venues/order types/hours and pilot expiry. Platform controls may be stricter than broker limits and must never weaken the approved ceiling.

## Kill-switch hierarchy

1. Block new entries immediately.
2. Cancel eligible open orders idempotently.
3. Reconcile broker/local order, position and cash state.
4. Permit liquidation only as a distinct fresh-MFA, impact-preview, second-confirmation workflow under approved authority.
5. Preserve partial failures and resume from reconciled state.
6. Keep entry locked until Risk, Operations and reconciliation evidence approve recovery.

## Rollback and revocation

- Revoke live entitlement and elevated sessions.
- Disable order-producing workers and provider egress.
- Rotate/revoke affected credential references through the approved vault process.
- Preserve audit, broker, risk and reconciliation evidence.
- Roll forward/back only to an approved digest with migration compatibility evidence.
- Never infer broker cancellation or flat positions from local shutdown; reconcile authoritatively.

## Exit criteria

Design preparation does not satisfy WBS 9.3. Completion requires an authorized environment, externally managed live references, verified segregation/startup assertions, approved numeric limits, successful MFA/authorization/kill-switch/reconciliation/rollback drills, and signed Risk, Security, Operations and Sponsor acceptance after WBS 9.1/9.2 and go/no-go prerequisites.
