# Paper-Trading Certification Gate Review

Date refreshed: 25 October 2026  
WBS: 7.9  
Accountable role: Sponsor  
Status: Review package prepared; certification blocked

## Recommendation

Reject certification at this time. Local synthetic risk, broker-adapter, OMS, position, reconciliation and portal evidence is coherent enough to structure the gate, but WBS 7.1–7.8 are not accepted, no operational paper trial has run, and no accountable certification approvals exist. Keep WBS 7.9 In Progress at preparation maturity only.

## Gate evidence

| ID     | Criterion                                                                        | Result            | Evidence / remaining action                                                                                                   |
| ------ | -------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| PTG-01 | Effective policy and fail-closed risk decisions constrain every proposal         | Pass — synthetic  | WBS 7.1 local tests; persistence, authority and acceptance pending                                                            |
| PTG-02 | Paper broker mapping preserves identity, idempotency and unknown outcomes        | Pass — synthetic  | WBS 7.2 contract tests; selected-provider certification pending                                                               |
| PTG-03 | OMS proposals/submission/cancel/replace are authorized, versioned and idempotent | Pass — local      | WBS 7.3 tests; REST/PostgreSQL/provider integration pending                                                                   |
| PTG-04 | Executions, corrections, positions, P&L and protection are deterministic         | Pass — local      | WBS 7.4 tests; broker truth, approved definitions and persistence pending                                                     |
| PTG-05 | Order/position/cash mismatches fail closed and retain evidence                   | Pass — local      | WBS 7.5 tests; broker snapshots, orchestration and durable fencing pending                                                    |
| PTG-06 | Paper trading UI exposes confirmation, state, protection and lockout             | Pass — local      | WBS 7.6 portal/browser evidence; authoritative integration and formal accessibility pending                                   |
| PTG-07 | Risk console separates Block, Cancel and Liquidate workflows                     | Pass — local      | WBS 7.7 portal/browser evidence; privileged APIs, MFA and game-day tests pending                                              |
| PTG-08 | Paper/live accounts, endpoints, credentials and configuration are segregated     | Fail              | No selected broker, credential sets or paper-production environment exists                                                    |
| PTG-09 | Licensed/entitled market and evidence data support the trial                     | Fail              | Provider contracts, rights and production feeds are absent                                                                    |
| PTG-10 | Authorized paper trial completes mandatory scenarios and metrics                 | Fail              | WBS 7.8 is 50% preparation; its state register and executable manifest confirm no authorization, run records or results exist |
| PTG-11 | D1/D2 defects are closed and D3/D4 dispositions accepted                         | Fail              | No trial defect register or closure/retest record exists                                                                      |
| PTG-12 | Security, privacy, accessibility, recovery and operational evidence is accepted  | Fail              | Independent and production-like evidence remains incomplete                                                                   |
| PTG-13 | WBS 7.1–7.8 and required predecessor gates are accepted                          | Fail — dependency | All remain In Progress and applicable earlier gates are unsigned                                                              |
| PTG-14 | Sponsor and accountable owners certify the reviewed paper scope                  | Pending           | Approval record is unsigned                                                                                                   |

## Certification blockers

| Finding                                                                                                           | Severity                   | Required disposition                                                         |
| ----------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| No selected/approved broker, eligible paper account or provider certification exists.                             | Critical broker/governance | Complete broker due diligence, contract and certified paper integration.     |
| No licensed/entitled real market/evidence data or permitted operational-use schedule exists.                      | Critical licensing         | Execute provider agreements and verify rights/quality/replay.                |
| Trading services are local/in-memory and not integrated through authorized APIs, PostgreSQL, outbox and recovery. | Critical reliability       | Complete durable integration and operational verification.                   |
| Paper/live separation, secrets, allowlists and environment controls are unproven.                                 | Critical safety/security   | Provision segregated paper production and independently verify no live path. |
| WBS 7.8 has no authorized sessions, metrics, defects, reconciliation/recovery results or final report.            | Critical evidence          | Run the approved trial and obtain accountable acceptance.                    |
| Accessibility/usability, penetration, load/chaos, kill-switch and restore drills remain incomplete.               | High assurance             | Execute approved test/drill matrices and remediate findings.                 |
| WBS 7.1–7.8 and applicable earlier gates lack accountable acceptance.                                             | High governance            | Close predecessors or record valid, expiring exceptions where permitted.     |
| Sponsor, Product, Risk, Security, Compliance, QA and Operations approvals are absent.                             | Critical governance        | Record authorized decisions in the approval record.                          |

## Local verification snapshot

- The retained backend baseline is 426 architecture and 66 API-security tests. Fresh architecture execution is currently blocked by an unrelated existing `PaperOmsServiceTests` compile error and is not represented as current passing evidence.
- 141 trading-portal tests, application type-check and Angular boundaries pass for the current implemented portal scope; retained production-build/browser evidence remains documented in the component acceptance records.
- WBS 7.8 contains 10 Pending preconditions, PT-01–PT-20 as NotRun, 7 Pending approvals and templates explicitly labelled not executed/no results; `outputs/paper-trial/readiness-manifest.json` enforces that boundary.
- No external broker, licensed feed, database-backed trading workflow, paper-production environment, operational trial or live action is connected or authorized.

## Executable local review

Run `node eng/verify-paper-trading-gate.mjs` to validate the fourteen criteria, eight blockers, eight pending accountable decisions, unsigned approval boundary, current WBS 7.1–7.8/foundation manifests and fail-closed WBS 7.8 state. The verifier hashes thirteen evidence artifacts and writes `outputs/paper-trading-gate/local-evidence-manifest.json`. A successful run means only that the local Reject/Defer package is internally consistent; it does not accept the gate.

## Decision boundary

This package supports review and exposes why certification must be rejected. It does not certify paper trading, approve a paper deployment, waive missing evidence, authorize procurement, or permit controlled-live preparation or activity.
