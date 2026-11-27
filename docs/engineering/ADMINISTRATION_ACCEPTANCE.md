# WBS 8.4 — Administration Foundation Acceptance

## Status

In progress — 82%.

## Delivered locally

- Default-deny administrative command boundary with explicit resource/action permissions.
- Separation of operations administration, risk-policy administration and auditor diagnostics.
- Fresh-MFA and active time-bound elevation requirements, capped at one hour.
- Mandatory reason and correlation evidence with secret/token rejection.
- Optimistic version checks, idempotent command replay and changed-intent conflict rejection.
- Privileged-command replay now binds the complete resource/action/ID/version/summary intent and original actor identity.
- Reusing a command ID with a changed expected version, proposed version, summary or actor fails closed rather than returning the earlier result.
- SHA-256 before/after configuration evidence and ordered audit sequence.
- Provider configuration stores safe references only, never credential material.
- Explicit non-trading-authority and non-credential result flags.
- Added `/app/admin`, a responsive read-only Angular administration workspace with access-review coverage, configuration health and ordered audit evidence.
- Added visible role separation, due-soon review state, unavailable/draft configuration states and denied-command evidence without exposing privileged mutation controls.

## Verification

- 21 focused privilege, MFA, elevation, concurrency, full-intent replay, audit and credential-safety tests pass.
- All 446 architecture tests and 66 API-security tests pass with a zero-warning Release build.
- Four focused administration UI cases and all 62 trading-portal tests pass.
- The warning-free portal production build is 427.09 kB raw and 106.42 kB estimated transfer; Angular import boundaries pass.
- Browser checks at 1280 px and 390 × 844 confirm responsive role/configuration/audit layouts, scrollable portal navigation, zero forms/buttons, no page overflow and no console warnings/errors.

## Remaining acceptance work

- PostgreSQL configuration/privileged-access/audit persistence and immutable event integration.
- Identity-directory user lifecycle, approval workflows, session revocation and access review.
- Licensed provider and approved market-calendar adapters with credential vault references.
- Authenticated APIs and governed mutation workflows with impact previews integrated into the Angular administration view.
- Independent privilege, CSRF, repeated-command, break-glass, revocation and recovery tests.
- Operations, Risk, Security and Product Owner acceptance.

## Safety boundary

The service and read-only UI use synthetic in-memory state. They change no real identity, provider, calendar, policy, infrastructure, credential, broker or trading state and cannot grant order or live-trading authority.
