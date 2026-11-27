# Market Data Adapter Acceptance

Date: 24 October 2026  
WBS: 5.2  
Status: In progress — 82%

## Implemented local scope

- A provider-neutral application port streams normalized quote, trade, bar and market-status events by canonical security ID.
- Every event carries provider, stable event ID, monotonic source sequence, event time, receipt time and optional correction reference.
- Source sequences must be positive; timestamps are normalized to UTC; receipt-before-event and self-correction evidence is rejected.
- Quote normalization classifies valid, locked, crossed and stale top-of-book observations against an explicit maximum age.
- Crossed and stale quotes fail closed for executable-readiness purposes; locked quotes remain explicitly visible as a separate quality state.
- Future-dated evaluation and quote-quality/price-shape contradictions fail closed.
- Trade observations distinguish eligibility and cancellation, preventing cancelled or ineligible facts from contributing to downstream metrics.
- Versioned OHLCV bars reject non-positive or internally inconsistent values.
- Market status permits new exposure only in an explicit open state; unknown, pre-market, halted and closed states fail closed.
- The synthetic adapter filters requested securities, orders by provider sequence, deduplicates stable event IDs and rejects foreign-provider attribution.
- It also rejects sequence collisions and corrections that do not reference an earlier emitted event in the requested stream.
- Corrections remain separate immutable events linked to the corrected event rather than overwriting history.
- All fixtures are synthetic. No vendor endpoint, credential, licensed payload or external service is connected.

## Verification evidence

- Twelve focused cases cover valid/locked/crossed/stale quotes, cancellation semantics, invalid OHLC, security filtering, sequence ordering, deduplication, correction provenance, provider mismatch and market-state gating.
- Four additional focused cases cover future timestamps, positive sequence/self-correction, quote-quality consistency and orphan-correction/sequence-collision rejection.
- The complete .NET Release build passes with zero warnings and zero errors.
- Thirty-nine .NET tests pass: twenty-seven architecture/domain/application tests and twelve API security tests.
- The application contract has no dependency on Infrastructure or any provider SDK.
- The 24 October .NET rerun was not repeated after the Security Master attempt failed before compilation on generated `obj`-file read timeouts; the new cases are authored but are not represented as executed evidence.

## Remaining acceptance conditions

- Select and license a provider under WBS 1.4, then implement its REST, streaming and recovery mappings behind this port.
- Add provider entitlement, authentication, subscription, rate-limit, reconnect/backoff and health behavior.
- Map documented exchange/sale conditions, corrections, cancels, LULD and session calendars using licensed representative samples.
- Add PostgreSQL/outbox persistence, replay checkpoints and reconciliation from stream to REST/bulk recovery.
- Establish sequence-gap policy, telemetry, operational alarms, load/soak evidence and retention enforcement.
- Confirm whether locked quotes may support any downstream order-readiness case; the current contract exposes the state but risk policy remains authoritative.
- Data Engineer, Backend Lead, Risk Administrator and Product Owner acceptance remain pending.

## Decision

Advance WBS 5.2 to 82% and retain `In Progress`. The provider-neutral contract, safety normalization and replayable synthetic adapter are structurally verified, while fresh execution, vendor-specific connectivity, licensed-sample certification, persistence, recovery and accountable approvals remain incomplete.
