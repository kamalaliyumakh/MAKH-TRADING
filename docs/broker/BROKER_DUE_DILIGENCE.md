# MAKH Trading Platform — Broker Due-Diligence Questionnaire

Last updated: 12 August 2026

## Account and regulatory

| ID | Question / evidence request |
|---|---|
| BD-01 | Confirm whether the named owner/entity and residence jurisdiction may open the proposed individual/business account. |
| BD-02 | Identify the contracting broker-dealer, regulators, clearing/custody arrangement and investor-protection disclosures. |
| BD-03 | Confirm self-directed third-party API use is permitted and whether application/vendor approval is required. |
| BD-04 | List onboarding, identity, tax, source-of-funds, sanctions and ongoing review requirements. |
| BD-05 | Confirm supported funding/withdrawal routes, currencies, fees, holds and name-matching requirements for the jurisdiction. |
| BD-06 | Confirm cash/margin account availability, PDT/margin behavior and broker house restrictions. |

## Instruments and execution

| ID | Question / evidence request |
|---|---|
| BD-07 | Confirm Nasdaq/NYSE common-share coverage and restrictions affecting USD 3–7 or low-float securities. |
| BD-08 | Provide supported order types/TIFs by session, security and paper/live mode. |
| BD-09 | Explain price collars, size limits, volatility/limit-state handling, shortability and halt/reopen behavior. |
| BD-10 | Define cancel/replace semantics under partial fill, cancel-pending, race and session boundaries. |
| BD-11 | Identify client-order ID uniqueness, retention and query-by-ID behavior after timeout/restart. |
| BD-12 | Explain executions, corrections/busts, commissions/fees and durable execution identifiers. |

## API, reliability and support

| ID | Question / evidence request |
|---|---|
| BD-13 | Provide production/paper endpoint, authentication, secret rotation, IP/network and session requirements. |
| BD-14 | Provide rate limits, maintenance windows, availability commitments, incident/status and deprecation policy. |
| BD-15 | Describe event delivery guarantees, ordering, duplicates, gaps and snapshot recovery. |
| BD-16 | Provide order, execution, position, cash/buying-power and activity reconciliation endpoints and history limits. |
| BD-17 | Document paper simulator fill rules and every order type or behavior that differs from live. |
| BD-18 | Provide test symbols/scenarios for rejects, partial fills, corrections, halts, timeout and insufficient buying power. |
| BD-19 | Confirm support hours, severity response, order-discrepancy escalation and after-hours emergency route. |
| BD-20 | Provide API/data terms covering storage, logs, audit records, display, derived data and termination/export. |

## Required proof sequence

1. Written eligibility response tied to the actual owner/entity and residence.
2. Contract/terms and fee review by Legal/Data/Security.
3. Paper credentials only, stored through the approved secret workflow.
4. Contract tests for capabilities and lifecycle mapping.
5. Fault/reconciliation tests including timeout, duplicate, missed event and manual broker activity.
6. Paper trial with broker statements/activity reconciled to platform records.
7. Vendor acceptance record.
8. Separately authorized live readiness; no paper result automatically enables live.

