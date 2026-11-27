# MAKH Trading Platform — Critical Portal Flows

Last updated: 12 August 2026

## PF-01 — Sign-in return and safe context

Session validation → outstanding consent acknowledgement → account selection → persistent mode confirmation → dependency/risk health → dashboard. If MFA is stale, ordinary read access may continue but sensitive actions request step-up and then return to a fresh review step.

## PF-02 — Scanner to evidence

Open scanner → inspect preset/run version and as-of time → compare price, gain, RVOL, float, spread/liquidity and flags → open symbol → inspect verified source and social attention separately → add to watchlist or begin thesis. Scanner never exposes a Submit Order action.

## PF-03 — Proposal to paper order

Symbol workspace → enter thesis → configure side/type/quantity/limit/stop plan → validate fields → obtain server risk decision → inspect policy version and every warning/block → approved review summary repeats PAPER/account/symbol/quantity/price/stop/risk → explicit `Submit paper limit order` → PendingSubmit → broker acknowledgement/fill monitoring.

Hard-block result offers safe changes such as reducing quantity or refreshing stale inputs. It does not offer a trader override.

## PF-04 — Order cancel/replace and partial fills

Open current order → inspect version, filled and remaining quantities → choose cancel or replace → review that fills may occur during the request → submit idempotent command → show pending state → merge only newer broker versions → reconcile final quantity/state. Cancellation never implies that prior fills did not occur.

## PF-05 — Broker timeout/unknown state

Order request times out after possible acceptance → show `Broker acknowledgement unknown — reconciliation in progress` → disable duplicate submission for the same intent → allow current order/status refresh → query using stable client order ID → update only from authoritative broker evidence. Do not label Rejected.

## PF-06 — Position protection and close

Positions → inspect confirmed quantity, P&L timestamp, desired/confirmed protection and reconciliation → create close proposal → risk-check reducing action under applicable policy → review mode/consequence → submit → monitor partial fills and remaining protection until reconciled.

## PF-07 — Risk breach and containment

Critical alert → Risk console with affected account/rule/scope → `Block new entries` → optionally `Request cancellation of working orders` with fresh MFA → separately consider `Liquidate positions` with impact preview, fresh MFA and typed/second confirmation → show per-order progress and unresolved reconciliation.

## PF-08 — Policy publication

Risk Admin opens active immutable version → creates draft → edits allowed rules → reviews validation/impact/effective time → fresh MFA → reason → publish new version → users receive risk update; historical decisions retain old policy version.

## PF-09 — Operations reconciliation

Admin opens mismatch → compares platform and broker snapshots → entry lock is visible → refresh/query broker → choose authorized correction workflow with source snapshot and reason → write new corrective/audit fact → reconcile → authorized release of lock.

## PF-10 — Audit/export

Auditor selects date/trade/incident/account scope → timeline links market/evidence, proposal, decision, policy, order, fills and reconciliation → request export → authorization rechecked → expiring checksummed manifest → access and export event audited.

## Flow safety acceptance

- Every consequential action repeats account and mode.
- Every command uses explicit verb and consequence, not generic Confirm.
- Unknown, stale or mismatched state blocks opening/increasing exposure.
- SignalR gaps mark views stale and trigger REST snapshot recovery.
- Mobile supports monitoring and containment without hiding safety evidence.
