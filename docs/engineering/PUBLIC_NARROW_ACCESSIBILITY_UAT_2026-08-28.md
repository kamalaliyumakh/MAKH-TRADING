# Public Narrow-Viewport Accessibility UAT

Date: 28 August 2026  
WBS: 4.5  
Environment: local Angular development server with synthetic/public-only content

## Scope and result

- Exercised PR-01 through PR-09 at an explicit 320 × 800 CSS-pixel viewport.
- Confirmed each requested route resolves correctly, contains one H1 and one main landmark, and has no horizontal overflow.
- Confirmed every input, select, textarea and button has a programmatic label under the local DOM check.
- Rechecked mobile navigation: opening moves focus to `Platform`; Escape closes the menu and restores focus to the Menu button.
- Confirmed route changes continue to focus main content.
- Added deterministic public-quality checks that fail when the reduced-motion media query, animation suppression, forced-colors media query or structural border safeguard is removed.
- No form was submitted and no personal data, broker connection, credential, analytics event or external request was introduced.

## Verification

- 88 Angular tests pass, including fourteen public-app tests.
- Seven Angular production targets build; the public application prerenders nine routes.
- Public-quality verification passes with 287,492 bytes initial JavaScript and 12,021 bytes initial CSS.
- Formatting, a 570-file secret scan and Git whitespace validation pass.

## Boundary

This is local engineering evidence, not a WCAG conformance claim or accountable accessibility acceptance. Automated axe scans, actual 400% browser zoom, screen-reader and forced-colors sessions, representative participant validation, supported-browser coverage and hosted performance evidence remain required.
