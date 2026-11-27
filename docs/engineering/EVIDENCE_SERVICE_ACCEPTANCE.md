# WBS 6.3 — Evidence Service Acceptance

Status: In progress — 99%

Date reconciled: 24 October 2026

Readiness decision: **Local Evidence Aggregation Ready / Licensed and Hosted Certification Pending**

## Delivered locally

- Added fail-closed entity matching by effective canonical security ID or exact venue MIC plus symbol.
- Required canonical four-character ASCII venue MICs, bounded control-free symbols and rejected oversized or unsafe aliases before matching.
- Required effective-dated aliases and rejected missing, expired, unknown, or ambiguous matches.
- Added explicit LowTrust, Attributed, and Primary trust classes derived from source evidence rather than inferred from popularity.
- Added deterministic cross-provider content deduplication using normalized SHA-256 fingerprints and recorded duplicate-source counts.
- Corrected corroboration accounting so duplicate-source counts represent distinct providers rather than repeated records from one provider; replay order remains manifest-stable.
- Added immutable PostgreSQL combined snapshots containing the exact ordered snapshot items, schema version, as-of time, item count and manifest hash. The database enforces JSON-array/count agreement, fixed schema, canonical hash and unique point-in-time/manifest identities.
- Added a replay-safe snapshot store: identical point-in-time manifests are idempotent, while a different manifest for an existing point in time fails closed. Runtime receives select/insert only; update, delete and truncate are denied.
- Retained the highest-trust, earliest-observed representative when equivalent evidence is received from multiple providers.
- Kept every social-attention item LowTrust with catalyst-verification authority fixed to false.
- Added stable snapshot ordering, a versioned canonical manifest, point-in-time enforcement, and reproducible SHA-256 snapshot hashes.
- Added a collision guard that compares canonical content inside each security/fingerprint group and fails closed if one fingerprint maps to non-equivalent evidence.
- Added a deterministic 10,000-item maximum-size snapshot test with stable reversed-order replay and a five-second local build budget.
- Enforced the 10,000-item input ceiling in the service so oversized snapshots fail closed before collision/deduplication work.
- Replaced read-then-insert persistence with atomic PostgreSQL `INSERT ... ON CONFLICT (as_of) DO NOTHING`, followed by winning-manifest comparison. Identical concurrent replay is idempotent and conflicting replay fails closed.

## Verification evidence

- Sixteen earlier focused evidence-service and entity-matching cases pass. Four additional alias/snapshot-bound cases are authored; a fresh repository-pinned .NET run is required before they are claimed as executed evidence.
- Cases cover alias chronology, canonical and exact venue/symbol matches, symbol-only denial, expired aliases, ambiguity denial, cross-provider deduplication, trust precedence, social authority denial, replay stability, change detection, and future-observation rejection.
- All 395 architecture and 59 API-security tests pass with a zero-warning Release build; EF reports no model drift and PostgreSQL 17.10 applies all sixteen migrations twice.
- PostgreSQL smoke starts eight simultaneous same-time snapshot writers and proves they converge to exactly one immutable row.

## Acceptance still required

- Approve provider-specific entity mappings, corporate-action/symbol-change behavior, trust policy, deduplication normalization, and catalyst-verification rules.
- Implement PostgreSQL evidence sources, items, item-security associations, verification decisions, immutable snapshot manifests, retention, and protected-object references.
- Define transaction/idempotency boundaries, outbox publication, deletion/tombstone propagation, licensed-content handling, and access/audit controls.
- Run licensed replay, correction, hosted load/recovery, retention/deletion, and UI comprehension tests.
- Obtain Data, Product, Risk, Legal/Licensing, Privacy, Security, Backend, QA, UX, and Operations accountable approvals.

## Safety boundary

All inputs remain synthetic. Local PostgreSQL snapshot persistence is implemented, but no provider, protected archive, external content, credential, API endpoint, or broker is connected. A Primary trust class records source quality only; it does not qualify a scanner candidate, approve risk, propose an order, or authorize execution. Catalyst verification remains a separately governed decision.
