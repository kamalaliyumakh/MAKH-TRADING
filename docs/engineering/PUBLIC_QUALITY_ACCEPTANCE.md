# Public Web Quality Acceptance

Date: 24 October 2026  
WBS: 4.5  
Status: In progress — 97%

## Implemented local scope

- All nine routes publish route-specific titles and descriptions consistent with the approved provisional copy.
- `/request-access` and `/sign-in` use `noindex,nofollow`; other informational routes use `index,follow` in the local prerender artifact.
- Every route publishes Open Graph and Twitter summary title/description metadata without claiming a production URL or image.
- Canonical URLs, sitemap, origin-dependent social URL/image fields and legal-entity structured data remain absent until an approved production origin, brand image and legal entity exist.
- A deterministic verifier checks every prerendered route for one H1, title, description, robots behavior, social-summary metadata, prohibited origin-dependent fields and known unapproved tracker references.
- The verifier enforces raw ceilings of 500 kB initial JavaScript, 100 kB initial CSS and 32 kB for the required deployed logo.
- Request-access validation focuses a linked error summary after render; accepted/duplicate results focus the status panel once.
- Browser UAT verifies mobile menu focus transfer, Escape focus return, route-change main focus and overflow-free desktop/390 × 844 layouts; one discovered focus timing defect was corrected and regression-tested.
- A 320 × 800 CSS-pixel browser matrix verifies all nine routes resolve with one H1, one main landmark, labelled controls and no horizontal overflow.
- Reduced-motion rules suppress nonessential animation/transition duration, and forced-colors rules preserve structural borders.
- The deterministic quality gate now fails if the reduced-motion or forced-colors safeguards are removed.
- A pinned axe-core 4.13.0 component-DOM suite scans all nine routes against supported WCAG 2.0/2.1 A/AA rules and currently reports zero violations.
- A real Chromium matrix scans all nine routes at desktop and mobile sizes, including browser-calculated contrast; initial serious link/footer contrast findings were remediated and all eighteen scans now report zero violations.
- Hosted quality is configured to install Chromium, wait for the public app, fail on axe violations and retain the audit/server logs.
- Real Chromium preference emulation covers all nine routes in forced-colors and reduced-motion contexts; required borders, motion suppression and overflow safeguards pass across all eighteen route/mode combinations, with a retained hosted log configured.
- A pinned Lighthouse gate audits three representative routes from the preloaded production artifact; all four categories score 1.00 locally. Earlier failed disk-served runs are retained. CI-retained raw reports are configured; hosted performance remains unverified.
- No analytics, tag manager, advertising pixel, session replay or tracking integration is present.

## Verification evidence

- Twenty-six public test instances pass across two targets, including nine route-level axe cases.
- The deterministic public-quality gate passes all nine routes against metadata, robots, tracker, accessibility-style and bundle-budget controls.
- The executable readiness verifier checks fourteen quality, evidence, regression and predecessor conditions and hashes seventeen artifacts.
- Production SSR build prerenders all nine routes without warnings.
- All 100 Angular tests and all seven production builds pass.
- Quality verification passes all nine routes; raw initial JavaScript is 287,459 bytes and CSS is 12,058 bytes. The deployed logo is 18,063 bytes; missing/oversized-logo negative checks pass.
- Local responsive UAT evidence is recorded in `PUBLIC_RESPONSIVE_UAT_2026-08-28.md`.
- Narrow-viewport accessibility evidence is recorded in `PUBLIC_NARROW_ACCESSIBILITY_UAT_2026-08-28.md`.
- Component-DOM axe evidence is recorded in `PUBLIC_AXE_COMPONENT_AUDIT_2026-08-28.md`.
- Chromium axe and contrast evidence is recorded in `PUBLIC_CHROMIUM_AXE_ACCEPTANCE_2026-08-28.md`.
- Chromium forced-colors and reduced-motion evidence is recorded in `PUBLIC_PREFERENCE_EMULATION_ACCEPTANCE_2026-08-28.md`.
- Local production-artifact Lighthouse evidence is recorded in `PUBLIC_LIGHTHOUSE_BASELINE_2026-08-28.md`.
- Refreshed evidence and preserved failed runs are recorded in `PUBLIC_LIGHTHOUSE_REMEDIATION_2026-08-30.md`.
- Browser route audit confirms unique H1, correct metadata, no detected tracker script and no horizontal overflow at the audit viewport.
- Browser interaction confirms five linked validation items, focus on the error summary and focus on the accepted status panel.

## Remaining acceptance conditions

- Obtain a successful retained hosted execution of the configured Chromium axe matrix; local real-browser and component-DOM baselines are complete.
- Complete manual keyboard, screen-reader, operating-system forced-colors/reduced-motion and 400% zoom testing with retained evidence; automated browser preference emulation and 320 CSS-pixel reflow are complete.
- Complete representative accessibility-participant validation and authorized QA/Accessibility acceptance.
- Establish approved production origin/legal-entity/brand-image facts before canonical URLs, sitemap, social URL/image metadata or structured data.
- Measure repeated Lighthouse and field Core Web Vitals from an approved hosted release candidate; the passing local production-artifact baseline is not production field performance.
- Analytics must remain disabled until an approved consent basis, preference control, event allowlist and privacy/security review exist.

## Decision

Advance WBS 4.5 to 97% and retain `In Progress`. Route-safe metadata, responsive keyboard behavior, 320 CSS-pixel reflow, accessibility safeguards, local component/Chromium axe—including contrast—automated browser preferences and the retained production-artifact Lighthouse checkpoint are locally ready. Hosted execution/field performance, assistive technology, actual zoom, manual operating-system preference sessions, approved origin/image and accountable acceptance remain pending. This record does not authorize hosted release, publication, analytics, paper trading or live trading.
