# MAKH Trading Platform — Security Test Matrix

Last updated: 12 August 2026

These reserved tests become executable with their delivery wave.

| Test | Threats | Verification | Expected result | Wave |
|---|---|---|---|---|
| ST-001 | 01 | Expired/revoked/malformed/wrong-audience session | API/hub denied; safe audit | C1 |
| ST-002 | 01,09,16 | Stale/missing MFA on sensitive actions | Step-up required; no mutation | C1–C6 |
| ST-003 | 02,17 | Role × endpoint × account and ID substitution | Default deny; no leak | C1–C6 |
| ST-004 | 13 | Cross-origin mutation without anti-forgery token | 403; no state change | C1 |
| ST-005 | 13 | Stored/reflected markup in user/provider content | Encoded/sanitized; CSP blocks | C2–C4 |
| ST-006 | 10 | Secret/PII canary through logs/errors/analytics | Absent or approved redaction | C1+ |
| ST-007 | 14 | Injection, over-posting, oversize/malformed payload | Safe validation; no mutation | C1+ |
| ST-008 | 03 | Alter quantity/price/account/mode/policy/snapshot after approval | Binding fails; no submission | C5 |
| ST-009 | 03 | Reuse expired/consumed risk approval | Denied; original unchanged | C5 |
| ST-010 | 04 | Concurrent duplicate order requests/retries | One intended broker order | C5 |
| ST-011 | 04,05 | Broker accepts but response times out | Query before retry; reconcile | C5 |
| ST-012 | 05 | Duplicate/delayed/out-of-order executions | One fill effect; monotonic state | C5 |
| ST-013 | 06,18 | Stale/future/malformed/unmapped market record | Quarantine/reject; entry blocked | C3–C5 |
| ST-014 | 07 | Social spike without verified catalyst | No verification/order authority | C4–C5 |
| ST-015 | 08 | Live secret/account in non-live or no entitlement | Startup/request fails closed | C1/C7 |
| ST-016 | 09 | Policy mutation/backdating/unauthorized kill switch | Denied; evidence retained | C5 |
| ST-017 | 11 | Audit update/delete or archive checksum change | Denied/alarmed; recoverable | C1/C6 |
| ST-018 | 12 | Rate flood/provider throttling | Limits/bounds; controls prioritized | C3–C5 |
| ST-019 | 15 | Vulnerable dep, secret fixture, unsigned artifact | CI blocks; SBOM/evidence | C1 |
| ST-020 | 17 | Cross-account export/expired link reuse | Denied/expired/audited | C6 |
| ST-021 | 18 | Clock skew at session/policy/quote/decision boundary | Deterministic result/alarm | C1–C5 |
| ST-022 | 19 | Broker mismatch/reconciliation backlog | Entries locked; alert/workflow | C5 |
| ST-023 | 20 | Dependency scan and endpoint inventory | One broker path; all policies | C1–C5 |
| ST-024 | 09,19 | Repeated/partial/resumed kill switch | Idempotent/reconciled timeline | C5 |

Each implemented result records build, environment/mode, actor/role, policy version, expected/actual outcome, correlation/audit references and any defect or expiring risk acceptance. A feature flag cannot waive a critical/high control or permit live release with a known authorization/risk bypass.
