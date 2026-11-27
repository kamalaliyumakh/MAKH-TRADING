# WBS 9.5 — Controlled-Live Pilot Scenario and Metric Matrix

Date prepared: 14 August 2026  
Status: Proposed — no scenario executed and no metric observed

## Scenario framework

| ID | Scenario | Required outcome | Current result |
|---|---|---|---|
| CLP-01 | Pre-open gate/config/account/limit verification | any missing or mismatched evidence prevents entry-lock clearance | Not executed |
| CLP-02 | Approved minimal limit-order lifecycle | one intent, risk decision and broker order; complete audit/reconciliation | Not executed |
| CLP-03 | Abandoned, expired or stale confirmation | no broker order | Not executed |
| CLP-04 | Duplicate/concurrent submit | at most one broker order; replay identified | Not executed |
| CLP-05 | Partial fill and cancel | cumulative fills retained; remainder and position reconciled | Not executed |
| CLP-06 | Broker timeout/unknown outcome | no blind retry; entries lock until authoritative resolution | Not executed |
| CLP-07 | Hard-limit/daily-loss boundary | command denied or entries stopped at approved threshold | Not executed |
| CLP-08 | Session/MFA/entitlement revocation | consequential action denied; session/control evidence retained | Not executed |
| CLP-09 | Order/position/cash mismatch | immediate entry lock and itemized reconciliation evidence | Not executed |
| CLP-10 | Stale/partial market or reference data | proposal/order path fails closed | Not executed |
| CLP-11 | Entry block and cancel containment | new entries stop; cancellable orders handled idempotently | Not executed |
| CLP-12 | Separately authorized liquidation rehearsal | fresh MFA, impact preview, confirmation, partial-failure resume and reconciliation | Not executed |
| CLP-13 | Dependency/telemetry degradation | visible degradation and safe entry block; recovery uses authoritative snapshots | Not executed |
| CLP-14 | Restart/rollback/revocation | entry lock survives; release/session/credential controls and state reconcile | Not executed |
| CLP-15 | Post-session evidence closure | broker/local state reconciled; manifest complete; continuation explicitly decided | Not executed |

Repetitions, symbols, market conditions and duration require Risk/QA approval in the signed WBS 9.4 scope. This matrix supplies no permission to manufacture results.

## Measurement rules and proposed gates

| Metric | Definition | Proposed treatment |
|---|---|---|
| Unauthorized accepted commands | accepted commands without valid identity/account/permission/MFA | zero; any occurrence stops pilot |
| Duplicate live orders | duplicate broker orders per unique approved intent | zero; any occurrence D1 |
| Risk bypasses | accepted order while a mandatory rule failed or was unknown | zero; any occurrence D1 |
| Paper/live/account crossover | mismatched endpoint/account/credential/configuration | zero; immediate stop |
| Hard-limit adherence | commands/exposure within every approved ceiling | 100%; ambiguity stops pilot |
| Daily-loss containment | entry block at or before approved loss ceiling | 100% of threshold opportunities |
| Unknown-outcome containment | unknown outcomes that blocked blind retry / total unknown outcomes | 100% |
| Reconciliation closure | mismatches resolved with immutable evidence / total mismatches | 100%; no silent deletion |
| Protection coverage | protected quantity / open quantity within approved window | 100% unless expressly scoped scenario |
| Scenario evidence completeness | scenarios with expected/actual/correlation/reconciliation/reviewer evidence | 100% of authorized scope |
| Capital utilization | peak deployed capital versus approved pilot ceiling | must never exceed ceiling |
| Loss and drawdown | realized/unrealized loss using approved calculation and as-of data | informational plus hard-stop comparison; not a performance promise |

Report numerator, denominator, sample count, exclusions, collection version and evidence reference. Profit, win rate or gain percentage cannot override a safety failure or justify expanded capital.
