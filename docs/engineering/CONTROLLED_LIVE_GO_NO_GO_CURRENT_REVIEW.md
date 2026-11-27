# WBS 9.4 — Current Controlled-Live Go/No-Go Review

Reviewed: 28 October 2026  
Accountable decision owner: Sponsor  
Decision: `Reject / Defer — Mandatory Predecessors and Accountable Approval Pending`

## Decision criteria

| ID | Criterion | Current result | Required closure |
|---|---|---|---|
| GNG-01 | Paper certification binds the exact release, environment and paper account | Fail | Execute the authorized trial, close defects and obtain WBS 7.9 certification. |
| GNG-02 | Operational readiness includes deployment, telemetry, support and exercised recovery | Fail | Close WBS 8.7 blockers and obtain accountable ORR acceptance. |
| GNG-03 | Independent security covers ST-001–ST-024 and closes/retests Critical/High findings | Fail | Authorize and execute WBS 9.1, remediate and independently retest. |
| GNG-04 | Legal, privacy, broker, provider-rights and records conclusions are qualified and signed | Fail | Close WBS 9.2 evidence and obtain qualified/accountable approval. |
| GNG-05 | Dedicated live environment, account, credentials, network and data plane are segregated | Fail | Produce authorized immutable WBS 9.3 configuration evidence. |
| GNG-06 | Identity, live entitlement, account authorization and fresh MFA are provider-certified | Fail | Select/configure providers and complete hosted certification. |
| GNG-07 | Pilot capital, loss, exposure, order, quantity, position, frequency and expiry limits are approved | Fail | Approve a versioned bounded policy; null must never mean unlimited. |
| GNG-08 | Entry lock, kill switch, cancellation, reconciliation, rollback and revocation drills pass | Fail | Execute authorized production-like drills and close defects. |
| GNG-09 | Release digest, SBOM, provenance, deployment, monitoring and rollback evidence agree | Fail | Produce one immutable shared release/deployment evidence chain. |
| GNG-10 | Broker eligibility, account behavior, symbols/order types and support escalation are accepted | Fail | Obtain written eligibility, certified mappings and support terms. |
| GNG-11 | Quality, accessibility, performance, load/soak/chaos and recovery meet pilot conditions | Fail | Complete representative hosted evidence and defect closure. |
| GNG-12 | Sponsor, Product, Risk, Security, Legal, Operations, Engineering, Data and QA accept residual risk | Pending | Complete and sign the current decision register after GNG-01–GNG-11 pass. |

## Critical blocker groups

| ID | Blocker | Severity | Status | Accountable owner |
|---|---|---|---|---|
| GNGB-01 | Paper certification is rejected/deferred and no authorized paper-trial result exists. | Critical | Open | Product / Risk / Sponsor |
| GNGB-02 | Operational readiness is rejected/deferred; deployment, telemetry, support and exercised recovery are absent. | Critical | Open | Operations / Engineering |
| GNGB-03 | Independent security is unexecuted; no finding, remediation or independent-retest evidence exists. | Critical | Open | Security Lead |
| GNGB-04 | Qualified legal/compliance, privacy, broker and provider-rights approval is absent. | Critical | Open | Legal / Privacy / Sponsor |
| GNGB-05 | Controlled-live configuration is disabled; no environment, account, credential or segregated integration exists. | Critical | Open | Risk / Operations / Security |
| GNGB-06 | Pilot capital and hard risk limits remain null and unapproved. | Critical | Open | Risk Owner / Sponsor |
| GNGB-07 | Kill-switch, reconciliation, rollback and revocation drills have not run. | Critical | Open | Risk / Operations / Security |
| GNGB-08 | Nine-owner go/no-go approval is absent. | Critical | Open | Sponsor |

## Decision rules

- Go requires all twelve criteria to Pass, current immutable evidence, no open Critical/High blocker and every required accountable signature.
- Reject/Defer is mandatory when any criterion fails, any approval is missing, evidence is stale/conflicting or entry lock remains set.
- A condition cannot waive segregation, authorization, centralized hard limits, entry lock, idempotency, reconciliation, audit, Critical/High security remediation or qualified legal authority.
- A future approval must bind the release/configuration digest, environment, account, participants, capital and risk ceilings, start/end time, stop authority and expiry/review triggers.

This review records Reject/Defer only. It creates no exception, entry-lock clearance, deployment, pilot, capital, broker-order or live-trading authority.
