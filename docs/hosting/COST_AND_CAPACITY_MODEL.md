# Cost and Capacity Model

Date: 12 August 2026  
Status: Quote template; no prices or budget approval claimed

## Environment profile

| Environment | Availability posture | Data | Operating window |
|---|---|---|---|
| Development | Minimum viable, scale-to-zero where safe | Synthetic | Business-hours/on demand |
| Test | Minimum viable | Synthetic/test fixtures | CI/on demand |
| Staging | Production-like topology at reduced capacity | Sanitized/synthetic | Release windows and drills |
| Paper production | Continuously available during supported trading/operations windows | Real permitted market data; paper orders | Defined service window |
| Live production | Zone-resilient, controlled scaling, separate secrets | Production | Only after live gate |

## Monthly total-cost equation

`TCO = compute + database + database-backup + object/archive + edge/WAF + telemetry-ingestion/retention + network-egress + registry/CI + security + support + tax + contingency`

Capture quantity, unit, contracted unit price, currency, exchange-rate date, commitment term, taxes and source quote for every term. Use provider calculators only as estimates; retain the exported estimate and assumptions.

## Capacity inputs

| Input | Initial planning value | Validation method |
|---|---:|---|
| Concurrent owner sessions | 1–5 | Load test at 10 for headroom |
| Symbols monitored concurrently | 500 | Replay representative market bursts |
| Watchlist candidates retained/day | 100 | Data-volume measurement |
| API requests/second | Measure; do not invent | Instrument paper workload p50/p95/p99 |
| SignalR connections | 10 test target | Connection/reconnect/gap test |
| PostgreSQL starting storage | 64 GiB planning floor | 30-day paper volume projection |
| Log retention | 30 days hot planning value | Security/privacy/operations approval |
| Audit retention | Pending legal record schedule | Legal/privacy decision |

## Cost controls

- Mandatory environment, owner, cost-center and data-classification tags.
- Budgets and alerts at 50%, 75%, 90% and 100% of the approved monthly limit.
- Dev/test shutdown or scale-to-zero policy where it cannot hide reliability defects.
- Telemetry sampling must never drop risk decisions, order mutations, authentication events or reconciliation exceptions.
- Monthly variance review: actual, forecast, unit-cost driver and remediation owner.
- No reserved commitment before the paper workload establishes a stable baseline.

## Quote acceptance

The Sponsor and Operations Owner approve currency, tax, support tier, contingency and a 12-month scenario for development/staging/paper. Live-production cost remains a separately gated scenario.
