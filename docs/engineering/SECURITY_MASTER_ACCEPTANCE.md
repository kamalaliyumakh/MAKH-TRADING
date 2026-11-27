# Security Master Acceptance

Date: 24 October 2026  
WBS: 5.1  
Status: In progress — 82%

## Implemented local scope

- Domain entities define stable security identity independently of a current ticker.
- Venues use normalized four-character MIC identity, display name, timezone and explicit MVP approval state.
- Securities distinguish common stock, preferred stock, ETF, depositary receipt and other instrument types.
- MVP eligibility requires an active common stock on an explicitly approved venue; synthetic OTC and non-common instruments are excluded.
- Symbol history uses inclusive effective dates, enforces primary-venue consistency and rejects overlapping periods for one security.
- Corporate actions support symbol change, split, reverse split, merger and delisting with positive split ratios and source-ID idempotency.
- Application reconciliation maps provider records by effective symbol, MIC and as-of date, then fails closed on missing, ambiguous, ineligible or instrument-type mismatch states.
- Provider observations now require provider and source-record identity, normalized symbol/MIC, UTC observation time and replay-safe correction linkage; self-correction is rejected.
- Split and reverse-split actions require positive ratios, while non-split actions reject ratios.
- Delisting transitions make a security ineligible from the effective date while preserving correct point-in-time eligibility before that date.
- A provider-neutral asynchronous source port keeps external adapters outside Domain and Application policy.
- All fixtures and identifiers in tests are synthetic; no licensed or external security-master data is present.

## Verification evidence

- Seven previously executed focused tests cover stable identity through symbol change, overlap rejection, OTC/non-common exclusion, corporate-action idempotency, effective mapping, ambiguity and type mismatch.
- Three additional focused cases now cover ratio semantics, point-in-time delisting and provider provenance/correction validation.
- The prior complete .NET Release baseline passed with zero warnings and zero errors. The 24 October rerun failed before compilation because filesystem reads of generated `obj` files timed out; the new cases are therefore authored but not represented as executed evidence.
- Domain remains framework independent and Application depends only on Domain.

## Remaining acceptance conditions

- Implement PostgreSQL market-schema persistence, migrations, keys and non-overlap/exclusion constraints.
- Add approved provider adapters and replay-safe ingestion behind the implemented source port and provenance/correction contract.
- Reconcile licensed identifiers and primary/listing venue changes without guessing cross-provider conflicts.
- Implement corporate-action adjustment policy for reference prices, shares/float history and reproducible scanner snapshots.
- Add market-session/calendar ownership and delisting/tradability transition handling.
- Certify against an approved data provider and representative licensed samples; WBS 1.4 and 3.8 remain open.
- Data Engineer, Backend Lead and Product Owner acceptance remain pending.

## Decision

Advance WBS 5.1 to 82% and retain `In Progress`. The provider-neutral domain, point-in-time eligibility, provenance and reconciliation rules are structurally verified with synthetic evidence, while the new test rerun, persistence, provider certification and production-quality reconciliation remain incomplete.
