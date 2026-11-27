# WBS 1.3 — Current Broker Decision Register

Register date: 28 October 2026  
Decision: **Pending — no broker selected, contacted or authorized**

## Required decisions

| ID | Decision | Accountable owner | State | Durable evidence |
|---|---|---|---|---|
| BDD-01 | Confirm owner/entity, residence, user scope and account type | Sponsor / Legal | Pending | Pending |
| BDD-02 | Approve regulatory classification and permitted broker/intermediary model | Qualified reviewer | Pending | Pending |
| BDD-03 | Verify regulator status, function and written account/API/funding eligibility | Broker Owner | Pending | Pending |
| BDD-04 | Approve customer/API/data/records terms, fees and funding controls | Legal / Data / Finance | Pending | Pending |
| BDD-05 | Approve security, credential, session and incident model | Security / Operations | Pending | Pending |
| BDD-06 | Accept lifecycle, idempotency, reconciliation and support contract | Engineering / Risk / Operations | Pending | Pending |
| BDD-07 | Accept BAT-01–BAT-18 results and vendor paper certification | Product / Risk / QA | Pending | Pending |
| BDD-08 | Authorize any provider outreach, application or account-opening activity | Sponsor | Pending | Pending |
| BDD-09 | Accept paper-trading gate for the chosen broker scope | Product / Risk / Operations | Pending | Pending |
| BDD-10 | Make separate controlled-live decision, if ever eligible | Sponsor and live-gate owners | Pending | Pending |

## Decision rules

- Every decision must bind the same candidate legal entity, regulator status, owner/entity, jurisdiction, account type, terms version, API scope and evidence manifest.
- A changed candidate, entity, jurisdiction, account, terms, permissions or provider status requires a new decision.
- Paper success cannot authorize live operation, and performance cannot override a safety or eligibility failure.
- Codex may prepare comparisons and verify evidence structure. Codex cannot select/contact a broker, accept terms, open/fund an account, create credentials, purchase services or authorize paper/live trading.

