# MAKH Trading Platform — UX Research Findings

Last updated: 12 August 2026  
Method: requirements synthesis, workflow analysis, risk review and accessibility heuristic review

## 1. Research questions

1. What must a visitor understand before requesting access or signing in?
2. What information does a trader need to move from market signal to a risk-controlled decision?
3. Which states and uncertainties can cause unsafe action or false confidence?
4. How should paper/live modes, data freshness, broker truth and risk authority be communicated?
5. What interaction requirements are necessary for keyboard, screen-reader, low-vision, zoom and reduced-motion users?

## 2. Evidence reviewed

- Approved BRD/PRD and FSD.
- Architecture, threat model, data model, API/error/idempotency and recovery contracts.
- Product rules: USD 3–7 default price, time-normalized RVOL ≥ 3, float ≤ 500,000, and 100%–600% gain as a risk/watch signal only.
- Roles: trader/account owner, risk administrator, operations administrator, auditor/compliance and time-limited support.
- Paper-first and controlled-live release boundaries.

## 3. Primary findings

| ID | Finding | Evidence/risk | Design implication |
|---|---|---|---|
| UXF-01 | Trust must be established before performance language | Low-float trading is volatile; no guaranteed outcomes | Lead with risk controls, evidence provenance and self-directed scope; avoid profit-led claims |
| UXF-02 | Users need a clear signal-to-decision sequence | Scanner rank is not order authority | Keep discovery, evidence, thesis, proposal, risk decision and submission as distinct stages |
| UXF-03 | Data freshness is as important as the value | Stale market/broker state blocks entries | Show source/as-of/quality near price, metrics, evidence, orders and risk; never hide stale status in a tooltip only |
| UXF-04 | Paper/live confusion is a catastrophic usability risk | Wrong-mode action can cause financial harm | Persistent mode banner, account label and confirmation language; never rely on color alone |
| UXF-05 | The gain percentage is likely to dominate attention | 100%–600% spikes can imply urgency/false confidence | Pair gain with high-risk badge, liquidity/spread/halt context and explicit “not a buy signal” language |
| UXF-06 | Social content requires visual de-emphasis and provenance | Manipulation and unverified catalysts | Separate verified filings/issuer/news from social attention; label trust state and source |
| UXF-07 | Order users need consequence preview before commitment | Thin liquidity, gaps and stop slippage | Summarize quantity, limit, planned stop, estimated risk, buying power, policy outcome and mode before submit |
| UXF-08 | HTTP/broker state cannot be simplified to success/failure | Accepted, partial, timeout and reconciliation states differ materially | Use canonical states and plain-language next action; never show timeout as rejected or cancellation as no fills |
| UXF-09 | Risk failures must be actionable without encouraging bypass | Hard limits are non-bypassable | Present failed rule, measured value, policy version and safe corrective options; no “override” for traders |
| UXF-10 | Emergency actions need speed and resistance to mistakes | Cancel/liquidate can be destructive and incomplete | Separate block, cancel and liquidate; show impact; require MFA/confirmation where mandated; expose reconciliation progress |
| UXF-11 | Dense real-time views need user-controlled complexity | Scanner/order tables can overload attention | Default focused columns, saved views, progressive disclosure, stable row focus and pause/reduced-update options |
| UXF-12 | Accessibility is safety-critical, not cosmetic | Users must perceive rapidly changing and high-risk state | Semantic structure, non-color status, focus management, live-region restraint, keyboard tables/dialogs and zoom support |
| UXF-13 | Mobile should support monitoring and containment first | Small screens increase entry error risk | Optimize mobile for status, alerts, positions, cancel and block; complex proposal editing may require deliberate step flow |
| UXF-14 | Users need recovery guidance during uncertainty | Feed gaps, disconnects and stale snapshots are expected | Global connectivity status plus local stale markers and clear refresh/reconciliation action |
| UXF-15 | Auditability should be visible at decision time | Evidence/version trail is a core trust benefit | Show policy/evidence timestamps and allow later reconstruction without exposing internal secrets |

## 4. Public-site needs

Visitors should understand within the first screen that MAKH is risk-controlled decision support for self-directed trading—not a promise of returns. The public hierarchy should be:

1. What the platform does and for whom.
2. How candidate discovery, evidence verification, risk approval and broker execution remain separate.
3. Why paper-first and mode segregation matter.
4. Security/privacy and provider boundaries.
5. Prominent low-priced-stock, liquidity, halt and execution-risk disclosure.
6. Request access or sign in without dark patterns.

Required routes: Home, Platform, Security, About, Status, Legal/Risk, Privacy, Request Access and Sign In.

## 5. Portal needs

- A persistent shell shows account, Paper/Live mode, market session, data health, broker health, reconciliation health and global entry-block state.
- Dashboard prioritizes safety state and remaining capacity before candidate excitement.
- Scanner supports ranking explanation, filter version, freshness, provenance, risk badges and watchlist action—never direct broker submission.
- Symbol workspace combines quote/metrics, verified catalyst, risk warnings, thesis and proposal entry without presenting evidence as certainty.
- Order/position surfaces show canonical lifecycle, partial fills, protection status and reconciliation; mutations state exactly what is known.
- Risk console separates visibility from privileged configuration and emergency controls.
- Journal/report/audit surfaces preserve a signal-to-outcome story and respect account/export permissions.

## 6. Provisional design principles

1. Safety state before opportunity state.
2. Evidence and provenance before action.
3. Explicit mode, scope, freshness and authority.
4. One primary consequential action per decision step.
5. Progressive disclosure without hiding mandatory risk.
6. Plain language for uncertainty and broker lifecycle.
7. No dependence on color, motion, hover or memory alone.
8. Preserve user focus and context during real-time updates.
9. Destructive operations show scope, consequence, confirmation and recovery state.
10. Every high-risk error provides a safe next step, not a bypass.

## 7. Research limitations

No representative-user interviews, analytics, task observations or moderated usability tests have been completed. Role definitions and workflows are requirements-derived hypotheses. WBS 2.6 and 2.7 acceptance must include the validation activities in `VALIDATION_PLAN.md` and approved legal/risk language.
