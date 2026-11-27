# MAKH Trading Platform — Scope Baseline

Last updated: 12 August 2026  
Status: Ready for Product Owner approval  
WBS: 1.1

## 1. Product objective

Build a risk-controlled platform that identifies selected U.S.-listed low-priced momentum securities, combines market and catalyst evidence, supports self-directed paper trading and a separately authorized controlled-live pilot, and enforces centralized risk controls before and after broker submission.

The platform is decision-support and self-directed execution software. It is not a promise of performance, a custodial service or authorization to manage third-party funds.

## 2. Initial operating model

- One account owner acts for their own supported brokerage accounts.
- The account owner makes or explicitly authorizes trading decisions.
- MAKH may generate candidates and order proposals, but no scanner, news or social signal independently authorizes an order.
- A regulated broker holds funds/securities and remains authoritative for accepted orders, executions, live positions and buying power.
- Risk, operations and audit roles administer the platform within explicit permissions; they do not obtain discretionary trading authority merely from their administrative role.
- Multi-tenant advisory, copy-trading, pooled capital and management of third-party accounts are excluded until separately scoped and legally approved.

## 3. MVP users and permissions

| Role | In-scope outcomes | Explicit boundary |
|---|---|---|
| Trader/account owner | Discover, verify, create proposals, submit authorized paper/live orders, monitor and journal | Cannot bypass hard risk ceilings or account authorization |
| Risk administrator | Publish effective-dated policies, pause trading, investigate breaches and invoke authorized containment | Cannot rewrite historical decisions/executions/audit |
| Operations administrator | Manage provider configuration, calendars, health and reconciliation workflows | No discretionary order entry unless separately assigned and approved |
| Auditor/compliance reviewer | Read and export authorized evidence | No trading or configuration writes |
| Developer support | Time-limited diagnostics | No production secrets or trading by default |
| Public visitor | Review product, security, status, legal/risk and privacy; request access | No authenticated account/trading information |

## 4. Functional scope

### Public application

- Home, Platform, Security, Status, About, Legal/Risk and Privacy routes.
- Accessible request-access and OIDC sign-in entry.
- Versioned disclosures and privacy-safe public analytics.

### Authenticated portal

- Dashboard with account mode, market/dependency status, P&L snapshot and risk capacity.
- Scanner using transparent versioned rules, watchlists and symbol workspace.
- Market/reference data, verified evidence, permitted social metadata and provenance.
- Thesis, proposal, risk-decision and order-review workflow.
- Canonical orders, partial fills, cancel/replace, positions, protection and reconciliation.
- Risk console, policies, pauses, breaches and separated kill-switch actions.
- Journal, reporting, alerts, audit evidence, authorized exports and administration.

### Platform services

- Angular public and portal applications.
- ASP.NET Core modular monolith using Clean Architecture.
- PostgreSQL module-owned schemas, immutable evidence and transactional outbox.
- Provider-neutral adapters for identity, market/reference/evidence data, broker and notifications.
- REST/OpenAPI commands/snapshots and authenticated recoverable SignalR deltas.

## 5. Trading strategy baseline

| Criterion | Initial baseline | Product interpretation |
|---|---|---|
| Universe | Approved Nasdaq/NYSE common shares; OTC excluded | Instrument identity/tradability must be current |
| Price | USD 3.00–7.00 default | Configurable screen, not a guarantee of suitability |
| Relative volume | ≥ 3.0 time-of-day normalized | Calculation/version/source visible |
| Public float | ≤ 500,000 shares | Vendor definition, source and observed time required |
| Intraday gain | 100%–600% watch condition | Elevated-risk ranking flag only; never standalone order authority |
| Catalyst | Verified issuer, filing or approved news evidence | Social attention alone cannot verify it |
| Liquidity | Policy-defined spread, dollar volume and depth | Mandatory order/risk gate |
| Exit plan | Stop/target/trailing/time/catalyst/end-session or approved equivalent | Required even when native broker protection is unavailable |

## 6. Risk and execution baseline

- Shares begin from maximum dollar risk divided by absolute entry-to-stop distance, then reduce for buying power, position value, concentration, liquidity, lot/broker rules, estimated fees and slippage.
- Every order receives a current centralized risk decision bound to account, mode, proposal, policy and data snapshot.
- Initial entry orders are Limit and Marketable Limit; ordinary market entry is disabled for the low-float strategy unless separately approved.
- Every consequential command is authenticated, authorized, CSRF-protected, idempotent and audited.
- Broker timeouts are unknown/reconciling, not rejected. Blind resubmission is prohibited.
- Critical stale data, risk failure, broker uncertainty or reconciliation mismatch blocks new opening/increasing exposure.
- Kill switch separates Block Entries, Cancel Working and Liquidate; destructive actions require explicit authority, MFA and confirmation.

## 7. Non-functional scope

- WCAG 2.2 AA-targeted critical journeys.
- Encryption, managed secrets, least privilege, MFA/step-up and tamper-evident audit.
- Observable API, feed, broker, risk, outbox and reconciliation health.
- Controlled migrations, backup/PITR, restore and broker-safe recovery drills.
- Paper-first release, security/compliance review and explicit live go/no-go.

## 8. Out of scope for MVP

- Custody, clearing or brokerage services.
- Managing third-party funds, advisory discretion, copy/social trading or pooled accounts.
- OTC securities, options, futures, forex, cryptocurrency and international-market trading.
- Unsupervised machine learning that directly submits orders.
- Fully autonomous live trading without explicit approved rules and release gates.
- Native mobile applications; responsive web is the baseline.
- Guaranteed execution, stop price, availability, profitability or loss prevention.
- Final vendor selection, jurisdiction/legal conclusions and production live credentials until their discovery/gates complete.

## 9. Release boundaries

1. Design and architecture baseline.
2. Engineering foundation and public web.
3. Market data/scanner and evidence portal.
4. Central risk engine and certified paper trading.
5. Operations/reporting readiness.
6. Separately approved limited-capital controlled-live pilot.

Passing a prior stage does not automatically authorize the next stage. Live requires legal/compliance, broker eligibility, vendor licensing, security, operations, paper results, capital/loss limits and explicit user authorization.

## 10. Scope-change triggers

A formal change record and impact review is mandatory for multi-user/third-party accounts, new asset classes/markets, autonomous live execution, new broker/order type, alternative risk authority, custody/payment handling, public performance claims, new jurisdiction or material privacy/retention change.
