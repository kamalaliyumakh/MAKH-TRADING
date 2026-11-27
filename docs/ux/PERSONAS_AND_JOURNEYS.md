# MAKH Trading Platform — Provisional Personas and Journeys

Last updated: 12 August 2026

These archetypes guide design coverage; they are not demographic stereotypes and must be validated with real participants.

## Personas

| ID | Archetype | Goals | Risks/frustrations | UX needs |
|---|---|---|---|---|
| P-01 | Self-directed momentum trader | Find qualified candidates, verify catalyst, size safely, execute and monitor | urgency, thin liquidity, stale data, mode mistakes | fast evidence comparison, visible freshness/mode, clear risk decision and order truth |
| P-02 | Risk administrator | Configure limits, monitor capacity/breaches, contain exposure | accidental policy weakening, destructive kill switch, audit burden | versioned changes, MFA, impact preview, reasons, strong state/ownership cues |
| P-03 | Operations administrator | Monitor providers, calendars, queues and reconciliation | provider ambiguity, hidden backlog, unsafe correction | dependency-specific health, source snapshots, controlled recovery and escalation |
| P-04 | Auditor/compliance reviewer | Reconstruct decisions and changes without modifying them | missing provenance, excessive privilege, ambiguous timestamps | read-only scoped timeline, versions, export manifest and UTC/source times |
| P-05 | Visitor/prospective user | Assess product legitimacy, safety and suitability | exaggerated returns, unclear custody/advice boundary | plain scope, risk disclosure, workflow demonstration, security/privacy explanation |

## Critical journeys

### J-01 — Visitor to informed access request

Home → understand self-directed/risk-first scope → review platform workflow → review security and legal/risk → request access. Success means the visitor can explain that scanner signals do not authorize trades and returns are not guaranteed.

### J-02 — Sign in and establish safe context

OIDC sign in → acknowledge current terms/privacy/risk → select authorized account → confirm Paper/Live mode → see dependency/risk health. Sensitive action prompts step-up without losing the prepared context.

### J-03 — Candidate to watchlist

Open scanner → inspect filter/run version and freshness → compare gain, RVOL, float, spread/liquidity and risk flags → open symbol evidence → add to watchlist. No order is created.

### J-04 — Evidence to paper order

Review verified catalyst and source timestamps → write thesis → enter price/quantity/stop plan → inspect calculated risk and rule results → explicitly submit approved proposal → track Pending/Accepted/Partial/Fill truth. A rejection provides corrective information without an override.

### J-05 — Timeout or sequence gap recovery

Connection warning appears → affected view becomes stale → REST snapshot refreshes → broker timeout displays Unknown/Pending Reconciliation → duplicate submit is prevented → authoritative broker result resolves the order.

### J-06 — Position monitoring and exit

Open positions → inspect quantity, P&L snapshot age, protection and reconciliation → create risk-checked close/cancel/replace intent → confirm account/mode/consequence → follow partial outcomes until reconciled.

### J-07 — Risk breach and containment

Risk alert → inspect affected account/symbol/rule → block entries → if authorized, cancel eligible orders → only then consider policy-defined liquidation with MFA and second confirmation → monitor reconciled outcome.

### J-08 — Policy publication

Risk administrator opens current version → creates new draft → reviews effective date and impacts → completes step-up → publishes immutable version with reason → affected users receive risk-state update. Historical decisions retain their original version.

### J-09 — Incident reconstruction

Auditor selects date/trade/incident → reviews actor, market/evidence snapshot, proposal, rules, order events, fills and reconciliation → generates scoped expiring export → verifies manifest/checksum.

## Journey acceptance measures

| Measure | Target hypothesis |
|---|---|
| Mode identification | 100% of test participants identify Paper versus Live before a consequential action |
| Risk authority comprehension | ≥ 90% explain that scanner/evidence does not equal order approval |
| Order-state comprehension | ≥ 90% distinguish accepted, filled, rejected and unknown/reconciling |
| Critical task completion | ≥ 90% complete agreed paper journeys without assistance after onboarding |
| Destructive action errors | 0 unintended liquidation confirmations in validation |
| Keyboard completion | 100% of agreed critical journeys operable without pointer |

Targets are design hypotheses, not measured results, until the validation plan is executed.
