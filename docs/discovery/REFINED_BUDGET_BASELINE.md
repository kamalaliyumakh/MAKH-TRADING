# Refined Budget Baseline

Date: 12 August 2026  
Status: Cost structure and approval template ready; monetary baseline pending

## Estimating basis

- Delivery window: 17 August 2026 to 2 June 2027.
- Estimate class remains ROM ±30% until named capacity, rates, vendors, jurisdiction and hosting are confirmed.
- Labor derives from approved role capacity by delivery wave; external costs are quote-backed.
- Currency, exchange-rate date, tax treatment and contingency require Sponsor approval.
- Paper-production and controlled-live costs are separate; funding one does not authorize the other.

## Budget structure

| ID | Cost family | Required inputs | Current state |
|---|---|---|---|
| BUD-01 | Delivery labor | named role, loaded rate, FTE, dates and calendar | Pending |
| BUD-02 | Legal/privacy/regulatory | jurisdiction, scope, fee basis, tax | Pending quote |
| BUD-03 | Broker | eligibility, API/account/data, funding/FX/transfer costs | Pending eligibility/quote |
| BUD-04 | Market/reference/news data | entitlements, rights, volume and retention | Pending rights/quote |
| BUD-05 | Cloud platform | environment sizing and hosting TCO equation | Pending quote |
| BUD-06 | Identity/security | users, MFA, scanning, signing and independent testing | Pending selection/quote |
| BUD-07 | UX/accessibility | participants, assistive-technology coverage and audit | Pending plan/quote |
| BUD-08 | Test services | device/browser coverage, concurrency and retention | Pending selection |
| BUD-09 | Operations/support | tier, incident coverage, backup/archive and communications | Pending model |
| BUD-10 | Contingency | approved percentage on eligible uncertain costs | Pending Sponsor decision |

## Calculation rules

`Labor = sum(loaded role rate × approved effort)`

`External recurring = sum(quantity × contracted unit price × billed periods)`

`External one-time = implementation + advice + assurance + setup`

`Base budget = labor + external recurring + external one-time + tax`

`Approved envelope = base budget + approved contingency`

Every amount retains source, date, currency, tax basis, commitment term, expiry and owner. Provider calculator estimates are planning evidence, not quotes.

## Scenario control

| Scenario | Included scope | Funding decision |
|---|---|---|
| S1 Foundation | Local/test engineering through foundation gate; synthetic data | Before staffed C1 commitment |
| S2 Paper MVP | S1 plus public/portal/scanner/evidence/risk and paper production | Before paid provider/environment commitment |
| S3 Operational readiness | S2 plus reporting, monitoring, support and recovery exercises | Before paper operational acceptance |
| S4 Controlled live | Incremental legal, broker, data, security, operations and capital controls | Separate Sponsor go/no-go; excluded here |

## Approval inputs

| Input | Owner | Status |
|---|---|---|
| Named team and committed capacity | Project Manager | Pending |
| Loaded rates and procurement policy | Sponsor | Pending |
| Currency, FX source/date and tax treatment | Sponsor/Finance | Pending |
| Legal, broker, data, hosting, identity and assurance quotes | Relevant owner | Pending |
| Contingency and drawdown authority | Sponsor | Pending |
| S1–S3 funding ceiling and variance thresholds | Sponsor | Pending |

No monetary total is fabricated. The Discovery Gate cannot claim an approved budget until these inputs are populated and authorized.
