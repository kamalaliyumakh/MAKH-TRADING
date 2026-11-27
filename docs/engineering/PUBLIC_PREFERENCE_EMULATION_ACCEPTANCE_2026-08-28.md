# Public Preference Emulation Acceptance

Date: 28 August 2026  
WBS: 4.5  
Result: Local automated browser checkpoint passed

## Scope

- Added `eng/verify-public-preferences.mjs` using real headless Chromium.
- Exercised all nine public routes at 390 × 844 CSS pixels in a forced-colors context and again in a reduced-motion context.
- Confirmed each emulated media query is active before accepting its results.
- In forced-colors mode, verified configured state, action, form and result surfaces retain a visible structural border and no route develops horizontal overflow.
- In reduced-motion mode, inspected every rendered element and rejected animation or transition durations above 0.01 ms, animation iteration counts above one, or horizontal overflow.
- Added the verifier to the hosted quality workflow with a retained `public-preferences.txt` log.

## Verification

- Eighteen preference/route combinations passed: nine forced-colors and nine reduced-motion.
- No missing required structural border, residual motion or horizontal overflow was detected.
- The check is deterministic and exits unsuccessfully when any assertion fails.

## Boundary

This is automated Chromium emulation, not a claim of manual Windows High Contrast, operating-system assistive technology, screen-reader or human usability acceptance. Manual platform sessions, actual 400% zoom, hosted execution and accountable QA/Accessibility approval remain required.
