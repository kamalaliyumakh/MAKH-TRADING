# MAKH Trading Platform — Portal Interaction Content

Last updated: 12 August 2026

## Canonical state labels

| System state | User-facing label | Guidance |
|---|---|---|
| Paper account | `PAPER — simulated broker account` | Orders do not use live funds; results do not predict live performance |
| Live account | `LIVE — real funds and market execution risk` | Requires entitlement, fresh MFA and approved live environment |
| Stale market data | `Market data is stale` | New entries are blocked. Refresh or wait for a current snapshot |
| Broker unknown | `Broker acknowledgement unknown` | Reconciliation is querying the broker. Do not submit the same intent again |
| Mismatch | `Account reconciliation mismatch` | New entries are blocked until broker and platform state are reconciled |
| Risk rejected | `Order proposal blocked by risk policy` | Review failed rules; create a new proposal after safe correction |
| Cancel pending | `Cancellation requested` | Fills may occur until the broker confirms no remaining working quantity |
| Partial fill | `Partially filled` | Show `{filled} of {quantity}` and remaining/protection state |

## Consequential buttons

- `Submit paper limit order`
- `Submit live limit order`
- `Request cancellation`
- `Request order replacement`
- `Create close proposal`
- `Block new entries`
- `Request cancellation of working orders`
- `Liquidate positions`
- `Publish risk policy version`
- `Apply reconciled correction`

## Order review content

Repeat mode, account, symbol/venue, Buy/Sell, order type, quantity, limit, planned stop/exit, maximum estimated risk, buying-power effect, policy version/decision expiry, quote freshness and broker/reconciliation health. Explain that a limit controls price but does not guarantee execution and a stop does not guarantee exit price.

## Error and recovery content

- Validation: identify field, problem and correction without clearing other valid inputs.
- Authorization: generic denial without resource-existence leakage.
- MFA: `Verify your identity to continue. Your action has not been submitted.`
- Idempotency conflict: `This request key was already used for different order details. Review the existing intent or create a new proposal.`
- Dependency unavailable: identify affected capability and whether retry is safe; never advise blind order retry.
- Support: show correlation ID, UTC time and approved support route, excluding provider secrets/raw payloads.

## Live-region priority

Assert only critical entry blocks, kill-switch state and meaningful order transitions. Use polite batched announcements for ordinary alerts. Do not announce every quote tick, P&L change or scanner reorder. Focus stays with the user during streaming updates.
