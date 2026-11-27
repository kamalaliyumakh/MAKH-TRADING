# MAKH Trading Platform — Responsive Layout and States

Last updated: 12 August 2026

## Breakpoints and containers

| Token | Minimum width | Intended behavior |
|---|---:|---|
| Base | 0 | single column, monitoring/containment priority, full-width dialogs/controls |
| `sm` | 480px | compact two-up cards where content permits |
| `md` | 768px | tablet navigation, two-column forms and record lists |
| `lg` | 1024px | persistent portal side navigation; main/context split |
| `xl` | 1280px | dense data table and symbol workspace panels |
| `2xl` | 1536px | wide scanner/operations layouts with capped content width |

Use content-driven container queries inside reusable components where supported. Breakpoints are layout thresholds, not device labels. Public reading measure is capped near 45rem; standard content at 75rem and data-heavy wide layout at 90rem.

## Grid

- Base: four columns, 16px page gutters.
- `md`: eight columns, 24px gutters.
- `lg+`: twelve columns, 24–32px gutters.
- Portal shell: navigation 240px expanded or 72px compact; content minmax(0, 1fr); optional context rail 320–400px.
- No horizontal page scrolling at 320 CSS px. Purposeful table overflow remains within a labelled scroll region with a responsive record alternative.

## Responsive priorities

| Surface | Narrow behavior |
|---|---|
| Global status | keep mode and entry block visible; collapse dependency detail behind labelled disclosure |
| Scanner | focused default metrics; controlled column chooser; records/cards alternative; no auto-reorder under focus |
| Symbol workspace | quote/risk/evidence before chart depth; proposal becomes explicit multi-step review |
| Orders/positions | state, quantity, protection and containment actions before secondary analytics |
| Risk console | current blocks/capacity first; policy editing uses deliberate steps |
| Admin/audit | monitoring usable; complex configuration may require wider reviewed layout without blocking emergency containment |

## Page-state anatomy

1. Page heading and account/mode context.
2. Global/local health and freshness.
3. State explanation.
4. Existing data where safe, clearly marked with age.
5. Safe next action and support/correlation details.

| State | Presentation rule |
|---|---|
| Loading | reserve stable layout; labelled busy status; no indefinite silent skeleton |
| Empty | explain whether no data, no match, no entitlement or not configured |
| Stale | retain value only with visible age/quality; disable unsafe action server-side and in UI |
| Degraded | identify dependency and affected capabilities separately |
| Unauthorized | generic safe message; no resource existence leak |
| Error | plain cause category, correlation ID and safe retry/contact action |
| Recovering | show snapshot/reconciliation progress without optimistic completion |
| Entry blocked | persistent reason/scope and allowed reducing/containment actions |
| Unknown broker state | do not show rejected; prevent duplicate intent and direct user to reconciliation status |

## Motion

Motion communicates spatial change only. Standard transitions are 120–180ms; no price flashing, pulsing profit cues, parallax or celebratory effects. Real-time cell changes may use a subtle nonessential highlight that is removed under reduced motion and never carries meaning alone.

## Paper and Live treatments

- Paper: blue outlined banner with document/simulation icon and text “PAPER — simulated broker account”.
- Live: amber/black strong banner with shield/account icon and text “LIVE — real funds and market execution risk”.
- Both repeat mode in account switcher, page context, order summary and consequential confirmation.
- Live never uses red as its ordinary mode color because red is reserved for failure/destructive severity.
