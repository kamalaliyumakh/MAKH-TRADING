# WBS 9.1 — Independent Security Current Scope

Status: Prepared for accountable authorization; testing has not started.

## Assessment inventory

| ID | Test area | Safe objective |
|---|---|---|
| ST-001 | Authentication | Verify invalid and locked credentials fail closed. |
| ST-002 | MFA | Verify challenge, expiry, replay and attempt controls. |
| ST-003 | Session | Verify rotation, expiry, logout and revocation. |
| ST-004 | Authorization | Verify role and ownership boundaries. |
| ST-005 | Administration | Verify privileged mutation controls and audit. |
| ST-006 | Registration | Verify validation, enumeration resistance and consent. |
| ST-007 | Password recovery | Verify token custody, expiry and single use. |
| ST-008 | API input | Verify injection and malformed-input handling. |
| ST-009 | Browser input | Verify XSS and unsafe rendering controls. |
| ST-010 | Request integrity | Verify CSRF and origin protections. |
| ST-011 | Object access | Verify IDOR/BOLA boundaries. |
| ST-012 | Rate limiting | Verify abuse, burst and lockout behavior. |
| ST-013 | Secrets | Verify no credential or token disclosure. |
| ST-014 | Cryptography | Verify transport and protected-storage configuration. |
| ST-015 | Audit | Verify security events are attributable and immutable. |
| ST-016 | Error handling | Verify failures reveal no sensitive internals. |
| ST-017 | Dependencies | Verify known-vulnerability and integrity controls. |
| ST-018 | Configuration | Verify headers, CORS and production-safe settings. |
| ST-019 | Trading entry lock | Verify blocked modes cannot submit orders. |
| ST-020 | Risk limits | Verify loss, gain and position rules fail closed. |
| ST-021 | Market/news inputs | Verify provenance, tamper and stale-data handling. |
| ST-022 | Exports | Verify authorization, minimization and safe files. |
| ST-023 | Availability | Verify only non-destructive authorized resilience probes. |
| ST-024 | Evidence/closure | Verify findings, remediation and independent retest traceability. |

## Threat-to-mitigation coverage

| Threat | Mitigation | Primary tests |
|---|---|---|
| TM-01 | SEC-001 | ST-001, ST-002 |
| TM-02 | SEC-002 | ST-003 |
| TM-03 | SEC-003 | ST-004, ST-011 |
| TM-04 | SEC-004 | ST-005 |
| TM-05 | SEC-005 | ST-006, ST-007 |
| TM-06 | SEC-006 | ST-008 |
| TM-07 | SEC-007 | ST-009, ST-010 |
| TM-08 | SEC-008 | ST-012 |
| TM-09 | SEC-009 | ST-013 |
| TM-10 | SEC-010 | ST-014 |
| TM-11 | SEC-011 | ST-015 |
| TM-12 | SEC-012 | ST-016 |
| TM-13 | SEC-013 | ST-017 |
| TM-14 | SEC-014 | ST-018 |
| TM-15 | SEC-015 | ST-019 |
| TM-16 | SEC-016 | ST-020 |
| TM-17 | SEC-017 | ST-021 |
| TM-18 | SEC-018 | ST-022 |
| TM-19 | SEC-019 | ST-023 |
| TM-20 | SEC-020 | ST-024 |

## Required execution controls

- A demonstrably independent assessor, qualifications and conflict declaration.
- Signed rules of engagement identifying the immutable release, isolated target, source addresses, identities, test window, allowed techniques, stop contacts and restricted evidence store.
- PAPER-only identities and synthetic data; no broker, capital, live account or live order.
- Immediate stop and incident escalation for loss of isolation, credential exposure, unavailable containment, material data access or a critical control failure.
- Immutable evidence per test: assessor, time, target digest, command/request reference, redacted observation, result and linked finding.
- Severity uses Critical, High, Medium, Low and Informational; Critical/High findings block acceptance until remediation and independent retest.

Internal automated tests and historical build results may support context but cannot substitute for independent execution.

Decision: `Prepared / Independent Authorization, Execution, Remediation and Acceptance Pending`.

No security, operational, paper-trading, pilot or live-trading authority is created.
