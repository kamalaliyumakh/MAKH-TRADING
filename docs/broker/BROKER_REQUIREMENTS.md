# MAKH Trading Platform — Broker Requirements

Last updated: 12 August 2026  
Status: Evaluation baseline; no broker selected

## Mandatory gates

| ID | Requirement | Verification evidence | Failure consequence |
|---|---|---|---|
| BR-01 | Accepts the confirmed account owner/entity and residence jurisdiction for the intended account type. | Written eligibility response and approved application | Candidate eliminated |
| BR-02 | Permits self-directed API trading of Nasdaq/NYSE common shares, including supported USD 3–7 securities. | Contract, permissions and paper symbol tests | Candidate eliminated |
| BR-03 | Provides a segregated paper environment with separate credentials/account identity. | Paper account and mode-segregation test | Candidate eliminated |
| BR-04 | Provides supported API authentication suitable for server-side custody and rotation. | Security documentation and credential drill | Candidate eliminated |
| BR-05 | Accepts a stable client order identifier or supplies a durable correlation mechanism. | Duplicate/timeout contract test | Candidate eliminated |
| BR-06 | Supports queryable orders, executions, positions, cash and buying power for reconciliation. | Snapshot/event comparison tests | Candidate eliminated |
| BR-07 | Represents partial fills, corrections, cancel-pending, rejection and unknown/pending states without lossy simplification. | Lifecycle replay matrix | Candidate eliminated |
| BR-08 | Supports submit, query and cancel for limit orders; replace or cancel/recreate semantics are documented. | Paper lifecycle tests | Candidate eliminated |
| BR-09 | Discloses rate limits, maintenance/session behavior and retry guidance. | Vendor limits and fault tests | Candidate eliminated |
| BR-10 | Provides official support and escalation for order/execution discrepancies. | Support plan and test ticket | Candidate eliminated |
| BR-11 | Contract permits the proposed API use, data retention, audit evidence and display. | Legal/vendor review | Release blocked |
| BR-12 | Paper limitations are documented and do not masquerade as live execution evidence. | Paper-vs-live limitation register | Paper certification blocked |

## Required order capabilities

| ID | Capability | MVP position |
|---|---|---|
| BC-01 | Whole-share U.S. equity limit buy/sell | Mandatory |
| BC-02 | Marketable-limit entry | Mandatory, subject to broker price collars |
| BC-03 | Cancel remaining quantity | Mandatory |
| BC-04 | Replace price/quantity | Preferred; controlled cancel/recreate acceptable after reconciliation design |
| BC-05 | Day and GTC time in force | Mandatory |
| BC-06 | Extended-hours eligibility/state | Optional initially; default disabled |
| BC-07 | Stop and stop-limit exit | Required before live unless synthetic protection receives explicit risk approval |
| BC-08 | Bracket/OCO/trailing protection | Preferred; must be paper-tested and broker-confirmed before reliance |
| BC-09 | Fractional shares | Out of MVP; must not weaken quantity/idempotency logic |
| BC-10 | Short selling/margin | Out of MVP until separately approved; long/cash-capable design preferred |

## Safety and operational requirements

- Broker authority: accepted orders, executions, live positions and buying power.
- MAKH authority: user intent, risk policy/decision, normalized state, audit and reconciliation findings.
- A transport success is not an execution; a timeout is not a rejection.
- Repeated callbacks and execution events are expected and processed idempotently.
- New exposure is blocked when the order or position truth is unknown.
- Paper and live keys, accounts, endpoints, configuration, monitoring and user treatment remain segregated.
- Broker-native risk checks supplement rather than replace MAKH's centralized risk decision.
- Manual broker activity is detected through full snapshots/reconciliation and never silently overwritten.

