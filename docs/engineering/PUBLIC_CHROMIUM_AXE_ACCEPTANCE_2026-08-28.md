# Public Chromium Axe Acceptance

Date: 28 August 2026  
WBS: 4.5  
Matrix: Chromium 151, desktop 1280 × 800 and mobile 390 × 844

## Implemented scope

- Added a Playwright and `@axe-core/playwright` harness covering PR-01 through PR-09 at desktop and mobile viewports.
- The harness uses WCAG 2.0/2.1 A/AA tags and includes browser-calculated color contrast.
- Added `verify:public-axe` and a fail-closed hosted-quality step that installs Chromium, starts the public app, waits for readiness, retains server/audit logs and fails on violations.

## Findings and remediation

The initial 18-scan matrix found serious `color-contrast` violations in:

- the persistent footer risk label on all routes; and
- legal/privacy contents and resource links.

The footer label now uses an accessible dark blue on its light surface, and public content links now use the approved orange link token rather than the browser-default blue. The complete matrix now reports zero violations.

## Verification

- 18 Chromium axe scans pass: nine routes across desktop and mobile.
- 23 public tests and 97 Angular tests pass.
- One unrelated trading-portal timing failure appeared once in the first aggregate run; its focused 11-test suite and the complete 97-test rerun passed without code changes.
- Seven Angular production builds and nine public prerender routes pass.
- Public quality passes with 287,492 bytes initial JavaScript and 12,058 bytes initial CSS.
- DevSecOps policy, formatting, the 573-file secret scan and Git whitespace validation pass.

## Boundary

The CI workflow is configured but has not yet produced hosted execution evidence. Automated axe cannot replace screen-reader, keyboard, actual zoom, forced-colors, participant or accountable accessibility acceptance. No WCAG conformance claim or publication approval is granted.
