# MAKH Trading Platform — Broker Adapter Acceptance Matrix

Last updated: 12 August 2026  
Status: Planned; no provider credentials configured

| Test ID | Scenario | Required result |
|---|---|---|
| BAT-01 | Submit one risk-approved paper limit order | One provider order correlated to stable client intent |
| BAT-02 | Repeat identical request and client key | Original result returned; no second provider order |
| BAT-03 | Same key with changed payload | Conflict; no provider call |
| BAT-04 | Transport timeout after possible submission | Unknown/pending reconciliation; query before any retry |
| BAT-05 | Duplicate/out-of-order order updates | Idempotent monotonic canonical state |
| BAT-06 | Partial fills followed by cancel | All executions retained; only remainder cancelled |
| BAT-07 | Cancel/fill race | Broker truth wins; no false fully-cancelled state |
| BAT-08 | Replace during partial fill | Revised quantity/price cannot contradict cumulative fill |
| BAT-09 | Execution correction/bust | Corrective fact retained; positions/P&L recomputed and audited |
| BAT-10 | Manual broker order/position appears | Reconciliation detects and blocks unsafe new exposure |
| BAT-11 | Buying-power or account restriction changes | Fresh broker value applied before submission; rejection normalized |
| BAT-12 | Halt, price collar or unsupported order | Safe broker reason mapped; no blind retry/override |
| BAT-13 | Event connection gap | Snapshot recovery and sequence checkpoint restore consistency |
| BAT-14 | Process restart | Open orders, executions, positions and cash reconcile without duplication |
| BAT-15 | Paper/live credential swap attempt | Configuration/identity controls reject startup or submission |
| BAT-16 | Kill-switch cancel workflow | Idempotent requests, partial outcomes visible, reconciliation completes |
| BAT-17 | Statement/activity reconciliation | Platform executions, fees, positions and cash differences explained or locked |
| BAT-18 | Secret rotation/revocation | Old credential stops; no secret appears in log, error or audit payload |

No BAT result has been executed. These are provider-selection and later WBS 7.2 certification criteria.

