# WBS 8.4 — Administration Readiness

## Status

In progress — 90%.

## Local control position

- Privileged context requires a non-empty actor, bounded role, fresh-MFA evidence, a bounded elevation window, reason and correlation evidence.
- Elevation start/expiry now require non-default UTC and cannot span more than one hour.
- Undefined administrative resources and actions fail at command construction.
- Role, reason, correlation, resource, version and summary evidence reject excessive length, address/credential-like material and control characters.
- Existing test evidence covers role/resource authorization, fresh MFA, elevation expiry, optimistic version fencing, complete actor-bound command idempotency, before/after SHA-256 audit evidence and immutable false trading/credential authority.
- Twenty-five focused administration cases are present. Four new contract-boundary cases are authored but not claimed as executed because a reliable fresh .NET compilation run is unavailable.
- The executable readiness verifier hashes only hydrated, inspectable artifacts. The cloud-managed service, original acceptance and in-memory-store files were unavailable for safe hydration during this checkpoint and are therefore explicit blockers rather than silently omitted proof.

## Decision

`Local Administrative Contract Ready / Durable Workflow and Accountable Acceptance Pending`.

## Remaining work

- Hydrate and freshly review/execute the service, store and original acceptance package.
- Add PostgreSQL configuration, access-version, command, audit and outbox persistence with cross-process fencing.
- Integrate authoritative directory lifecycle/revocation and approved provider/calendar/risk-policy sources.
- Build authenticated impact preview, approval, publish/disable and break-glass workflows with fresh MFA and antiforgery.
- Add safe diagnostics, recovery, load, authorization, privacy, accessibility and independent security evidence.
- Obtain Product, Security, Risk, Operations, Data and Accessibility approvals.

## Safety boundary

This checkpoint creates no authenticated administrative endpoint, durable mutation, provider connection, environment change, operational authority, paper-trading authority or live-trading authority.
