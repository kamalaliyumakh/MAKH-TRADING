# MAKH Trading — Scanner-to-Risk Workflow UAT

Test date: 26 August 2026  
Environment: Local Angular public/portal applications  
Identity: Approved temporary browser-session UAT account with email verification, password and MFA

## Executive result

**PASS after two business-rule corrections.**

The authenticated discovery-to-risk journey was exercised from scanner qualification through symbol evidence, paper-order preparation and the risk console. The test found and corrected one qualification inconsistency and one potentially unsafe order-ticket statement.

## Resolved findings

### UAT-WORKFLOW-001 — Gain range was not enforced

- Initial state: `SYNA` was shown as Qualified with a 68% gain even though the approved discovery preset requires 100%–600%.
- Correction: gain-range matching is now part of `MatchesDiscoveryPreset`, scanner-service exclusion reasoning and the Angular synthetic snapshot.
- UI correction: the funnel now shows Universe, Price, RVOL, Float, Gain and Qualified stages.
- Retest: one of four candidates qualifies; `SYNA` appears under Excluded with `Gain is outside the 100%–600% preset range.`

### UAT-WORKFLOW-002 — Float and order quantity were conflated

- Initial state: the order ticket described `quantity up to 500,000 shares` as an MVP guardrail.
- Risk: 500,000 is the approved candidate public-float ceiling, not a safe pre-approved order size.
- Correction: the ticket now states that price/public float are discovery rules and order quantity separately requires server-side position, exposure and loss-limit checks.
- Retest: corrected copy renders and paper-order review remains disabled while account/risk authority is unavailable.

## Acceptance results

| ID              | Scenario                                                          | Result                |
| --------------- | ----------------------------------------------------------------- | --------------------- |
| UAT-WORKFLOW-01 | Scanner shows price $3–$7                                         | Pass                  |
| UAT-WORKFLOW-02 | Scanner shows RVOL ≥ 3×                                           | Pass                  |
| UAT-WORKFLOW-03 | Scanner shows public float ≤ 500,000                              | Pass                  |
| UAT-WORKFLOW-04 | Scanner enforces gain 100%–600%                                   | Pass after correction |
| UAT-WORKFLOW-05 | Exclusions retain gain, RVOL and stale-input reasons              | Pass                  |
| UAT-WORKFLOW-06 | Scanner contains no order-submission controls                     | Pass                  |
| UAT-WORKFLOW-07 | Qualified SYNB opens the evidence workspace                       | Pass                  |
| UAT-WORKFLOW-08 | Workspace shows price, gain, RVOL, float and source hierarchy     | Pass                  |
| UAT-WORKFLOW-09 | Catalyst remains unverified and social evidence low-trust         | Pass                  |
| UAT-WORKFLOW-10 | Proposal readiness and entry remain locked                        | Pass                  |
| UAT-WORKFLOW-11 | Paper-order review remains disabled without authoritative context | Pass                  |
| UAT-WORKFLOW-12 | Risk console fails closed and pause controls remain unavailable   | Pass                  |
| UAT-WORKFLOW-13 | Browser console contains no warnings/errors                       | Pass                  |

## Automated verification

- 69 portal tests pass.
- Portal production build passes without warnings.
- Angular import-boundary verification passes.
- The corrected scanner source compiles in the pinned project-local .NET SDK 10.0.400 Release build with zero warnings and zero errors.
- All 328 .NET tests pass: 307 architecture/domain/application/infrastructure tests and 21 API security tests.

## Release boundary

All data and accounts are synthetic and local. Provider data, database persistence, server APIs, broker/risk/reconciliation authority, production identity, load/accessibility evidence and accountable approvals remain required. This result authorizes no paper trial, live trade or release.
