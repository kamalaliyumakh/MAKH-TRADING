# Paper-Trading Gate Evidence Index

Status: Prepared for review; external and operational evidence absent.

| Area                | Local evidence                                                                                                                   | Gate state                                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Risk                | `RISK_DOMAIN_ACCEPTANCE.md`; application risk contracts/tests                                                                    | Synthetic pass; acceptance/persistence/integration pending                                                          |
| Broker adapter      | `BROKER_PAPER_ADAPTER_ACCEPTANCE.md`; synthetic adapter/tests                                                                    | Synthetic pass; selected broker/certification pending                                                               |
| OMS                 | `PAPER_OMS_ACCEPTANCE.md`; OMS service/tests                                                                                     | Local pass; API/database/provider/recovery pending                                                                  |
| Positions           | `POSITION_LEDGER_ACCEPTANCE.md`; ledger/tests                                                                                    | Local pass; authoritative definitions/persistence pending                                                           |
| Reconciliation      | `RECONCILIATION_ACCEPTANCE.md`; reconciliation/tests                                                                             | Local pass; broker snapshots/orchestration/fencing pending                                                          |
| Trading UI          | `PAPER_TRADING_UI_ACCEPTANCE.md`; Angular route/tests/browser                                                                    | Local pass; authoritative integration/e2e/accessibility pending                                                     |
| Risk console        | `RISK_CONSOLE_ACCEPTANCE.md`; Angular route/tests/browser                                                                        | Local pass; privilege/MFA/API/game-day pending                                                                      |
| Trial               | `docs/paper-trial/`; `outputs/paper-trial/readiness-manifest.json`                                                               | Preparation 50%; deterministic evidence confirms not ready, authorized, executed or accepted and records no results |
| Security/operations | threat model, test matrix, environment/recovery documents                                                                        | Design/local evidence; independent/production-like evidence pending                                                 |
| Decision            | `PAPER_TRADING_GATE_APPROVAL.md`; `eng/verify-paper-trading-gate.mjs`; `outputs/paper-trading-gate/local-evidence-manifest.json` | Reject/Defer package verified locally; unsigned and certification unavailable                                       |

Evidence owners must replace narrative references with immutable build/run/artifact identifiers and approved electronic records before decision. Missing evidence is not equivalent to a pass.

The authoritative local gate state is `paper-trading-gate-state.json`. Its criterion, blocker and decision identities must remain one-to-one with the review and approval records; a local PASS verifies consistency only and cannot change the Reject/Defer decision.
