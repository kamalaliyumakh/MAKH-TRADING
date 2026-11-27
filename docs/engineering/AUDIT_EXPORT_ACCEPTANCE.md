# WBS 8.3 — Audit Export Foundation Acceptance

## Status

In progress — 90%.

## Delivered locally

- Explicit account/actor/role authorization boundary before export generation.
- Account-scoped, deterministic evidence ordering with duplicate event rejection.
- CSV, JSON and minimal PDF representations from a common safe evidence model.
- CSV formula-injection neutralization and JSON data minimization.
- Seven-day maximum validity window matching the provisional retention baseline.
- SHA-256 content checksum, media type, file name, actor, scope, count and expiry manifest.
- Rejection of direct addresses, token/secret-like material and excessive evidence fields.
- Event and correlation identifiers now receive the same address/credential screening with explicit 200-character bounds.
- Control characters are rejected across every exported text field, preventing forged CSV/PDF record boundaries.
- Undefined export formats fail at the request boundary before authorization or content generation.
- Explicit non-credential and non-trading-authority manifest declarations.
- Request, expiry, evidence and generation timestamps require non-default UTC; future-dated evidence is rejected.
- Source enumeration is capped at 100,000 rows, structured exports at 50,000 records, PDFs at 500 records and in-memory content at 25 MiB.
- Actor-role evidence is bounded, screened and included in the immutable export manifest.

## Verification

- 25 focused authorization, scope, expiry, format, injection, integrity, ordering, identifier-safety, UTC, bounded-work and redaction cases are present.
- The retained verified baseline is 21 focused export cases, 442 architecture tests and 66 API-security tests with a zero-warning Release build. The four new focused cases are authored but not claimed as executed because the current sandbox cannot provide a reliable .NET compilation run.
- `node eng/verify-audit-export-readiness.mjs` performs twelve deterministic checks, hashes the current evidence package and emits `outputs/audit-export-readiness/readiness-manifest.json`.

## Remaining acceptance work

- PostgreSQL job/manifest/audit persistence and immutable authorization event linkage.
- Encrypted object storage, one-time signed downloads, revocation, lifecycle deletion and legal holds.
- Authenticated, rate-limited APIs and accessible Angular job/download experience.
- Production-grade branded PDF rendering, pagination, font and accessibility validation.
- Content/malware scanning, large-export streaming, load and recovery exercises.
- Privacy, security, legal/records and Product Owner acceptance.

## Safety boundary

Exports are generated only in memory from caller-supplied synthetic safe fields. No file is published or uploaded, no external download is created, no provider payload is redistributed, and no export grants trading or broker authority.
