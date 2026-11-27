# Public Access Request Acceptance

Date: 24 October 2026  
WBS: 4.4  
Status: In progress — 90%

## Implemented local scope

- `/request-access` provides labelled name, email, country/region, optional experience, constrained intended-use and optional accessibility/contact-preference controls.
- The route excludes broker credentials, account numbers, government identifiers, balances and free-form trading instructions, with explicit warnings before submission.
- Required-field, email-format and privacy-acknowledgement validation is visible in an alert summary and at each invalid control.
- A visually hidden honeypot provides non-CAPTCHA bot screening; a session-local three-attempt-per-minute guard models the rate-control boundary.
- Duplicate email submissions within the service instance return the original reference rather than creating another request.
- Duplicate lookup keys are SHA-256 digests of normalized addresses; submitted email addresses are not retained as in-memory map keys.
- Accepted, duplicate-safe and temporarily unavailable states are implemented with safe wording and no raw technical detail.
- The gateway is deliberately isolated and in-memory. It makes no HTTP request, sends no email/notification, writes no database record and retains no payload outside the current application instance.

## Verification evidence

- Twenty-six public test instances pass across two targets, including three focused service cases for normalized duplicate matching, honeypot screening and rolling-window throttling.
- The executable readiness verifier checks thirteen form, minimization, validation, abuse-control, state, regression and predecessor conditions and hashes ten artifacts.
- Production SSR build completes and prerenders all nine public routes.
- Browser interaction confirms invalid submission guidance and the accepted reference/security-warning state.
- Desktop visual review confirms readable hierarchy, labelled controls, visible privacy relationship and persistent risk disclosure.

## Remaining acceptance conditions

- Approved API contract, durable encrypted storage, retention/deletion process and privacy-controller facts remain required before real capture.
- Edge/WAF rate limiting, production-grade bot detection, abuse monitoring and security testing remain required.
- Notification templates, recipient authorization, provider configuration, delivery/audit outbox and failure handling remain disabled and unapproved.
- Duplicate semantics across replicas require a database uniqueness/idempotency design.
- WBS 1.2, 2.6, 3.8 and 4.1 dependencies plus privacy, security, accessibility, Frontend Lead and Product Owner acceptance remain open.

## Decision

Advance WBS 4.4 to 90% and retain `In Progress`. The local interaction contract avoids retaining plaintext email lookup keys and is behavior-tested, while real personal-data storage, edge controls and notifications remain intentionally disabled pending approvals. This record does not authorize real personal-data capture, notification delivery, publication, paper trading or live trading.
