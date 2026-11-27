# Public Legal and Privacy Acceptance

Date: 24 October 2026  
WBS: 4.3  
Status: In progress — 90%

## Implemented local scope

- `/legal/risk` now covers loss, exceptional 100%–600% moves, liquidity, execution, stops, gaps, halts, data, social manipulation, technology, broker authority, paper limitations and self-directed responsibility.
- `/privacy` now covers anticipated data categories, purposes, providers/transfers, retention, data-subject choices, analytics/cookies, security and unresolved controller/contact fields.
- Both pages display a stable draft document ID, version, review date and unambiguous provisional status.
- Risk disclosures provide an on-page contents navigation and print action; print styles remove application controls and avoid breaking individual disclosure sections where possible.
- Official educational references are limited to primary regulator sources and explicitly do not imply approval of MAKH.
- The public routes contain no form, checkbox or acceptance mechanism. They state that versioned acknowledgement belongs only in an approved authenticated onboarding flow where required.

## Verification evidence

- The public suite executes 26 passing test instances across two targets, including document-version, planned-stop, broker-authority, analytics-disabled and no-public-checkbox assertions.
- The executable readiness verifier checks twelve versioning, disclosure, privacy, consent, print, source, regression and predecessor conditions and hashes eleven artifacts.
- Browser checks at 1440 × 900 and 320 × 760 confirm one H1, four metadata records, working anchors, no horizontal overflow and no console errors.
- Print rules hide navigation/actions and apply section break avoidance.
- No request, preference, consent, identity, broker or account data is collected or transmitted.

## Primary-source baseline checked

- Nigeria Data Protection Act 2023, Nigeria Data Protection Commission.
- U.S. SEC investor guidance on microcap/low-priced-stock risks.
- FINRA investor guidance on stop orders during volatile markets.
- Investor.gov guidance on social-media stock-tip scams.

These sources support risk and privacy issues for review; they do not establish MAKH's jurisdiction-specific legal conclusions.

## Remaining acceptance conditions

- WBS 1.2 qualified legal/privacy review and WBS 2.6 copy approval remain open.
- Legal entity, jurisdiction, eligibility, controller/processor roles, lawful bases, retention, transfers, contacts, rights workflow, complaints, liability, disputes and final effective dates remain unresolved.
- Authenticated versioned consent/acknowledgement capture is deferred until approved documents and legal requirements exist.
- Frontend Lead, accessibility, security and Product Owner acceptance remain pending.
- No publication, analytics, identity provider, broker, market-data or live-trading connection is authorized.

## Decision

Advance WBS 4.3 to 90% and retain `In Progress`. The public draft routes, version metadata and executable evidence package are implementation-ready; qualified approval and any required authenticated acknowledgement remain incomplete. This record does not authorize publication, analytics, paper trading or live trading.
