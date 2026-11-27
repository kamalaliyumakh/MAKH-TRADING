# Paper-Trial Scenario Matrix

Every scenario records expected/actual outcome, correlation IDs, screenshots/logs/audit references, reconciliation result, defect ID and reviewer. “Pass” is prohibited without retained evidence.

| ID | Scenario | Required outcome | Minimum repetition |
|---|---|---|---:|
| PT-01 | Approved paper limit order | one proposal, one broker order; policy/version retained | 20 |
| PT-02 | User confirmation abandoned/expired | no order created | 5 |
| PT-03 | Duplicate/concurrent submit | at most one broker order; replay identified | 10 |
| PT-04 | Partial fill then cancel | cumulative fills preserved; remainder reconciled | 10 |
| PT-05 | Partial fill then replace | replacement never below fills; versions monotonic | 10 |
| PT-06 | Broker timeout after possible submit | no blind retry; unknown state locks entry until query/reconciliation | 10 |
| PT-07 | Fill correction/bust | immutable correction chain; position/P&L rebuilt | 5 each |
| PT-08 | Position/protection undercoverage | visible alert and entry lock according to policy | 5 |
| PT-09 | Order/position/cash mismatch | itemized evidence; account entry lock; clean run required to clear | 5 each |
| PT-10 | Market/reference data stale or partial | risk/scanner fail closed; no proposal from invalid state | 5 |
| PT-11 | Session boundary/corporate-action fixture | approved calculation and reconciliation rules applied | 3 each |
| PT-12 | Authorization/account-isolation denial | cross-account and insufficient-role access denied/audited | 10 |
| PT-13 | Session revocation/fresh-MFA expiry | privileged/consequential action denied | 5 |
| PT-14 | Block action | new entries stopped; existing state retained | 3 |
| PT-15 | Cancel containment | cancellable orders processed; partial/unknown outcomes reconciled | 3 |
| PT-16 | Liquidate containment rehearsal | separate confirmation; partial failure/resume/reconciliation evidenced | 3 |
| PT-17 | Dependency outage/recovery | degraded state visible; recovery uses authoritative snapshots | 3 per critical dependency |
| PT-18 | Restart/deployment during activity | idempotency, projections and locks survive restart | 3 |
| PT-19 | Backup/restore and broker reconciliation | restored system starts entry-locked; approved recovery objectives measured | 2 |
| PT-20 | Accessibility/usability critical journeys | mode, rejection, order/protection state and containment perceivable/operable | approved matrix |

Repetition counts are a proposed minimum and require Risk/QA approval. They cannot substitute for duration, market-condition coverage or statistically valid denominators.
