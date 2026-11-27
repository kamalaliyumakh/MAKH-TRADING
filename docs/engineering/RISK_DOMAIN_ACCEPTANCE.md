# WBS 7.1 — Risk Domain Acceptance

Status: In progress — 90%

## Delivered locally

- Effective-dated, uniquely versioned risk policies with non-overlapping validity ranges.
- Deterministic fail-closed policy resolution at inclusive-start/exclusive-end boundaries.
- Ordered paper-only evaluation of policy, mode, system health, account state, strategy permission, market freshness, price, protection, daily loss, per-trade risk, symbol exposure, gross exposure, buying power and quantity.
- Decimal-safe position sizing that floors to whole shares and selects the tightest requested, policy, loss, notional, exposure and buying-power limit.
- Immutable scoped decisions with policy version, rule-by-rule results, approved quantity/notional, maximum loss at stop, correlation ID and deterministic SHA-256 evidence hash.
- Length-prefixed evidence canonicalization binds the complete request context, policy/outcome, approved monetary result and every rule reason/capacity without delimiter ambiguity.
- Impossible account state where symbol exposure exceeds gross exposure fails closed, and quantity evidence exposes the tighter requested/policy order ceiling.
- Explicit authority boundaries: an approved result may support a paper order proposal only; it cannot submit a broker order or authorize live trading.
- Deterministic randomized invariant coverage across 5,000 sizing combinations, 2,000 degraded-authority combinations and 2,000 effective-policy timeline points.

## Verification evidence

- The retained baseline contains twenty-five passing focused risk policy, property and boundary cases, including 9,000 deterministically generated cases. Two additional evidence-integrity/exposure regressions are authored; the current pinned .NET runner stalled before compilation, was cancelled, and is not claimed as fresh execution evidence.
- Cases cover policy validation, overlap/duplicate denial, effective boundaries, missing-policy denial, proposal-only authority, tightest-cap sizing, whole-share flooring, order caps, health/account/strategy/freshness denial, invalid price/protection, exhausted loss/exposure/buying-power capacity, deterministic evidence and scope preservation.
- Randomized cases prove approved quantities never exceed request, order, loss, notional, symbol/gross exposure or buying-power caps; every degraded authority combination rejects; and each policy timeline point resolves exactly one or no effective policy.
- An executable readiness verifier checks twelve controls, hashes ten artifacts, records six blockers and emits `Local Risk Domain Ready / Persistence, Authoritative Inputs and Accountable Acceptance Pending`.

## Remaining acceptance work

- Risk Owner-approved policy values, strategy mappings, calculation definitions, session/high-water-mark behavior and exception governance.
- Authenticated administration and evaluation APIs with authorization, MFA for policy publication, idempotency and immutable audit.
- PostgreSQL policy/decision persistence with transaction, concurrency, outbox and protected evidence retention.
- Authoritative account, position, P&L, market, broker, reconciliation and system-health inputs.
- Database concurrency, authorization, representative load, recovery, chaos, extended clock-boundary and audit-reconstruction evidence.
- Product, Risk, Security, Data, Engineering, QA and Operations accountable approvals and WBS 3.8 acceptance.

## Safety boundary

The current engine is an in-process synthetic policy evaluator. It has no API, database, account, provider, broker, credentials or order-submission path. Approval means only that a synthetic request is eligible to become a separately governed paper order proposal. Every broker submission and all live trading remain impossible and unauthorized.
