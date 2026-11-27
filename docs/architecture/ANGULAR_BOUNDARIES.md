# Angular Application and Library Boundaries

Last updated: 14 October 2026

## Deployable applications

- `apps/web-public` is the anonymous public surface. It uses SSR/prerender and must not expose authenticated account or trading behavior.
- `apps/trading-portal` is the authenticated product shell. At this foundation stage it is paper-only and contains no broker connection or order authority.

Applications may import library public APIs through the `@makh/*` aliases. Applications must not import another application's source.

## Shared libraries

| Library | Responsibility | Explicit non-responsibility |
|---|---|---|
| `@makh/ui` | Accessible presentation primitives and design tokens | Authentication, data access or trading decisions |
| `@makh/auth` | Session and authorization contracts | Identity-provider implementation or token storage |
| `@makh/api-client` | Transport-neutral API contract helpers | Business rules or direct provider credentials |
| `@makh/realtime` | Connection and snapshot-recovery contracts | Authoritative trading state |
| `@makh/shared` | Stable cross-cutting types and labels | Feature orchestration or infrastructure access |

Libraries cannot import from `apps/`, reach into another library's `src/` internals or use relative paths to cross library boundaries. `eng/check-angular-boundaries.mjs` enforces these rules against TypeScript imports.

## Safety constraints

- Scanner momentum and evidence are decision support; they never authorize an order.
- Paper/live mode must remain explicit and non-color-only.
- Browser code must not contain broker, market-data or identity-provider secrets.
- Real-time messages are recoverable hints. REST snapshots remain the recovery authority after gaps or reconnects.
- Order submission, risk approval and live enablement belong to later gated work packages.

## Change control

A new cross-library dependency requires Frontend Lead review, a public entry-point update and successful boundary, build and test checks. Any identity, provider, live-trading or external-publication behavior also requires its applicable architecture, security, legal and product gates.
