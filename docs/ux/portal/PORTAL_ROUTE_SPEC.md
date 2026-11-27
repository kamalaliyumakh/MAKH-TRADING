# MAKH Trading Platform — Portal Route Specification

Last updated: 12 August 2026

## Persistent shell

Every authenticated route contains:

1. Skip link and semantic navigation/main/status landmarks.
2. Persistent account selector showing account name and textual `PAPER` or `LIVE` mode.
3. Market session, API, market-data, broker and reconciliation status.
4. Global entry state: Allowed, Blocked, Dependency Unknown or Reconciliation Mismatch.
5. Alerts, profile/session and authorized navigation.

The server determines routes and resources the user may access. Hiding navigation is only a usability aid. Mode, health and authorization are revalidated for every consequential action.

## Route catalogue

| ID | Route | Purpose | Primary role | Core components |
|---|---|---|---|---|
| PT-01 | `/app` | Market pulse, health, P&L snapshot and remaining risk | Trader | Mode banner, health, risk capacity, alerts, watch summary |
| PT-02 | `/app/scanner` | Inspect versioned candidates and risk flags | Trader | Filters, freshness, data table/list, ranking explanation |
| PT-03 | `/app/watchlists` | Curate symbols without creating orders | Trader | Lists, evidence/freshness summary, remove/add actions |
| PT-04 | `/app/symbol/:symbol` | Review quote, metrics, evidence, thesis and proposal | Trader | Quote, metric, chart, evidence, warnings, proposal steps |
| PT-05 | `/app/orders` | Follow canonical order lifecycle and mutate eligible orders | Trader | Order table/list, state, fill quantity, cancel/replace |
| PT-06 | `/app/positions` | Monitor exposure, protection and reconciliation | Trader | Position list, P&L age, protection, close proposal |
| PT-07 | `/app/risk` | View limits/capacity/breaches; administer when authorized | Trader/Risk Admin | Capacity, rule results, policy versions, pauses, kill switch |
| PT-08 | `/app/journal` | Record thesis and reconstruct trade decisions | Trader | Entry editor, evidence/order links, outcome review |
| PT-09 | `/app/reports` | Generate authorized reports and exports | Trader/Auditor | Filters, report job, expiring manifest/download |
| PT-10 | `/app/alerts` | Review candidate, fill, risk and system events | Authorized user | Severity, subject, state, acknowledgement |
| PT-11 | `/app/admin` | Provider, calendar, reconciliation and system operations | Operations/Risk Admin | Health, queue, provider lockout, correction workflow |
| PT-12 | `/app/audit` | Read-only event reconstruction | Auditor/Admin | Timeline, versions, correlation, export |
| PT-13 | `/app/profile` | Sessions, preferences, consents and accessibility settings | User | Sessions, revoke, consent versions, update preferences |

## Route state contract

All data routes implement Loading, Ready, Empty, Stale, Degraded, Unauthorized, Error and Recovering. Trading routes also implement Paper/Live, Entry Blocked, Reconciliation Mismatch and Unknown Broker State. State is local when possible: a stale evidence feed does not falsely label broker connectivity unavailable, and a broker problem does not fabricate market-data failure.

## Responsive navigation

- Below 768px: bottom/compact navigation prioritizes Dashboard, Alerts, Orders, Positions and Risk; other destinations are in a labelled menu.
- From 1024px: persistent 240px side navigation, collapsible to 72px with accessible names retained.
- Account and mode never move into a hidden-only drawer. Emergency containment remains reachable on narrow layouts.
- Complex tables have a responsive record view preserving state, time, quantity, freshness and action relationships.
