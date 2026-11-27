# WBS 6.1 — News and Filings Adapter Acceptance

Status: In progress — 99%

Date reconciled: 24 October 2026

Readiness decision: **Local Evidence Pipeline Ready / Licensed and Hosted Certification Pending**

## Delivered locally

- Added provider-neutral evidence contracts for news, issuer announcements, exchange announcements, and SEC filings.
- Required canonical HTTP(S) source URI, provider record identity, publication and observation times, version, content rights, and optional supersession linkage.
- Added explicit metadata-only, excerpt, and full-text rights; metadata-only evidence cannot retain an excerpt.
- Required SEC accession identity for SEC filings and prohibited accession values on unrelated source types.
- Added unverified, publisher-attributed, and primary-source trust states without inferring verification from source type.
- Added deterministic revision normalization, superseded-record removal, point-in-time observation enforcement, and stable ordering.
- Added a synthetic adapter that filters strictly by canonical security and publication time and rejects cross-provider attribution.
- Added an SEC fair-access policy primitive that requires an attributable product/contact identity, caps request rate at 10 per second and concurrency at two, restricts retrieval to HTTPS `sec.gov` hosts, and bounds exponential or server-directed retry delays to five minutes.
- Hardened evidence inputs with canonical SEC accession formatting, credential/fragment-free canonical URLs, bounded provider/record/headline/publisher/excerpt fields, and rejection of unsafe control characters.
- Added fail-closed enumeration validation for source kind, content rights and trust state, and prohibited self-referential supersession lineage.
- Added explicit provider tombstones. Normalization removes a deleted latest version or superseded record without resurrecting prior content, and tombstones cannot retain excerpts.
- Added an EF Core/PostgreSQL evidence record mapped to the `evidence.documents` schema with immutable provider/version identity, canonical contract round-tripping, SHA-256 content evidence, chronology/deletion constraints, and security/time/hash indexes.
- Added deterministic replay planning: identical provider/version deliveries are idempotent, duplicates within one batch collapse to one insert, and changed content at an existing version fails closed.
- Added a transactional PostgreSQL evidence store that evaluates replay identities before committing documents and one metadata-only `evidence.updated` outbox fact per inserted document.
- Added the eleventh EF migration for evidence documents and their independently leased outbox. Database constraints enforce one outbox fact per evidence row, restrict evidence deletion, and support due-message queries without placing licensed headline or excerpt content in event payloads.
- Added a fail-closed payload safety gate with a one-megabyte limit, strict UTF-8 decoding, textual media-type allowlisting, executable/archive signature rejection, active-markup and bidirectional-control rejection, canonical payload hashing, and normalized line endings.
- Added a mandatory malware-scanner contract. Threat, unavailable, and unattributed scanner results cannot produce a validated payload; the test scanner is synthetic and does not constitute malware assurance.
- Added immutable source-snapshot manifests with payload hash, byte count, media type, scanner attribution, capture time, and bounded retention horizon. Replay at the same provider record/version must retain identical snapshot metadata.
- Added the twelfth EF migration for one restricted-deletion source-snapshot manifest per evidence document, with database checks for canonical hashes, payload size, retention chronology, and retention/hash indexes. Raw payload bytes are intentionally not persisted by this slice.
- Added an evidence-specific PostgreSQL outbox store with atomic `FOR UPDATE SKIP LOCKED` leasing, owned success/failure transitions, deterministic ordering, bounded error metadata, and exponential retry capped at five minutes.
- Added a delivery dispatcher that marks only successful publications complete, releases failures for retry, and propagates cancellation without recording a false delivery failure.
- Added a deterministic eight-worker chaos replay for 2,000 evidence events, including 118 injected transient publication failures and 87 initially expired leases. Every event reaches one terminal publication with zero lease-ownership or duplicate-completion violations in the in-memory test projection.
- Connected the dispatcher to the dedicated worker as a default-off hosted service backed by the PostgreSQL evidence lease store. Enabled startup fails closed without a platform connection string and an absolute HTTPS publisher endpoint.
- Added a provider-neutral HTTP publisher that preserves the validated JSON payload, carries stable event/document/schema metadata, uses the outbox message ID as its idempotency key, requires successful HTTP status, applies a bounded request timeout, and leaves failed deliveries for the existing retry path.
- Added the thirteenth roll-forward migration to transfer all three evidence tables to `makh_owner` and grant explicit runtime DML and read-only access. This closes a privilege defect found by executable database verification.
- Extended the isolated PostgreSQL 17.10 smoke to apply all thirteen migrations twice and prove evidence-table ownership/privileges, immutable document/snapshot/outbox lineage, provider-version uniqueness, owner-bound transitions, delayed retry, expired lease reclaim, attempt progression, terminal publication, and runtime DDL denial.

## Verification evidence

- Fifty-six earlier focused adapter/normalization/fair-access/input-hardening/deletion/persistence/outbox/payload-safety/snapshot/dispatch/chaos/hosted-runner cases pass. Two additional enum/lineage cases are authored; a fresh repository-pinned .NET run is required before they are claimed as executed evidence.
- All 370 architecture and 59 API-security tests pass in the warning-free Release build, and EF reports no pending model changes.
- The isolated PostgreSQL 17.10 compatibility run passes with eleven schemas, thirteen migrations and three evidence tables. It is compatibility evidence, not PostgreSQL 18 or managed-service certification.
- Cases cover URI validation, chronology, content rights, accession rules, version selection, supersession, future observations, filtering, provider isolation, primary-source state, persistence mapping, content hashes, idempotent replay, identity collisions, metadata-only publication, outbox constraints, payload limits, encoding, media types, binary signatures, active content, directional controls, and malware-scan outcomes.

## Acceptance still required

- Select and contract approved news, issuer/exchange announcement, and filing providers with explicit storage/display/derived-data rights.
- Map licensed payloads, source taxonomies, correction/deletion fields, identifiers, rate limits, and availability semantics to the verified contracts.
- Wire the verified SEC fair-access policy into an approved EDGAR client and implement approved issuer/exchange retrieval methods.
- Certify the migrations and evidence paths on PostgreSQL 18 and a selected managed target; deploy the publisher/runner against an approved authenticated endpoint; connect an approved malware scanner and object store; implement authorized raw-payload deletion and representative hosted load/chaos evidence.
- Execute licensed reconciliation, correction/replay, outage/retry, load, privacy, security, and provenance audits.
- Obtain Product, Data, Legal/Licensing, Security, Backend, Risk, and Operations accountable approvals.

## Safety boundary

All fixtures are synthetic. The publisher endpoint remains empty and the hosted dispatcher remains disabled in the checked-in configuration. No external endpoint, credential, licensed article, filing, database, social source, or broker is connected. Evidence is research context only and never creates scanner qualification, risk approval, an order proposal, or executable authority.
