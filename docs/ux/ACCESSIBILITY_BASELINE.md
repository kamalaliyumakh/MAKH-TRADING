# MAKH Trading Platform — Accessibility Baseline

Last updated: 12 August 2026  
Target: WCAG 2.2 Level AA for agreed public and authenticated journeys

## Core requirements

| Area | Requirement |
|---|---|
| Structure | Semantic landmarks, headings, lists, tables and forms; one descriptive page title and logical heading order |
| Keyboard | All functionality operable without pointer; visible focus; no trap; logical order; skip links |
| Focus | Route changes and dialogs move focus deliberately; closing restores trigger; errors focus summary then link fields |
| Contrast | Text/UI/focus meet AA contrast; status never depends on color alone |
| Resize/reflow | Content works at 200% text resize and 400% zoom/reflow without loss of critical action/information |
| Forms | Persistent labels, instructions and programmatic error association; review step for consequential data |
| Targets | Meet WCAG 2.2 target-size minimum or permitted exception; destructive/adjacent controls receive extra spacing |
| Authentication | No inaccessible cognitive-function test; password-manager/paste allowed where credentials are used |
| Motion | Respect reduced motion; no unnecessary flashing; streaming updates do not move focus or reorder under the user unexpectedly |
| Timing | Warn/extend sessions where security permits; never auto-submit/cancel a trading decision because of UI timeout |
| Tables | Captions/headers; keyboard-sort/filter; row updates preserve focus; responsive alternative retains relationships |
| Charts | Text summary and accessible data table; color-independent series; visible units/time/source |
| Live regions | Announce critical state changes selectively; batch noncritical quote/scanner updates to avoid screen-reader flooding |
| Dialogs | Correct name/description, focus trap within modal, Escape behavior where safe, explicit destructive consequence |
| Errors/status | Use `aria-live`/status semantics appropriately; plain language and safe recovery action |

## Trading-specific accessibility

- Paper/Live mode is text in the page title/landmark context and confirmation, not only a colored banner.
- Quote, evidence and risk freshness is readable text with source/as-of information.
- Risk results expose Pass/Warning/Hard Block text and rule explanation.
- Rapid updates do not automatically reorder the scanner while keyboard/screen-reader focus is within it; offer pause or controlled refresh.
- Order state changes announce meaningful transitions only. Duplicate quote ticks are not announced.
- Partial fills communicate filled and remaining quantities, not just percentage/color.
- Kill-switch controls are separated, verb-specific and confirmation content is screen-reader complete.
- Keyboard shortcuts, if added, are discoverable, remappable/disableable and never trigger destructive action without confirmation.

## Required automated checks

- Angular template/type checks plus lint rules for accessible names and semantics.
- axe or equivalent scans on public routes and critical portal states.
- Color-contrast/token tests, focus-visible regression and reduced-motion checks.
- End-to-end keyboard flows for sign-in return, scanner-to-symbol, proposal/risk result, order monitoring, cancel, position close, risk block and export.

Automated tools do not prove conformance. Manual screen-reader, zoom/reflow, keyboard, error-recovery and cognitive/plain-language review is required before milestone acceptance.

## Assistive-technology test matrix

At minimum test current supported combinations for Chrome/Edge with NVDA on Windows, Safari with VoiceOver on macOS/iOS, keyboard-only operation, 400% zoom/reflow, high-contrast/forced-colors where supported and reduced-motion preferences. Final browser/AT matrix is approved with the support policy.

## Accessibility acceptance evidence

Each critical journey records tested build, browser/AT, viewport/zoom, input method, result, defect reference and reviewer. No unresolved accessibility defect may obscure mode, risk rejection, order state, protective state or emergency action before paper/live release.
