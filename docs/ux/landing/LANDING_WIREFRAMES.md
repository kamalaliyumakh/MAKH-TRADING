# MAKH Trading Platform — Responsive Landing Wireframes

Last updated: 12 August 2026  
Fidelity: structure, hierarchy, states and responsive behavior; not final artwork

## Shared desktop frame

```text
┌────────────────────────────────────────────────────────────────────┐
│ Skip to content (focus only)                                      │
│ MAKH   Platform  Security  Status  About   [Request access] Sign in│
├────────────────────────────────────────────────────────────────────┤
│ MAIN: route-specific content                                      │
├────────────────────────────────────────────────────────────────────┤
│ Risk statement                                                    │
│ Platform · Security · Status · Legal/Risk · Privacy · Contact      │
└────────────────────────────────────────────────────────────────────┘
```

## Shared narrow frame

```text
┌──────────────────────────────┐
│ MAKH         [Request] [Menu]│
├──────────────────────────────┤
│ MAIN: one-column hierarchy   │
│ controls ≥ 44px where able   │
├──────────────────────────────┤
│ Risk statement + footer links│
└──────────────────────────────┘
```

## WF-01 — Home `/`

```text
┌────────────────────────────────────────────────────────────────────┐
│ HERO (7 cols)                       PRODUCT PRINCIPLE (5 cols)     │
│ Risk-controlled decisions for      Scanner signals attract       │
│ fast-moving markets.               attention. Risk approval       │
│ Evidence, limits and broker truth   controls submission.           │
│ in one accountable workflow.       [Paper-first] [Auditable]      │
│ [Request access] [Explore platform]                               │
├────────────────────────────────────────────────────────────────────┤
│ WORKFLOW: Discover → Verify → Evaluate risk → Execute → Review     │
├────────────────────────────────────────────────────────────────────┤
│ RISK-FIRST PRINCIPLES (3 cards): evidence / hard limits / truth   │
├────────────────────────────────────────────────────────────────────┤
│ PLATFORM PREVIEW (annotated static composition, no fake returns)   │
├────────────────────────────────────────────────────────────────────┤
│ PROMINENT LOW-PRICED-STOCK RISK DISCLOSURE                         │
├────────────────────────────────────────────────────────────────────┤
│ FAQ accordion                                          FINAL CTA   │
└────────────────────────────────────────────────────────────────────┘
```

Narrow: hero, principle and workflow stack; CTA remains after context, not sticky pressure. Preview becomes labelled cards rather than a squeezed dashboard image.

## WF-02 — Platform `/platform`

```text
H1 + scope statement
[1 Discover] [2 Verify] [3 Evaluate] [4 Submit] [5 Reconcile/review]
Each section: purpose | inputs/provenance | safety boundary | preview
Trust boundary: MAKH vs data providers vs regulated broker
Paper-first explanation
CTA: Request access | Read risk disclosures
```

## WF-03 — Security `/security`

```text
H1 Security designed around trading consequences
Identity & MFA | Server authorization | Risk/order boundary
Secrets & encryption | Audit evidence | Resilience/reconciliation
Shared responsibility: user / MAKH / identity-data-broker providers
Report a security concern [contact method placeholder]
No guarantee statement + link to status/privacy
```

## WF-04 — Status `/status`

```text
H1 Service status          Overall: [Operational/Degraded/etc.] as of UTC
Public web | Authentication | API | Market data | Broker connectivity*
Incident timeline / scheduled maintenance
*Broker availability may vary by account/provider; portal is authoritative for account state.
[Refresh] [Subscribe placeholder]
```

Narrow: component records stack; status always has icon + text + timestamp. Never use green/red dots alone.

## WF-05 — About `/about`

```text
H1 Built for disciplined self-directed trading
Mission and product principles
Who it is for / who it is not for
Operating boundaries: no custody, no guaranteed outcomes, broker authority
Governance: paper-first, review gates, evidence and audit
[Explore platform] [Request access]
```

## WF-06 — Legal/Risk `/legal/risk`

```text
H1 Trading and product risk disclosures        Version / effective date
On-page contents
Low-priced/low-float volatility and loss
Liquidity, spreads, slippage and partial fills
Halts, gaps and stop limitations
Market/data/evidence and social manipulation risk
Technology, connectivity and broker risk
Paper/backtest limitations; no guarantee
Jurisdiction, tax and professional-advice boundary
[Download/print] [Return]
```

No acceptance checkbox on the public informational route. Versioned acknowledgement occurs in authenticated onboarding where required.

## WF-07 — Privacy `/privacy`

```text
H1 Privacy notice                              Version / effective date
Data categories | purposes | providers | retention | security
Cookies/analytics consent | rights/requests | international processing
Contact/controller placeholders requiring legal completion
[Privacy request placeholder] [Cookie preferences]
```

## WF-08 — Request Access `/request-access`

```text
H1 Request access
What happens next + no account/trading guarantee
[Name] [Email] [Country/region] [Experience range optional]
[Intended use] [Accessibility/contact preference optional]
[ ] I have read the privacy notice (required relationship text)
[Submit request]
Success: reference ID, expected response wording placeholder, security warning
```

Collect no broker credentials, account balances, government IDs or free-form trading secrets. Use honeypot/rate control without inaccessible CAPTCHA.

## WF-09 — Sign In `/sign-in`

```text
H1 Sign in securely
You will continue to the approved identity provider.
[Continue to sign in]
Never share broker passwords with MAKH.
Status | Session/security help | Privacy
```

The redirect requires an explicit user action. Provider errors remain generic and preserve a safe retry/status route.

## Responsive review points

Render and review at 320, 480, 768, 1024 and 1440 CSS px; at 200% text and 400% zoom; with keyboard, reduced motion and forced colors. No route may create horizontal page scrolling or hide risk/legal navigation.
