# WBS 6.2 — Social-Signal Adapter Acceptance

Status: In progress — 99%

Date reconciled: 24 October 2026

Readiness decision: **Local Aggregate-Privacy Ready / Licensed and Hosted Certification Pending**

## Delivered locally

- Added a provider-neutral social-attention contract using aggregate mention counts and distinct-author estimates rather than raw posts or user profiles.
- Required provider/aggregate identity, aggregation window, observation time, version, method, and optional supersession lineage.
- Restricted confidence to Low or Limited and required an Unknown, Elevated, or Severe manipulation-risk classification.
- Required a visible limitation label for every signal.
- Made catalyst-verification and trade-authorization flags immutable and false.
- Added deterministic latest-version selection, superseded-aggregate removal, point-in-time enforcement, freshness filtering, and stable ordering.
- Added a synthetic adapter that filters by canonical security/as-of time and rejects cross-provider attribution.
- Added explicit provider tombstones. A deleted latest revision must contain zero attention metrics and removes the aggregate without resurrecting an earlier version.
- Bounded provider, aggregate, supersession, method and limitation fields and rejected unsafe control characters before signals reach normalization.
- Added fail-closed rejection for self-referential supersession and undefined confidence/manipulation classifications.
- Added a provider-neutral privacy policy primitive with approved-range controls for minimum distinct-author cohort, aggregation-window duration and retention period. It suppresses deleted, under-threshold, overlong-window and expired aggregates and rejects future observations.
- Added an aggregate-only EF Core/PostgreSQL record containing security identity, counts, classifications, bounded provenance, retention and a canonical SHA-256 content hash. The model contains no raw post, handle, profile or author-identifier fields.
- Added deterministic replay planning: identical provider/aggregate/version deliveries are idempotent, same-batch duplicates collapse, and changed content or retention at an existing version fails closed.
- Added the fourteenth migration with provider/version uniqueness, chronology, author-count, deletion-metric, retention and hash constraints plus explicit owner/runtime/read-only privileges.
- Extended the isolated PostgreSQL 17.10 smoke to apply all fourteen migrations twice and prove the fourth evidence table, privileges, valid aggregate insertion, duplicate identity rejection and database-level rejection of tombstones retaining metrics.
- Added a transactional PostgreSQL repository that resolves provider/aggregate identities, applies deterministic replay planning, writes only new aggregate versions and reports insert/replay counts.
- Added bounded expired-record deletion using ordered `FOR UPDATE SKIP LOCKED` batches capped at 1,000 rows so concurrent maintenance workers do not select the same records.
- Extended the PostgreSQL smoke with two expired tombstones and one unexpired aggregate; a one-row deletion cycle removes exactly one eligible record and preserves the unexpired record.
- Added a dedicated-worker retention hosted service that is disabled by default, uses a fresh dependency scope per cleanup cycle, passes the platform clock to the repository, logs the deletion count, retries after cycle infrastructure failure, and stops cleanly on cancellation.
- Added fail-closed startup validation: enabled cleanup requires the platform database connection, an interval from 1–86,400 seconds and a batch from 1–1,000 rows. Checked-in configuration remains disabled.
- Added an immutable `audit.social_retention_deletions` fact containing only aggregate record/provenance identity, version, retention/deletion times, fixed reason and content hash. It contains no social content or user identifiers.
- Changed cleanup to atomically delete each expired aggregate and insert its audit fact in one PostgreSQL statement. Migration 15 gives runtime only `SELECT`/`INSERT` audit access and explicitly denies `UPDATE`, `DELETE` and `TRUNCATE`.
- Extended PostgreSQL smoke evidence to prove one expired aggregate produces one matching audit fact while the aggregate is removed, another expired aggregate remains for the next bounded cycle, and unexpired data remains.
- Added post-cycle retention reconciliation using the same database cutoff as deletion. It reports the remaining expired count and oldest retention deadline without social content or user identifiers.
- Added bounded overdue configuration plus stable structured events: residual backlog emits warning event 3104, cycle infrastructure failure emits error event 3103, and a breached overdue threshold emits error event 3105 for external runbook routing.

## Verification evidence

- Thirty-one earlier focused social-signal contract/normalization/privacy/persistence/repository/hosted-cleanup/audit/reconciliation cases pass. Two additional enum/lineage cases are authored; a fresh repository-pinned .NET run is required before they are claimed as executed evidence.
- All 389 architecture and 59 API-security tests pass in the warning-free Release build; EF reports no pending model changes and the fifteen-migration PostgreSQL smoke passes.
- Cases cover invalid windows, chronology, limitation labels, bounded/unsafe identifiers, aggregate consistency, authority denial, revisions, supersession, tombstones, staleness, future observations, small-cohort/retention suppression, policy bounds, filtering, and provider isolation.

## Acceptance still required

- Select a permitted commercial API and obtain explicit collection, derived-statistic, display, retention, deletion, audit, and cross-border/privacy rights.
- Complete a DPIA/qualified privacy review covering identifiers, deleted content, sensitive inferences, data-subject rights, and jurisdiction.
- Define and approve aggregation methodology, sampling limitations, bot/coordinated-activity controls, confidence calibration, freshness, and manipulation thresholds.
- Implement approved provider mapping, connect structured failure/backlog events to the approved durable telemetry and paging channel, execute hosted retention proof, licensed replay and accountable privacy/security/operations approvals.
- Run licensed replay, manipulation/adversarial, outage/retry, load, privacy, and UI comprehension tests.
- Obtain Product, Legal/Licensing, Privacy, Security, Data, Risk, Backend, UX, and Operations accountable approvals.

## Safety boundary

Social ingestion and checked-in cleanup remain disabled. The privacy policy and hosted cleanup are tested application primitives, not an approved DPIA or hosted operational proof. All fixtures are synthetic and contain no raw posts, handles, profile data, external content, or personal identifiers. Social attention is low-trust context only: it cannot verify a catalyst, qualify a scanner result, approve risk, propose an order, or authorize execution.
