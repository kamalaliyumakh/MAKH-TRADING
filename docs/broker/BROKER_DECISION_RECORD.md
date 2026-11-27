# MAKH Trading Platform — Broker Decision Record

Decision ID: DEC-BROKER-001  
Date: 13 October 2026  
Status: Pending — shortlist established, no selection or account authorization

## Decision needed

Select a broker route that legally accepts the confirmed owner/entity and jurisdiction and satisfies the paper-first API, lifecycle, reconciliation, security and support requirements.

## Current recommendation

1. Confirm LF-01–LF-08 from the legal discovery package, particularly the account owner/entity, residence, owner-only scope and compensation model.
2. Use Alpaca's global paper-only Trading API as the first technical contract-test candidate if its terms permit the intended development use. This is not a recommendation or approval for live brokerage.
3. Request written live-account and funding eligibility from Alpaca for the confirmed owner/entity and jurisdiction.
4. Reconsider IBKR only if the confirmed residence/entity is supported; Nigeria is absent from its current available-country list.
5. Eliminate Tradier for a Nigerian-resident owner unless its official eligibility policy changes and written approval is obtained.
6. Treat Alpaca Broker API and DriveWealth as future B2B options requiring a formal scope change, commercial agreement and regulatory approval; they do not fit the current owner-only MVP by default.

## Why no broker is selected

The operator and jurisdiction facts remain unconfirmed. Under the Nigeria-resident hypothesis, no reviewed individual live route has yet passed the mandatory eligibility and funding gates. Selecting on API quality alone would create a false live-delivery assumption.

## Conditions for approval

| Condition | Accountable role | Status |
|---|---|---|
| Actual owner/entity and residence recorded | Sponsor | Pending |
| Qualified legal classification and launch constraints approved | Legal / Compliance | Pending |
| Written account/API/funding eligibility received | Solution Architect | Pending |
| Contract, fees, market-data and record rights approved | Legal / Data owner | Pending |
| Security/session/secret model approved | Security Lead | Pending |
| BAT-01–18 completed in paper environment | Engineering / QA | Pending |
| Paper vendor certification signed | Product / Risk / Operations | Pending |
| Separate controlled-live go/no-go | Sponsor and all live gate owners | Pending |

## Local readiness verification

Run `node eng/verify-broker-discovery-readiness.mjs` to validate the broker-discovery package and write `outputs/broker-discovery-readiness/readiness-manifest.json`.

The verifier checks BR-01–BR-12, BC-01–BC-10, eight safety rules, five candidate routes, BD-01–BD-20, eight proof steps, BAT-01–BAT-18, eight Pending decision conditions, the unavailable scope/legal predecessors and the no-account/no-credential/no-trading-authority boundary. It hashes all eight evidence inputs and fails closed if an inventory or authority boundary changes.

Passing local verification means **Prepared / Eligibility and Certification Pending** only. It does not select a broker, establish eligibility, approve terms, authorize outreach/account opening/credentials, execute BAT evidence, certify paper trading, or create live-trading authority.

No account opening, credential creation, commercial outreach or live order is authorized by this record.

