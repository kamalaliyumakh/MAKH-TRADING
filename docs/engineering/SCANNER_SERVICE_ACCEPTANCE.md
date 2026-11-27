# Scanner Service Acceptance

Date: 24 October 2026  
WBS: 5.5  
Status: In progress — 93%

## Implemented local scope

- Published scanner presets retain stable identity, name, immutable version, calculation policy and publication time.
- Scanner runs retain stable run identity, exact preset version, as-of timestamp, deterministic SHA-256 input snapshot and aggregate data-quality state.
- Preset publication and run times are mandatory, normalized to UTC and prevent use of a preset before publication.
- One input per canonical security is enforced; duplicates are rejected rather than silently overwritten.
- Calculation version and run as-of must match the published preset and run before evaluation.
- Candidate snapshots retain price, gain, RVOL, public float, spread percentage, dollar volume, qualification, risk flag and exclusion reason.
- Candidate float evidence must match the canonical security, be `PublicFloat` and be observed no later than the run; mismatch remains unranked with an explicit exclusion.
- Only fully qualified inputs satisfying price, RVOL, public-float and 100%–600% gain rules receive a rank.
- Qualified candidates rank deterministically by RVOL descending, then dollar volume descending, then canonical security ID.
- Extreme gain is retained as an elevated-risk flag and does not increase rank.
- Runs report Complete, Partial or Failed data quality according to qualification outcomes.
- Scanner candidates and runs cannot create order authority.
- Replaying the same versioned inputs in a different enumeration order produces the same snapshot hash and candidates.
- Length-prefixed snapshot hashing binds normalized symbol; every metric's name/state/value/unit/version/time/reason; all qualification/risk flags; and complete float resolution/provenance, preventing evidence changes from retaining an earlier hash.
- Runs and candidates persist as immutable, account-scoped PostgreSQL evidence with atomically assigned stream sequences and transactional outbox facts.
- Corrections append a new sequenced run, identify the latest superseded run, require a retained reason and publish deterministic candidate removals; historical runs are not mutated.
- Web-compatible camel-case serialization is enforced for nested candidates. A 100-account, 2,000-run correction replay with 200 duplicate deliveries reconstructs every final snapshot with zero lineage violations.
- All fixtures are synthetic; no licensed provider, broker or external service is connected.

## Verification evidence

- The 26 August 2026 workflow UAT added an explicit gain-outside-preset exclusion and corrected the Angular snapshot so a 68% candidate is unranked.
- The pinned .NET 10.0.400 Release build passes with zero warnings and zero errors.

- Ten focused tests cover deterministic ranking, dollar-volume tie-breaking, reordered replay, extreme-move safety, unranked exclusions, failed quality, duplicate security rejection, version/as-of mismatch and preset/hash retention.
- Three additional focused cases cover float security/kind/time binding, complete evidence-hash sensitivity and preset-publication chronology.
- All 381 backend tests pass: 325 architecture/domain/application tests and 56 API security tests.
- PostgreSQL 17.10 smoke passes all ten migrations and proves correction reason, self-reference and one-direct-successor constraints.
- Scanner service remains deterministic, provider-neutral and separate from order/risk authority.
- The new cases are authored but not represented as executed evidence because the repository-pinned SDK previously timed out reading generated `obj` files before compilation.

## Remaining acceptance conditions

- Add idempotent run submission, distributed coordination and outbox publication of sequenced candidate changes.
- Approve ranking weights/tie-breakers, liquidity and confidence thresholds, maximum universe/run size and run cadence.
- Add licensed-data replay, load/soak, gap/recovery, concurrency and retention tests.
- Integrate verified catalyst state only after WBS 6 evidence services; social attention must not qualify a candidate.
- Backend Lead, Data Engineer, Risk Administrator and Product Owner acceptance remain pending.

## Decision

Advance WBS 5.5 to 93% and retain `In Progress`. Deterministic evaluation, complete input-evidence hashing, immutable PostgreSQL evidence, ordered publication, append-only correction lineage and reordered replay are structurally verified locally. Fresh execution, licensed replay, distributed/idempotent submission, hosted certification and accountable approvals remain incomplete.
