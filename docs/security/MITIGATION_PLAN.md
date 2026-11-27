# MAKH Trading Platform — Security Mitigation Plan

Last updated: 12 August 2026  
Status: Required implementation baseline

## 1. Control principles

Default deny; least privilege; server-side authorization; centralized risk authority; fail-closed new exposure; order idempotency/reconciliation; paper/live segregation; immutable evidence; managed secrets; and continuous plus release-gate verification.

## 2. Delivery plan

| Control | Implementation evidence | Threats | Wave | Owner | Gate |
|---|---|---|---|---|---|
| SEC-001 | BFF OIDC code+PKCE, server token handling, secure cookie, rotation/revocation | 01,10,13 | C1 | Identity/API | Session tests |
| SEC-002 | Default-deny policy/resource authorization for REST/SignalR; server account scope | 01,02,17 | C1–C2 | API/Security | Authorization matrix |
| SEC-003 | MFA freshness/step-up for live, policy, credentials, exports, kill switch, break glass | 01,08,09,16 | C1/C5/C7 | Identity/Risk | Privileged tests |
| SEC-004 | CSRF, origin, CSP, headers, encoding and no-store controls | 13 | C1–C2 | Frontend/API | Browser suite |
| SEC-005 | Managed secrets/workload identity, token protection, rotation and redaction | 10,15 | C1 | Platform/Security | Secret/rotation drill |
| SEC-006 | Explicit DTO/schema/size validation, parameterized persistence, canonical errors | 14 | C1+ | API/Data | Negative API/SAST |
| SEC-007 | Provenance, canonical security mapping, freshness and quarantine | 06,07,18 | C3–C4 | Data/Evidence | Replay/data quality |
| SEC-008 | Proposal digest and risk decision bound to account/mode/policy/snapshot/expiry | 03,20 | C5 | Risk | Tamper properties |
| SEC-009 | Unique IDs, atomic state/outbox, broker client ID and query-before-retry | 04,05 | C5 | Orders | Duplicate/race test |
| SEC-010 | Authenticated broker events, dedupe, monotonic state and mismatch lockout | 05,19 | C5 | Broker/Orders | Fault drills |
| SEC-011 | Separate paper/live identity, credentials, allowlists, config and visual mode | 08 | C1/C7 | Platform/Ops | Segregation audit |
| SEC-012 | Effective policy versions, privileged reasons and alerts; no history mutation | 09,11 | C5–C6 | Risk/Audit | Reconstruction |
| SEC-013 | Append-only audit, checksummed archive, correlation/time, retention/restore | 11,18 | C1/C6 | Audit/Ops | Restore drill |
| SEC-014 | Rate limits, bounded queues, breakers, readiness and workload priority | 12,19 | C1/C3/C5 | Platform/Ops | Load/fault tests |
| SEC-015 | Protected review, locked deps, SAST/SCA, SBOM, secrets and signed artifacts | 15,20 | C1 | Eng/Security | CI gates |
| SEC-016 | Time-bound admin/break-glass, reason/expiry, review and alerts | 09,16 | C1/C6 | Security/Ops | Access review |
| SEC-017 | Scoped, manifested, expiring exports with volume controls | 10,17 | C6 | Reporting/Security | Export tests |
| SEC-018 | Kill-switch hierarchy, MFA/confirmation, idempotency and reconciliation | 09,19 | C5 | Risk/Ops | Game day |
| SEC-019 | UTC, trusted time, source timestamps, drift alarms and clock abstraction | 05,18 | C1/C3 | Platform/Data | Clock tests |
| SEC-020 | Single broker-submit port and architecture/endpoint inventory tests | 03,20 | C1/C5 | Architecture | Dependency tests |

## 3. Wave C1 requirements

Before feature delivery, establish the BFF/cookie session skeleton and provider adapter; central authorization/account-resource handlers; CSRF/origin/CSP/headers/redacted logs/correlation; separate environment and secret references with no live credentials; separate migration/runtime database roles; CI architecture/SAST/SCA/secret/migration gates and SBOM; append-only audit contract; UTC clock abstraction; and security fixtures for roles, accounts, modes, expiry and MFA freshness.

The identity provider remains a vendor decision. Vendor claims must be normalized into platform subject, role, permitted accounts/modes, authentication time and MFA context.

## 4. Release gates

### Public site

- Verify CSP/headers, analytics exclusion, dependency/secret scans, form rate limits and bot controls.

### Authenticated portal

- Pass session, CSRF, XSS, privilege and cross-account tests; map explicit authorization for every route/API/hub operation; operate revocation and security logging.

### Paper trading

- Pass decision tamper/expiry, idempotency/race/timeout, event ordering and reconciliation tests; pass secret rotation and audit reconstruction; demonstrate no risk/broker-boundary bypass.

### Controlled live

- Approve independent threat review and penetration test; resolve all critical/high findings; segregate and verify live identity/credentials/account/config; pass MFA, kill-switch, mismatch, restore and timeout drills; record legal/vendor/capital/loss-limit go/no-go.

## 5. Residual business risks

| Residual risk | Required response |
|---|---|
| Broker compromise or incorrect state | Vendor diligence, reconciliation, exposure caps and incident runbook |
| Malicious/incorrect data feed | Provenance, quarantine, conservative freshness/liquidity gates and SLAs |
| Compromised user device | MFA, session revocation/visibility, alerts, guidance and limited live capital |
| Gaps, halts and failed exits | Disclosure, sizing/liquidity controls, monitoring and limited capital |
| Privileged insider collusion | Time-bound access, immutable audit, alerts and independent review |
| Multi-provider denial of service | Fail-closed entries, protected containment paths and drills |

Residual acceptance never permits bypass of authorization, risk, idempotency, reconciliation or audit controls.

## 6. Incident priorities

Block new exposure when truth is uncertain; revoke/isolate/contain; reconcile broker truth; preserve evidence; rotate/repair/recover progressively; then document root cause, exposure and model updates.
