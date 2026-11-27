# WBS 1.5 — Current Hosting, Region and Recovery Discovery Scope

Date: 28 October 2026  
Decision: **Prepared / Region, Managed-Service Validation, Recovery Proof and Approval Pending**  
Authority: discovery evidence only; no provider selection, account, subscription, provisioning or spend authority

## Mandatory baseline

Any future hosting decision must satisfy HR-01–HR-16, preserve five isolated environments, quantify the complete cost model and execute HOA-01–HOA-18 in the exact approved provider, region, account, service tiers and topology.

## Required operating facts

| ID | Required fact | Owner | State |
|---|---|---|---|
| HF-01 | Contracting entity, operating jurisdictions and controller/processor roles | Sponsor / Legal / Privacy | Pending |
| HF-02 | User locations, latency needs and supported service windows | Product / Operations | Pending |
| HF-03 | Personal, identity, market, trading, audit and telemetry data classifications | Data / Security / Privacy | Pending |
| HF-04 | Approved storage, processing, backup, support and transfer locations | Legal / Privacy / Data | Pending |
| HF-05 | Environment/account/subscription and identity isolation model | Security / Operations | Pending |
| HF-06 | Application, worker, database, object, secret, edge and telemetry topology | Architecture / Operations | Pending |
| HF-07 | Availability, degraded-mode, maintenance and support targets | Product / Operations | Pending |
| HF-08 | Approved RPO, RTO, retention, immutability and exercise frequency | Risk / Operations / Data | Pending |
| HF-09 | Workload/session/symbol/request/storage/log/egress growth assumptions | Engineering / Finance | Pending |
| HF-10 | Currency, tax, payment, support, commitment and contingency assumptions | Finance / Sponsor | Pending |
| HF-11 | Exit, export, deletion, portability and provider-transition requirements | Architecture / Legal / Operations | Pending |
| HF-12 | Paper-production and controlled-live entry dependencies | Product / Risk / Operations | Pending |

## Evidence required for any candidate

| ID | Required evidence | State |
|---|---|---|
| HE-01 | Exact provider, contracting entity, account and support arrangement | Pending |
| HE-02 | Exact regions/zones and service availability matrix | Pending |
| HE-03 | Data-residency, subprocessors, support access and transfer terms | Pending |
| HE-04 | Managed PostgreSQL version, HA, backup, PITR and cross-region behavior | Pending |
| HE-05 | Container/job scaling, zone and region failure behavior | Pending |
| HE-06 | Private networking, edge/WAF, workload identity and secret controls | Pending |
| HE-07 | Telemetry, audit, retention, encryption and key controls | Pending |
| HE-08 | SLA, maintenance, incident, status and escalation terms | Pending |
| HE-09 | Reproducible quote with quantities, currency, tax, support and egress | Pending |
| HE-10 | Exit/export/deletion process and portability rehearsal | Pending |
| HE-11 | HOA-01–HOA-18 immutable execution evidence | Pending |
| HE-12 | Accountable legal/privacy/security/operations/finance acceptance | Pending |

## Selection rules

- Provider scoring cannot override a failed privacy, security, recovery, isolation or exit gate.
- Service availability must be verified for the exact region and tier; a provider-wide feature claim is insufficient.
- Region placement does not prove that backups, identity, support, telemetry or subprocessors remain in the same location.
- High availability does not prove disaster recovery, and a configured backup does not prove restore time, data integrity or application recovery.
- RPO/RTO targets remain requirements until timed exercises reconcile application, database, risk, order and audit invariants.
- Calculator estimates are not quotes and exclude unlisted tax, support, egress, exchange-rate, incident and growth costs.
- Paper-production acceptance cannot authorize controlled-live operation.

## Current blockers

| ID | Severity | State | Blocker |
|---|---|---|---|
| HDB-01 | Critical | Open | HF-01–HF-12 operating facts remain Pending. |
| HDB-02 | Critical | Open | Qualified privacy, residency, transfer and records conclusions remain unapproved. |
| HDB-03 | Critical | Open | No provider, account, region, topology or service tier is selected. |
| HDB-04 | Critical | Open | No reproducible quote, tax/support schedule or 12-month budget is approved. |
| HDB-05 | Critical | Open | Managed-service security, availability, maintenance and support evidence is unaccepted. |
| HDB-06 | Critical | Open | HOA-01–HOA-18 remain NotRun in an authorized managed environment. |
| HDB-07 | Critical | Open | RPO, RTO, invariant reconciliation, exit and deletion behavior remain unproven. |
| HDB-08 | Critical | Open | ADR acceptance, accountable approvals and downstream production gates remain unavailable. |

## Authority boundary

This scope does not select or recommend a provider, contact a provider, accept terms, create a cloud account, subscribe, provision resources, create secrets, enable connectivity, incur spend, deploy workloads, execute recovery tests or authorize production, paper or live trading.
