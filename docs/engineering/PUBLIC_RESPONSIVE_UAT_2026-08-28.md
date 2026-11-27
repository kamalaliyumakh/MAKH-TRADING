# Public Landing Responsive UAT

Date: 2026-08-28  
Scope: landing page, mobile navigation, route transition and request-access validation  
WBS: 4.5 Public web quality

## Result

Pass after remediation of one keyboard-focus defect.

## Verified scenarios

- Desktop landing page: one H1, complete primary navigation, correct title/social metadata, focused main region and no horizontal overflow.
- Mobile 390 × 844: menu button exposes collapsed/expanded state and the open layout has no horizontal overflow.
- Menu open: keyboard focus moves to the first `Platform` link.
- Escape: menu closes and focus returns to the Menu button.
- Mobile route transition: menu closes, main content receives focus, title/Open Graph/Twitter metadata changes to the Platform route and no overflow appears.
- Request access: route remains `noindex,nofollow`; blank submission focuses the linked error summary and lists five validation failures.
- The page states that external delivery is disabled; no personal data was entered or transmitted.

## Defect and correction

Focus was scheduled before Angular had rendered the conditional mobile navigation. The menu used a later render task and gained a regression assertion requiring the `Platform` link to become active after opening.

## Automated regression

- 88 Angular tests passed, including 14 public-app tests.
- Seven production targets built successfully; nine public routes prerendered.
- Public quality passed with 287,492 bytes initial JavaScript and 12,021 bytes CSS.
- Formatting and Git whitespace checks passed.

## Remaining acceptance

This is local browser evidence only. Automated axe, screen-reader, keyboard matrix, forced-colors, reduced-motion, 320 CSS px/400% zoom, representative-participant and hosted performance evidence remain required. No publication approval is granted.
