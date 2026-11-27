# WBS 8.1 — Notification Foundation Acceptance

## Status

In progress — 90%.

## Delivered locally

- User/channel/event preferences with enabled state and minimum severity.
- Information, Warning and HardBlock severity ordering.
- Fail-closed suppression when no exact enabled preference permits delivery.
- Independent in-app and email channel decisions.
- Idempotent queueing with conflicting-key rejection and one audit attempt per intent.
- Pending, suppressed, failed and delivered delivery states with retry attempt counts.
- Terminal delivered-state replay behavior and rejection of provider results for suppressed attempts.
- Redacted provider receipts and rejection of direct email addresses/token-like material in evidence fields.
- Explicit non-authority labels on delivery attempts.
- System-injected mandatory-safety rules with exact event, minimum-severity and channel scope.
- Applicable mandatory rules override disabled ordinary preferences without expanding to unrelated events, lower severities or unconfigured channels.
- Duplicate event/channel safety rules fail configuration validation instead of creating ambiguous precedence.
- Undefined channel/severity values, empty optional account IDs, non-UTC/default timestamps and materially future events fail closed.
- Event type, subject, evidence reference, correlation ID, idempotency key and result reason are bounded and reject control characters or sensitive token/address material.
- Idempotency binds the complete immutable notification intent, including account, event content, occurrence time, correlation and channel; changed intent under the same key conflicts.
- Result time cannot regress, delivered state remains terminal and retries are capped at ten attempts.

## Verification

- 20 focused preference, mandatory-policy, severity, exact-intent idempotency, chronology, retry, redaction and failure-mode cases are present.
- The retained verified baseline is 431 architecture tests and 66 API-security tests with a zero-warning Release build. The three new focused cases are authored but not claimed as executed because the current sandbox denies the MSBuild named pipe before compilation.
- `node eng/verify-notification-readiness.mjs` performs twelve fail-closed checks, hashes the current evidence package and emits `outputs/notification-readiness/readiness-manifest.json`.

## Remaining acceptance work

- PostgreSQL preference/delivery-attempt persistence, outbox/inbox integration, leases and retry scheduling.
- Authenticated preference APIs and authorized account/user event routing.
- In-app SignalR delivery with sequence/gap/snapshot recovery and revocation handling.
- Selected email provider, verified sender/domain, templates, unsubscribe/legal rules and bounce/complaint processing.
- Accountable approval and production configuration of the mandatory-safety event/severity/channel rules.
- Rate limits, batching, quiet hours, escalation, dead-letter, observability and incident procedures.
- Security/privacy review, accessibility/usability tests, provider sandbox/load/failure/recovery evidence and approvals.

## Safety boundary

The service is synthetic and in memory. It has no API, SignalR hub, email provider, address, credential or external connection. Delivery records are non-authoritative and cannot change risk, reconciliation, order or live-trading state.
