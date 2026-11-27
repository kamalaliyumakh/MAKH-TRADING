# Recovery and Operations Acceptance

Date: 12 August 2026  
Status: Test specification; execution pending

| ID | Test | Pass evidence |
|---|---|---|
| HOA-01 | Deploy Angular, API and worker from versioned infrastructure/application artifacts. | Repeatable pipeline log |
| HOA-02 | Roll back a failed application release without database corruption. | Timed rollback record |
| HOA-03 | Prove API and worker have no public cloud credentials in code/images/config. | Secret and image scan |
| HOA-04 | Retrieve secrets through workload identity and least privilege. | Access test and denied negative test |
| HOA-05 | Demonstrate paper/live vault, identity and network separation. | Boundary matrix and negative test |
| HOA-06 | Prove database private access and encrypted client connection. | Network/TLS test |
| HOA-07 | Restore PostgreSQL to a chosen point and reconcile order/risk/audit invariants. | Timed PITR report |
| HOA-08 | Meet measured RPO ≤5 minutes for the exercised failure. | Last durable transaction comparison |
| HOA-09 | Meet measured service RTO ≤60 minutes including application redirection and verification. | Incident timeline |
| HOA-10 | Restore an independent logical export into an isolated environment. | Restore/checksum report |
| HOA-11 | Prove audit/archive immutability and authorized retention deletion. | Policy and negative test |
| HOA-12 | Correlate browser/API/worker/database/provider activity without logging secrets or forbidden payloads. | Trace and redaction evidence |
| HOA-13 | Trigger actionable alerts for API failure, worker lag, database saturation, provider failure and reconciliation mismatch. | Alert drill |
| HOA-14 | Block new entries when risk/data/broker critical dependencies fail. | Paper scenario evidence |
| HOA-15 | Exercise zone/service failure and prove documented degraded mode. | Game-day report |
| HOA-16 | Verify WAF/rate limits, origin restriction and privileged-access logging. | Security test |
| HOA-17 | Export database, objects and configuration inventory for provider exit. | Exit rehearsal |
| HOA-18 | Complete cost-budget and unexpected-spend alert test. | Alert and acknowledgement record |

## Acceptance gate

Development may begin with a proposed provider and local/container substitutes. Staging requires selected region/service compatibility. Paper production requires HOA-01–14 and HOA-16–18. Live production additionally requires HOA-15, legal/privacy approval, broker/data gates and explicit live authorization.

Quarterly recovery exercises are required after paper production begins. Any failed RPO/RTO, invariant, entry-lock or reconciliation test blocks promotion and live operation.
