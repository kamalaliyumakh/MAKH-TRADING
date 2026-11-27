# WBS 8.2 — Reporting Foundation Acceptance

## Status

In progress — 92%.

## Delivered locally

- Account-scoped, trading-date and timezone-bounded daily reporting.
- Execution detail with reconciled quantity, gross amount, fee and realized-P&L totals.
- Deterministic strategy aggregation and rule-adherence summaries.
- Per-source data-quality detail with fail-closed aggregate quality.
- Duplicate execution, decision and daily-source rejection.
- Stable SHA-256 evidence hash over canonical report inputs.
- Length-prefixed canonical hashing now covers account/date/timezone identity plus every included execution security, strategy, value and timestamp.
- Adherence outcome, evaluation time and reason plus source-quality timestamp and counts are hash-bound, so corrected facts cannot retain the prior evidence hash.
- Undefined adherence and data-quality enum values fail input validation.
- Explicit declarations that reports are neither order authority nor broker statements.
- Added `/app/reports`, a responsive read-only Angular analytics workspace with synthetic daily KPIs, accessible realized-P&L area chart, strategy contribution bars and adherence context.
- Added a fail-closed source-quality table that keeps rejected records, freshness and Partial status visible.
- Daily-report generation requires non-default UTC time, cannot precede the trading date and rejects included facts observed after generation.
- Each execution, adherence and quality input stream is capped at 100,000 facts before filtering or aggregation.
- The portal snapshot now exposes immutable synthetic/non-authoritative/non-broker-statement/no-order metadata and a complete 64-character evidence digest.
- Chart and adherence calculations remain finite for empty, single-point, flat or invalid numeric series.

## Verification

- 19 focused reconciliation, boundary, duplicate, aggregation, correction-hash, quality and authority tests pass.
- All 436 architecture tests and 66 API-security tests pass with a zero-warning Release build.
- Four focused reporting UI cases and all 58 trading-portal tests pass.
- The warning-free portal production build is 416.02 kB raw and 104.88 kB estimated transfer; Angular import boundaries pass.
- Browser checks at 1280 px and 390 × 844 confirm accessible chart semantics, responsive analytics, contained table scrolling, zero forms/buttons, no page overflow and no console warnings/errors.
- `node eng/verify-reporting-readiness.mjs` performs twelve deterministic checks, hashes the current evidence package and emits `outputs/reporting-readiness/readiness-manifest.json`.
- Current backend source/test hydration and sandbox MSBuild constraints prevent a reliable fresh .NET execution; the established passing baseline above remains historical evidence and the new chronology/bound cases are not represented as freshly executed tests.
- A fresh portal type-check produced no output within the bounded 40-second verification window while cloud-managed dependencies were being resolved and was cancelled; it is not claimed as passing evidence.

## Remaining acceptance work

- PostgreSQL read models, migrations, retention, point-in-time replay and report versioning.
- Authoritative adapters from orders, executions, positions, risk, scanner, evidence and journal modules.
- Authenticated APIs plus governed filtering and drill-down integrated into the Angular report view.
- Scheduled generation, late/corrected fact handling, monitoring and operational ownership.
- Reconciliation against broker statements and approved accounting/fee definitions.
- Load, privacy, authorization, accessibility, recovery and human acceptance evidence.

## Safety boundary

The reporting service and UI process synthetic facts in memory. They do not read a broker, database or provider; publish or export a report; authorize an order; represent an official statement; or create live-trading authority.
