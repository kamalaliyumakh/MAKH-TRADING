# MAKH Trading Platform — Angular Design-System Implementation

Last updated: 12 August 2026

## Library structure

```text
libs/ui/
├── src/lib/foundations/       # token adapters, typography, icons, layout
├── src/lib/primitives/        # button, link, field, dialog, status
├── src/lib/data-display/      # table, metric, chart frame, freshness
├── src/lib/patterns/          # mode, risk, order, evidence, confirmation
├── src/lib/a11y/              # focus, live-region queue, reduced motion helpers
├── src/lib/testing/           # component harnesses and accessibility fixtures
└── src/styles/                # generated tokens and global reset/theme entry
```

## Engineering rules

- Angular standalone components with strict templates, typed inputs/outputs and `OnPush`-compatible state.
- Prefer native HTML semantics; use ARIA only to supplement, never replace, correct elements.
- Components do not fetch business data, call generated API clients or make authorization/risk decisions.
- Feature libraries map domain/API state into component view models.
- Content projection is constrained so required accessible names, labels and status text cannot be omitted silently.
- Public and portal applications share foundations/primitives; trading patterns remain usable only in authorized feature contexts.
- Avoid a second theming system. `tokens.json` is source, generated CSS/TypeScript are build artifacts checked for drift.
- Initial release supports the light operational theme. A dark theme is deferred until all semantic/market/chart contrasts and forced-colors behavior are tested.

## Component documentation

Each component example documents purpose, anatomy, inputs/outputs, content guidance, keyboard behavior, screen-reader expectations, responsive behavior, states, prohibited use and test IDs. Examples include default plus error, disabled, stale/degraded and high-risk variants where relevant.

## Required checks

| Check | Gate |
|---|---|
| Token JSON parses; generated CSS/TypeScript has no drift | pull request |
| Semantic foreground/background contrast and focus indicator checks | pull request |
| Angular unit tests and component harness behavior | pull request |
| axe scan on every documented interactive component state | pull request |
| Keyboard/focus/dialog/table interaction tests | pull request |
| Visual regression at 320, 768, 1024 and 1440 CSS px | pull request |
| Forced-colors and reduced-motion snapshots/behavior | milestone |
| Manual screen-reader/zoom tests for composed critical journeys | WBS 2.6/2.7 gates |

## Adoption sequence

1. Generate token outputs and global foundations.
2. Implement button/link/form/focus/message/dialog primitives.
3. Implement shell/navigation/status/data-display components.
4. Implement mode/risk/evidence/order/trading patterns.
5. Build public and portal examples and enforce import boundaries.
6. Promote only components with documentation, tests and accessibility evidence.
