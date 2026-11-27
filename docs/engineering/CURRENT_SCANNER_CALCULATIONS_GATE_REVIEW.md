# Current Scanner Calculations Gate Review

Date: 4 November 2026  
WBS: 5.4  
Decision: **Local Calculation Integrity Ready / Definitions, Persistence and Licensed Replay Pending**

## Criteria

| ID | Criterion | Result |
|---|---|---|
| SCC-01 | Versioned $3–$7, 3× RVOL and 500k float policy exists. | LocalPass |
| SCC-02 | Inclusive 100%–600% elevated-move boundary is enforced. | LocalPass |
| SCC-03 | Price requires executable quote and eligible trade evidence. | LocalPass |
| SCC-04 | Future quote evidence invalidates price and spread. | LocalPass |
| SCC-05 | RVOL, spread, spread-percent and dollar-volume formulas are deterministic. | LocalPass |
| SCC-06 | Float binds canonical security and `PublicFloat` kind. | LocalPass |
| SCC-07 | Float observation after calculation time cannot qualify. | LocalPass |
| SCC-08 | Calculations create no order authority. | LocalPass |
| SCC-09 | Focused .NET 10 tests freshly execute. | Fail |
| SCC-10 | Definitions, rounding, freshness, sale conditions and sessions are approved. | Fail |
| SCC-11 | Corporate-action adjustment policy is approved. | Fail |
| SCC-12 | Spread, liquidity, depth and confidence thresholds are approved. | Fail |
| SCC-13 | PostgreSQL immutable input/version/evidence snapshots are certified. | Fail |
| SCC-14 | Licensed correction/split/halt/gap/early-close replay passes. | Fail |
| SCC-15 | Data, Backend, Risk and Product owners accept calculations. | Pending |

Summary: **8 LocalPass / 0 Conditional / 6 Fail / 1 Pending**. A 100%–600% move is an elevated-risk discovery condition, never standalone order authority.

## Blockers

| ID | Severity | State | Blocker |
|---|---|---|---|
| SCB-01 | High | Open | Fresh focused .NET 10 execution is unavailable. |
| SCB-02 | Critical | Open | Calculation definitions and rounding/precision are unapproved. |
| SCB-03 | Critical | Open | Quote freshness, sale conditions and sessions are unapproved. |
| SCB-04 | Critical | Open | Corporate-action adjustment policy is unapproved. |
| SCB-05 | Critical | Open | Spread, dollar-volume, depth and confidence thresholds are undefined. |
| SCB-06 | Critical | Open | PostgreSQL input/evidence/version snapshots are incomplete. |
| SCB-07 | Critical | Open | Licensed correction and split replay is absent. |
| SCB-08 | High | Open | Halt, missing-interval and early-close replay is absent. |
| SCB-09 | Critical | Open | WBS 5.1–5.3 predecessors remain unaccepted. |
| SCB-10 | Critical | Open | Data, Backend, Risk and Product approvals are absent. |

## Authority boundary

This review creates no definition approval, licensed replay certification, scanner publication, ranking override, order, paper, pilot, capital, broker-order or live-trading authority.

## Exit sequence

1. Obtain fresh focused and full .NET verification.
2. Approve calculation definitions and precision/rounding.
3. Approve freshness, sale-condition and session policy.
4. Approve corporate-action adjustment policy.
5. Approve spread/liquidity/depth/confidence thresholds.
6. Implement immutable PostgreSQL calculation snapshots.
7. Prove correction/split replay.
8. Prove halt/gap/early-close replay using licensed evidence.
9. Accept WBS 5.1–5.3.
10. Obtain Data, Backend, Risk and Product approvals.
