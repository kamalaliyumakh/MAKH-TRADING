# MAKH Trading Platform — Portal Wireframes

Last updated: 12 August 2026  
Fidelity: responsive structure, state and interaction hierarchy

## Desktop shell

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ MAKH | PAPER — Simulated account | Market OPEN | Feed ✓ Broker ✓ Recon ✓│
├───────────────┬──────────────────────────────────────────────────────────┤
│ Dashboard     │ Page title / account / as-of                            │
│ Scanner       │ Local warnings and actions                              │
│ Watchlists    │                                                          │
│ Orders        │ Main workspace                            Context rail    │
│ Positions     │                                                          │
│ Risk          │                                                          │
│ Journal       │                                                          │
│ Reports       │                                                          │
│ Admin*        │                                                          │
└───────────────┴──────────────────────────────────────────────────────────┘
```

## Narrow shell

```text
┌────────────────────────────────┐
│ MAKH  PAPER · Account A  [Menu]│
│ OPEN · Feed ✓ · Broker ?       │
├────────────────────────────────┤
│ Page heading / entry state     │
│ Main one-column task flow      │
├────────────────────────────────┤
│ Home Alerts Orders Pos. Risk   │
└────────────────────────────────┘
```

## PW-01 — Dashboard

Safety strip → Daily P&L with as-of → remaining risk → open positions/orders → alerts → watchlist/candidate summary. Candidate gain never becomes the dominant first card.

## PW-02 — Scanner

Preset and run version → freshness/paused updates → filter summary → table columns: Symbol, Price, Gain, RVOL, Float, Spread/Liquidity, Catalyst, Risk → row action `Review symbol`. On narrow screens, records preserve every risk field across an expandable summary.

## PW-03 — Symbol workspace

Header: symbol/venue/tradability/quote age → extreme-move/liquidity flags → quote/chart → verified evidence before social → thesis → proposal stepper: Intent → Exit plan → Risk result → Review. A stale quote prevents the final submission step.

## PW-04 — Orders

Status filters → canonical order records → detail timeline. Unknown reconciliation state uses amber warning, stable client-order ID and Refresh/Reconciliation actions; no duplicate Submit action. Partial fill shows filled and remaining quantities.

## PW-05 — Positions

Exposure and P&L age → protection and reconciliation state → close-proposal action. Mobile places quantity, protection and containment ahead of chart/history.

## PW-06 — Risk console

Entry allowed/blocked → policy version/as-of → remaining capacity → breaches/rule results → containment section. Block, Cancel and Liquidate are separate progressively stronger panels. Configuration is hidden/read-only unless authorized, but server control remains authoritative.

## PW-07 — Admin and audit

Provider/queue/reconciliation health → mismatch/correction details → privileged reason/expiry → audit timeline. No discretionary order ticket appears in administration.

## Fault-state overlays

- Sequence gap: retain view labelled Stale; stop applying dependent deltas; `Refresh snapshot`.
- Feed stale: retain last value with timestamp; disable unsafe entry; evidence/order history stays readable.
- Broker unavailable: show account-specific limitation; existing local state marked age/authority; no optimistic cancellation/fill.
- Reconciliation mismatch: persistent account entry block with link to reconciliation detail.
- Session/MFA expiry: preserve draft locally only where safe, reauthenticate, then revalidate before action.
