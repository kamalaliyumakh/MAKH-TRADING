# Scanner Calculations Acceptance

Date: 24 October 2026  
WBS: 5.4  
Status: In progress — 85%

## Implemented local scope

- A versioned calculation policy controls the USD 3–7 price range, RVOL 3× minimum, 500,000-share public-float maximum and 100%–600% extreme-move band.
- Every calculated metric retains its name, state, value, unit, calculation version, as-of timestamp and reason.
- Price requires both a fresh executable quote context and a positive last eligible trade; last trade alone is insufficient.
- Gain uses the current qualified price versus an explicitly supplied adjusted reference close.
- RVOL uses cumulative eligible volume divided by the arithmetic mean of positive historical cumulative volumes at the same normalized session time.
- Spread is ask minus bid and spread percentage uses the quote midpoint.
- Dollar volume uses qualified price multiplied by cumulative eligible volume for the controlled session window.
- Public-float qualification consumes the fail-closed WBS 5.3 resolution; shares outstanding cannot substitute.
- Public-float evidence must identify the same canonical security as the quote, must be the `PublicFloat` metric kind and must have been observed no later than calculation time.
- Future-dated quote events invalidate both price and spread; calculation as-of time is mandatory and normalized to UTC.
- Missing, invalid, stale or ambiguous inputs prevent full input qualification and discovery-preset matching.
- The 100%–600% condition is both a discovery-preset qualification boundary and an elevated-risk flag. It never improves rank or creates order authority.
- All inputs and tests are synthetic; no provider, broker, order or external service is connected.

## Verification evidence

- The 26 August 2026 workflow UAT corrected gain-range qualification so 68% is excluded and inclusive 100%–600% remains eligible but elevated-risk.
- Angular/browser retest passes. The changed scanner source was recompiled with the pinned project-local .NET 10.0.400 SDK; the Release build has zero warnings/errors and all 328 .NET tests pass.

- Fifteen focused test cases cover reproducibility, exact and outside price/float/gain boundaries, RVOL arithmetic, invalid history, stale quote, missing adjusted close, ambiguous float, version/as-of retention and no order authority.
- Three additional focused cases cover cross-security/wrong-kind float evidence, future-observed float and future quote rejection.
- The complete .NET Release build passes with zero warnings and zero errors.
- The current complete .NET suite passes 328 tests: 307 architecture/domain/application/infrastructure tests and 21 API security tests.
- Calculation code is deterministic and provider-neutral.
- The new cases are authored but not represented as executed evidence because the repository-pinned SDK previously timed out reading generated `obj` files before compilation.

## Remaining acceptance conditions

- Approve calculation definitions, rounding/precision, quote freshness, eligible sale conditions, session normalization and corporate-action adjustment policy.
- Add explicit policy thresholds for acceptable spread, dollar volume, depth and metric confidence; these are calculated but not yet used as qualification limits.
- Add calculation-input snapshot persistence, hashes, source references and immutable calculation-version records in PostgreSQL.
- Certify replay results against licensed provider samples including corrections, splits, halts, missing intervals and early-close sessions.
- Add larger randomized/property and performance tests after approved precision and session rules are fixed.
- Data Engineer, Backend Lead, Risk Administrator and Product Owner acceptance remain pending.

## Decision

Advance WBS 5.4 to 85% and retain `In Progress`. Deterministic calculations, strategy boundaries and cross-source evidence integrity are structurally verified, while fresh execution, formal definitions, liquidity/confidence thresholds, persistence, licensed replay certification and accountable approvals remain incomplete.
