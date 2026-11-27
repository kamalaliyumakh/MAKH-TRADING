# MAKH Trading Platform — UX Validation Plan

Last updated: 12 August 2026

## Assumptions to validate

| ID | Assumption | Method | Required before |
|---|---|---|---|
| UV-01 | Risk-first public messaging builds trust without hiding core value | 5-second and comprehension tests with prospective users | WBS 2.6 copy approval |
| UV-02 | Persistent textual mode treatment prevents Paper/Live confusion | Prototype task and recall test | WBS 2.7 acceptance/live design gate |
| UV-03 | Users understand gain/RVOL/float as screening evidence, not a buy signal | Moderated scanner/symbol tasks | Scanner UI acceptance |
| UV-04 | Provenance and trust labels distinguish verified evidence from social attention | Card-sorting/comprehension tasks | Evidence UI acceptance |
| UV-05 | Order proposal and risk-result sequence supports safe correction | Moderated paper-order tasks | Paper trading acceptance |
| UV-06 | Canonical broker states and timeout language prevent duplicate action | Fault-state prototype tests | OMS UI acceptance |
| UV-07 | Block/cancel/liquidate hierarchy prevents destructive mistakes | Scenario test with risk administrators | Kill-switch acceptance |
| UV-08 | Dense scanner is usable with keyboard, screen reader, zoom and reduced motion | Accessibility task testing | Scanner/portal gates |
| UV-09 | Mobile monitoring/containment scope matches real usage | Context interview and mobile prototype | Responsive portal approval |
| UV-10 | Legal/risk wording is understood and not perceived as a performance promise | Comprehension test plus legal review | Public launch |

## Participant coverage

Recruit representative self-directed traders with varied experience, at least one risk/operations subject-matter participant, and accessibility participants covering screen reader, low vision/zoom and keyboard/motor needs. Avoid collecting live broker credentials or asking participants to place real trades; use synthetic paper scenarios.

## Test rounds

1. Low-fidelity information architecture and terminology.
2. Landing-page message/copy comprehension.
3. Portal high-risk workflows and fault states.
4. Accessible coded prototype with keyboard/screen-reader/zoom.
5. Paper-production observation and feedback before any live decision.

## Evidence and decision rules

Record participant profile category, task, observation, severity, quote summary without unnecessary personal data, recommended change, owner and disposition. Critical findings involving mode, authorization, risk, order state or destructive action block acceptance. Other findings are prioritized by frequency, impact and effort.
