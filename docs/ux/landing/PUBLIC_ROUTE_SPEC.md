# MAKH Trading Platform — Public Route Specification

Last updated: 12 August 2026

## Global shell

- Skip link → header landmark → typographic MAKH wordmark → primary navigation → Request access → Sign in.
- Main landmark has one H1. Footer repeats Security, Status, Legal/Risk, Privacy and contact/reporting links.
- At widths below `md`, navigation opens from a named button into a focus-contained panel; current route is identified programmatically.
- No public page loads broker/account data or portal analytics. Consent is obtained before nonessential analytics.
- Persistent footer disclosure: “Trading low-priced securities involves substantial risk, including loss beyond a planned stop. MAKH does not guarantee outcomes.”

## Route matrix

| ID | Route | Visitor question | Primary outcome | Core components |
|---|---|---|---|---|
| PR-01 | `/` | What is MAKH, and should I trust it? | Understand risk-first workflow; request access | Hero, workflow, principles, risk disclosure, FAQ, CTA |
| PR-02 | `/platform` | How does the product work? | Understand discovery→evidence→risk→execution→review | Feature flow, trust boundaries, portal preview, CTA |
| PR-03 | `/security` | How are identity, credentials and orders protected? | Understand controls and report concern | Security pillars, boundaries, incident contact |
| PR-04 | `/status` | Is the service operating? | View component-level public status | Status summary, incidents, maintenance, subscribe |
| PR-05 | `/about` | Who is this for and what is the operating philosophy? | Understand scope and principles | Mission, audience, boundaries, governance |
| PR-06 | `/legal/risk` | What trading and product risks apply? | Read/acknowledge risk before access | Risk disclosure sections, no-guarantee statement |
| PR-07 | `/privacy` | What data is collected and why? | Understand privacy/retention/rights | Data categories, purposes, controls, rights/contact |
| PR-08 | `/request-access` | How do I express interest safely? | Submit minimal access request and consent | Accessible form, privacy notice, success state |
| PR-09 | `/sign-in` | How do I securely access the portal? | Start OIDC sign-in | Security notice, sign-in action, support/status links |

## Cross-route content rules

- “Scanner”, “candidate” and “rank” never become “recommendation”, “winner” or “buy signal”.
- Every discussion of a 100%–600% move pairs it with elevated volatility, liquidity, halt and manipulation risk.
- Broker language states that the broker is authoritative for accepted orders, executions and live positions; MAKH does not custody funds or securities.
- Public security copy describes controls without exposing secret values, provider-specific configuration or guarantees.
- Status language distinguishes operational availability from market-data/broker truth and never exposes account-specific incidents.
- Legal/risk and privacy effective dates/version identifiers are visible and linkable.

## Page states

Every route defines Loading, Ready and Error states. Status adds Operational, Degraded, Partial Outage, Major Outage and Maintenance. Request Access adds validation, submitting, accepted, duplicate-safe and unavailable. Sign In adds provider unavailable and session expired. Errors include a correlation ID where supplied and safe navigation—not raw technical/provider content.
