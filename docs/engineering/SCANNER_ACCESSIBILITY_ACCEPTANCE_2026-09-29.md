# Scanner Accessibility Verification

Date: 29 September 2026  
Scope: Local authenticated synthetic scanner route  
Decision: Local automated checks pass; formal accessibility acceptance remains pending

## Implemented verification

- Added an authenticated Playwright/axe harness for `/app/scanner` at 1280 × 800, 640 × 800 and 320 × 800 CSS pixels in standard, forced-colors and reduced-motion modes: nine browser cases. The 640 px case is a 200% reflow proxy, not actual browser-zoom evidence.
- Added two keyboard-only journeys that verify sequential Tab navigation, visible focus, in-page skip-to-content, preset-details operation, keyboard filtering, symbol-link reachability and reverse navigation.
- Applied WCAG text-spacing overrides during both keyboard journeys and verified that user-facing controls remain unclipped with no horizontal viewport overflow.
- The keyboard audit exposed a skip link that resolved through the application base URL and lost the scanner route. The link now prevents default navigation, focuses the main landmark directly and retains `/app/scanner`.
- Runs WCAG 2.0/2.1 A/AA axe rules, including real-browser color contrast.
- Verifies one page heading, one main landmark, candidate-filter focus, no horizontal viewport overflow and no browser console errors.
- Persists a machine-readable local result at `outputs/scanner-accessibility/local-axe-results.json`.
- Confirms preference media queries are active, required structural borders remain in forced-colors mode and no element retains motion when reduction is requested.

## Findings and remediation

- The first run found serious contrast failures on the candidate filter and Qualified state badge at both viewports.
- Scanner styles now provide white select text and a higher-contrast qualified-state foreground on the existing dark surfaces.
- Forced-colors testing then exposed shell/scanner contrast failures. A system-color fallback now removes gradients and shadows and preserves Canvas/CanvasText/LinkText contrast and structural borders in high-contrast mode.
- Removed a redundant inline-flex width declaration so the component remains within its production style budget.

## Verified result

- All nine authenticated Chromium viewport/mode cases pass with zero axe violations.
- Axe retains one incomplete `color-contrast` rule per viewport because gradients/overlapping elements prevent automated background determination; all affected targets are retained for manual review.
- Heading/landmark structure, filter focus, reflow and console checks pass.
- All 76 portal tests and Angular import boundaries pass.
- The warning-free production build is 471.54 kB initial plus a 55.88 kB lazy SignalR chunk.

## Boundary

This is local automated evidence, not a WCAG conformance claim or accountable accessibility acceptance. Manual contrast review for axe-incomplete gradient/overlap targets, screen-reader and other assistive-technology sessions, actual 400% zoom, manual operating-system high-contrast/reduced-motion sessions, supported-browser coverage, representative-user validation, hosted execution and Accessibility Lead approval remain required. No paper or live trading authority is created.
