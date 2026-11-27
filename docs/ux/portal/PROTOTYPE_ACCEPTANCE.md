# MAKH Trading Platform — Portal Prototype Acceptance

Last updated: 14 October 2026  
Gate status: Pending product/risk and representative-user acceptance

## Coverage matrix

| ID | Area | Evidence | Status |
|---|---|---|---|
| PA-01 | Routes and role boundaries | PT-01–PT-13 | Ready for review |
| PA-02 | Critical flows | PF-01–PF-10 | Ready for review |
| PA-03 | Responsive layouts/fault states | PW-01–PW-07 plus fault overlays | Ready for review |
| PA-04 | Mode and safety language | Interaction content | Ready for risk review |
| PA-05 | Keyboard/screen-reader behavior | Design-system/accessibility contracts | Pending coded prototype testing |
| PA-06 | Trader comprehension/usability | UX validation targets | Pending participant testing |
| PA-07 | Risk/admin destructive workflows | PF-07–PF-09 | Pending authorized SME acceptance |
| PA-08 | Live experience | Design only | Not authorized; controlled-live gate applies |

## Scenario protocol

1. Identify active account/mode and explain health/entry state.
2. Review a 250% gain candidate with weak liquidity and unverified social attention.
3. Verify catalyst, build a paper proposal and respond to a hard risk rejection.
4. Submit an approved paper proposal and interpret Pending, Partial and Filled states.
5. Recover from a SignalR gap and broker acknowledgement timeout without duplication.
6. Cancel an eligible order while recognizing possible fills.
7. Review position protection and create a close proposal.
8. Contain a risk breach using Block, Cancel and (separately) Liquidate.
9. Reconcile a broker/platform mismatch.
10. Reconstruct and export an incident as an auditor.

## Acceptance hypotheses

- 100% identify Paper/Live before consequential actions.
- At least 90% understand scanner/evidence is not risk/order authority.
- At least 90% distinguish Accepted, Filled, Rejected and Unknown/Reconciliation.
- Zero duplicate submissions during timeout recovery.
- Zero unintended liquidation confirmations.
- All agreed journeys complete with keyboard; critical states remain perceivable at 400% zoom and with screen reader.

These are target criteria, not observed results. WBS 2.7 remains in progress until product/risk stakeholders accept the prototype and representative/coded accessibility evidence is recorded.

## Local readiness verification — 14 October 2026

`eng/verify-portal-ux-readiness.mjs` now fails closed across the 13-route catalogue, 10 critical flows, seven responsive wireframe surfaces, 10 consequential action labels, eight acceptance controls, 10 scenario steps and six acceptance hypotheses. It also corroborates eight authenticated smoke routes, the coded dashboard's PAPER/Locked/synthetic boundary and the rejected/deferred discovery predecessor.

The generated manifest hashes all eight evidence artifacts and records five blockers. Its decision is `Implementation Ready / Acceptance Pending`: it is evidence-package maturity only. No participant study, Product/Risk approval, accountable accessibility acceptance, production acceptance, paper-trading trial, publication or live-trading authority is created.
