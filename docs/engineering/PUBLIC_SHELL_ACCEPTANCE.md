# Public Landing Shell Acceptance

Date: 24 October 2026  
WBS: 4.1  
Status: In progress — 95%

## Accepted local evidence

- Angular standalone shell implements a skip link, semantic header/main/footer landmarks, desktop navigation, mobile navigation and persistent risk disclosure.
- The public application prerenders `/`, `/platform`, `/security`, `/status`, `/about`, `/legal/risk`, `/privacy`, `/request-access` and `/sign-in`.
- The home route states the paper-first, evidence-first boundary and does not offer recommendations, account connectivity or live trading.
- The redesigned hero uses a high-contrast professional layout with an accessible SVG market-pulse preview, synthetic labels and visible entry-lock context.
- Applied the approved dark navy/orange reference direction and a responsive high-contrast lockup using the supplied MAKH logo artwork.
- Restyled public cards, forms, navigation and calls to action as one consistent dark visual system without changing route semantics or safety boundaries.
- Placeholder routes are explicitly labelled as local foundation previews and do not imitate completed provider-backed functionality.
- The mobile menu exposes `aria-controls` and `aria-expanded`, contains keyboard focus, closes with Escape and restores focus to its named trigger.
- Browser acceptance passed at 1440 × 900 and 390 × 844 with no horizontal overflow, one H1, visible risk disclosure and no console warnings/errors.
- The current public suite executes 26 passing test instances across two targets, representing 13 distinct source cases. The test builder completes successfully.
- The executable readiness verifier checks the route, prerender, semantic-shell, navigation, risk, logo, regression, predecessor and Lighthouse evidence and hashes eleven artifacts.

## Remaining acceptance conditions

- WBS 3.8 and its predecessors remain open; this work is reversible local preparation, not approval to publish.
- Frontend Lead review, representative keyboard/screen-reader validation and the approved visual-regression baseline remain pending.
- Route-specific content and functionality are deferred to their own WBS work packages.
- The current standalone production-build recheck is blocked by an esbuild process deadlock after the test builder succeeds; this toolchain/runtime failure remains open until a clean production build is reproduced.
- No hosting, DNS, analytics, identity provider, broker, market-data provider, user account, paper order or live order is connected or authorized.

## Decision

Advance WBS 4.1 to 95% and retain `In Progress`. The coded local shell, supplied-logo integration, regression suite and executable evidence package are implementation-ready. This record does not authorize publication, paper trading or live trading. Human acceptance, the foundation-gate predecessor and a repeatable standalone production build remain incomplete.
