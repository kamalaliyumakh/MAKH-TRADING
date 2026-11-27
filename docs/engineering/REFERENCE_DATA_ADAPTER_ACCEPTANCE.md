# Reference Data Adapter Acceptance

Date: 24 October 2026  
WBS: 5.3  
Status: In progress — 82%

## Implemented local scope

- A provider-neutral reference-data port retrieves share metrics and corporate actions by canonical security ID.
- Public float and shares outstanding are separate metric kinds and cannot substitute for one another.
- Every fact retains provider, stable fact ID, as-of date, observation time, revision, controlled definition and optional superseded-fact linkage.
- Observation time is normalized to UTC and cannot precede the as-of date; revision 1 cannot supersede evidence and later revisions must identify what they supersede.
- Share values must be positive; corporate-action split ratios must be complete and positive.
- Resolution selects facts applicable to the evaluation date and the latest revision for each provider.
- Missing, stale, unapproved-definition and conflicting-provider results fail closed and cannot qualify scanner candidates.
- Equal current values from multiple sources remain traceable; disagreement produces an ambiguous result rather than a guessed winner.
- Definition disagreement and same-provider conflicts at the current revision are also ambiguous, even when numeric values agree.
- The synthetic adapter filters canonical securities, deduplicates fact IDs by latest revision, orders deterministically and rejects foreign-provider attribution.
- It rejects a fact ID reused across securities/fact kinds and duplicate revision numbers rather than selecting an arbitrary winner.
- Split/reverse-split facts require positive ratios; non-split facts reject ratios.
- All fixtures are synthetic. No vendor endpoint, credential, licensed payload, external service or real issuer record is connected.

## Verification evidence

- Ten focused tests cover valid float qualification, metric separation, staleness, definition approval, provider conflict, revision selection, security filtering, provider attribution, corporate-action preservation and invalid split ratios.
- Four additional focused cases cover definition disagreement, same-provider revision conflict, temporal/revision provenance and fact-identity/revision collisions.
- The complete .NET Release build passes with zero warnings and zero errors.
- Forty-nine .NET tests pass: thirty-seven architecture/domain/application tests and twelve API security tests.
- Application contracts remain independent of Infrastructure and any provider SDK.
- The new cases are authored but not represented as executed evidence because the repository-pinned SDK previously timed out reading generated `obj` files before compilation.

## Remaining acceptance conditions

- Select and license an approved reference-data provider under WBS 1.4 and implement its mappings behind the port.
- Approve controlled public-float and shares-outstanding definitions, acceptable age and source precedence.
- Reconcile licensed samples against issuer filings/exchange evidence and document tolerated differences without silently selecting a value.
- Add PostgreSQL fact/revision persistence, uniqueness, effective-date constraints and permitted retention/deletion behavior.
- Define correction, restatement, split adjustment and symbol-change effects on reference prices, float history and scanner snapshots.
- Add provider authentication, entitlement, rate-limit, retry, health, telemetry and recovery behavior.
- Data Engineer, Backend Lead, Risk Administrator and Product Owner acceptance remain pending.

## Decision

Advance WBS 5.3 to 82% and retain `In Progress`. The provider-neutral contracts, temporal/revision integrity, fail-closed resolver and deterministic synthetic adapter are structurally verified, while fresh execution, licensed provider connectivity, definition approval, persistence, sampled reconciliation and accountable approvals remain incomplete.
