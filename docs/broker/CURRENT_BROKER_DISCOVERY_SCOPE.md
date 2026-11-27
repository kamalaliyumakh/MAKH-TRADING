# WBS 1.3 — Current Broker Eligibility and Integration Discovery Scope

Review date: 28 October 2026  
Decision: **Prepared / Regulated-Operator Eligibility, Contract and Certification Pending**  
Selection state: **No broker selected**

## Mandatory broker gates

The current BR-01–BR-12 and BC-01–BC-10 inventories in `BROKER_REQUIREMENTS.md` remain the mandatory functional baseline. No candidate passes a gate without current written evidence bound to the confirmed owner/entity, residence, account type and intended use.

## Required operating facts

| ID | Fact | Accountable owner | State |
|---|---|---|---|
| BF-01 | Confirmed account owner/entity and control persons | Sponsor | Pending |
| BF-02 | Residence, incorporation and operating jurisdictions | Sponsor / Legal | Pending |
| BF-03 | Owner-only versus third-party user scope | Product Owner / Legal | Pending |
| BF-04 | Cash, margin, retirement, corporate or other account type | Risk / Broker Owner | Pending |
| BF-05 | Funding source, currency, bank route and withdrawal controls | Sponsor / Operations | Pending |
| BF-06 | Intended instruments, venues, price range, order types, sessions and frequency | Product / Risk | Pending |
| BF-07 | Compensation, referral, advisory, sub-broker or intermediary role | Sponsor / Legal | Pending |
| BF-08 | Required market-data, news, display, derived-use and retention rights | Data Owner | Pending |
| BF-09 | Server/credential locations, custody, rotation and support model | Security / Operations | Pending |
| BF-10 | Tax, AML/KYC, sanctions, records and reporting allocation | Qualified reviewer | Pending |

## Evidence required for any candidate

| ID | Evidence | State |
|---|---|---|
| BE-01 | Current regulator registration and permitted function | Pending |
| BE-02 | Written owner/entity/residence/account/API eligibility | Pending |
| BE-03 | Approved customer, API, market-data and record-retention terms | Pending |
| BE-04 | Complete fees, funding, withdrawal, tax and currency schedule | Pending |
| BE-05 | Authentication, authorization, credential and incident controls | Pending |
| BE-06 | Order/execution/position/cash lifecycle and reconciliation contract | Pending |
| BE-07 | Rate limits, maintenance, support and discrepancy escalation | Pending |
| BE-08 | Segregated paper environment and limitations | Pending |
| BE-09 | BAT-01–BAT-18 executed with immutable evidence | Pending |
| BE-10 | Paper-trading certification and accountable acceptance | Pending |

## Selection rules

- Registration is verified directly with the relevant regulator at the decision date.
- Written eligibility must match the confirmed owner/entity, residence, account type, funding route and intended API use.
- Technical API access, a sandbox or public documentation does not establish legal eligibility or contract permission.
- Paper credentials, accounts, endpoints, configuration, monitoring and user treatment remain segregated from live.
- Unknown broker state blocks new exposure; transport success is not an execution and timeout is not rejection.
- Broker truth remains authoritative for accepted orders, executions, positions, cash and buying power; MAKH retains intent, risk, normalized state, audit and reconciliation evidence.
- Any changed owner, jurisdiction, product scope, compensation model, provider status, terms or account permissions triggers re-review.

## Current blockers

| ID | Severity | State | Blocker |
|---|---|---|---|
| BRB-01 | Critical | Open | BF-01–BF-10 owner, jurisdiction, account, funding and role facts remain Pending. |
| BRB-02 | Critical | Open | Qualified WBS 1.2 classification and launch constraints remain unapproved. |
| BRB-03 | Critical | Open | No candidate has written eligibility for the confirmed facts and intended API use. |
| BRB-04 | Critical | Open | No customer/API/data/records contract or complete fee/funding schedule is approved. |
| BRB-05 | Critical | Open | Security, lifecycle, reconciliation, support and recovery evidence is unaccepted. |
| BRB-06 | Critical | Open | BAT-01–BAT-18 remain NotRun and no vendor paper certification exists. |
| BRB-07 | Critical | Open | Paper gate, controlled-live gate and accountable broker decision remain rejected/deferred or Pending. |

## Authority boundary

This scope does not select or recommend a broker, contact a provider, submit an application, open or fund an account, create credentials, accept terms, purchase data, execute a test, certify paper trading, connect a live endpoint, allocate capital or authorize an order or live trading.

