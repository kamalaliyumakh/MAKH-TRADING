# MAKH Trading Platform — Public Copy Deck

Last updated: 12 August 2026  
Status: Provisional — requires legal, privacy and risk review before publication

## CP-01 — Home

**Eyebrow:** Risk-controlled trading workspace

**H1:** Make fast-moving market decisions with evidence, limits and accountability.

**Intro:** MAKH brings candidate discovery, catalyst evidence, pre-trade risk checks, broker order state and post-trade review into one self-directed workflow.

**Primary CTA:** Request access  
**Secondary CTA:** Explore the platform

**Principle:** A scanner can identify attention. It cannot authorize a trade. MAKH requires explicit user intent and centralized risk approval before an eligible order can be sent to a connected broker.

**Workflow headings:** Discover candidates. Verify the evidence. Evaluate the risk. Submit through a broker. Reconcile and review.

**Risk disclosure:** Trading low-priced and low-float securities can result in rapid and substantial losses. Wide spreads, thin liquidity, price gaps, volatility halts, partial fills and technology failures can make entry or exit difficult. A stop does not guarantee its trigger price. A large price gain—including a 100%–600% move—is an elevated-risk signal, not a recommendation or promise of further gain.

## CP-02 — Platform

**H1:** One accountable path from market signal to broker outcome.

**Intro:** MAKH separates discovery, evidence, risk authority and execution so that no single signal—or social-media claim—becomes an order by itself.

**Discover:** Screen an approved market universe using transparent, versioned criteria such as price, time-normalized relative volume, public float, spread and liquidity. Defaults are configurable and must be validated against reliable data.

**Verify:** Review issuer communications, regulatory filings and approved news sources with timestamps and provenance. Social attention is presented separately and cannot confirm a catalyst on its own.

**Evaluate:** Build an order proposal with an entry, quantity and exit plan. The risk engine evaluates account, exposure, liquidity, loss and system-health limits using the current policy version.

**Execute:** An approved proposal may be submitted to a supported regulated broker. The broker—not MAKH—is authoritative for accepted orders, executions, live positions and buying power.

**Reconcile and review:** Follow acknowledgements, partial fills, cancellations, protection and mismatches. Preserve the thesis, evidence, decision and outcome for later review.

**Paper-first:** MAKH is designed to prove workflows in paper trading before any separately authorized, limited-capital live use.

## CP-03 — Security

**H1:** Security controls follow the consequence of the action.

**Intro:** Trading actions require more than a signed-in screen. MAKH combines server-side authorization, step-up authentication for sensitive actions, centralized risk approval, idempotent order handling and broker reconciliation.

**Identity and access:** Authentication uses an approved identity provider. Sensitive actions such as live trading, risk-policy changes and emergency controls require appropriate permission and fresh multi-factor authentication.

**Credentials:** Broker and provider secrets are handled through managed secret controls. MAKH does not ask users to enter raw broker passwords where approved OAuth or equivalent provider authorization is available.

**Orders:** Repeated requests use stable idempotency controls. A broker timeout is treated as unknown until reconciled—not as permission to submit a duplicate order.

**Data and audit:** Sensitive data is minimized and protected in transit and at rest. Material identity, policy, risk, order and administrative actions produce traceable audit evidence.

**Shared responsibility:** No system can eliminate market, device, provider or operational risk. Users must protect their devices and sessions and review account activity. Provider and hosting controls remain subject to their own terms and availability.

**Security contact:** Security reporting details will be published before public launch. Do not send passwords, tokens or broker credentials in a report.

## CP-04 — Status

**H1:** MAKH service status

**Intro:** View public availability for MAKH services. Account-specific broker, market-data and reconciliation state appears only inside the authorized portal.

**Operational:** No known public service disruption.  
**Degraded:** A component is responding with reduced performance or freshness.  
**Partial outage:** Some users or functions may be unavailable.  
**Major outage:** Critical public or authenticated functionality is unavailable.  
**Maintenance:** Planned work is in progress during the displayed window.

**Boundary note:** Public status does not confirm that a broker accepted, cancelled or filled an order. The connected broker and reconciled portal record remain authoritative for account activity.

## CP-05 — About

**H1:** Built for disciplined self-directed trading.

**Body:** MAKH is being developed as a risk-controlled workspace for people who make their own trading decisions. The product combines market-data screening, evidence provenance, explicit risk evaluation, broker integration and audit-ready review.

**Who it is for:** Authorized account owners using supported brokers and data services within an approved operating jurisdiction.

**Who it is not for:** MAKH is not a guarantee of performance, a substitute for professional legal, tax or investment advice, or a service for managing third-party funds without the required legal and regulatory authority.

**How we build:** Paper first. Fail closed when critical truth is unavailable. Keep risk authority centralized. Reconcile broker state. Preserve evidence. Require explicit approval before controlled live use.

## CP-06 — Legal/Risk

**H1:** Trading and product risk disclosures

**Opening:** Read these disclosures before using MAKH. They summarize important risks but cannot cover every market, legal, tax, technology or personal circumstance. Obtain qualified professional advice where appropriate.

**Market loss:** Trading can result in partial or total loss of capital. Low-priced and low-float securities may move rapidly and can be more vulnerable to volatility, illiquidity and manipulation.

**Liquidity and execution:** Displayed prices may not be executable. Spreads can widen, depth can disappear, and orders can be rejected or partially filled. Marketable-limit orders limit price but do not guarantee execution.

**Stops, gaps and halts:** Stop and protective orders do not guarantee an exit price. Gaps, trading halts, thin liquidity, provider outages and broker limitations may cause losses larger than planned.

**Data and evidence:** Market, reference, news, filing and social data may be delayed, incomplete, corrected or unavailable. Social activity and large price increases are not reliable proof of value or future performance.

**Technology and broker:** Network, software, identity, market-data and broker services can fail. MAKH may block new entries when critical state is stale or unknown. The broker is authoritative for accepted orders, executions, live positions and buying power.

**Paper and historical results:** Paper trading, simulations and historical analysis do not reproduce all live-market conditions and do not predict or guarantee future results.

**Self-directed use:** You remain responsible for your decisions, account security, broker agreements, taxes and compliance with laws applicable to you. MAKH does not custody your funds or securities.

**No guarantee:** MAKH does not promise profits, loss prevention, uninterrupted service, execution at a displayed price or that any strategy will achieve a particular result.

**Legal placeholders:** Governing entity, jurisdiction, eligibility, limitation-of-liability language, dispute terms and final effective/version dates require qualified legal approval before publication.

## CP-07 — Privacy

**H1:** Privacy notice

**Opening:** This notice explains how MAKH expects to handle personal and account-related information. It is a product-design draft and will be replaced by an approved notice before public launch.

**Data we may process:** Identity/contact details, consents, session/security events, connected-account references, trading activity required to provide the service, preferences, support communications and product diagnostics. Broker passwords should not be collected.

**Why:** To authenticate and authorize users, provide market/trading workflows, enforce risk controls, reconcile broker state, protect the service, meet approved legal obligations and improve permitted product functionality.

**Sharing:** Data may be processed by approved identity, hosting, market-data, evidence, broker, communications and security providers as necessary and contractually permitted. MAKH does not sell broker credentials or trading instructions.

**Retention:** Retention depends on record type, legal obligations, security needs and provider licences. Trading, risk and audit evidence may be retained longer than ordinary product telemetry. Approved periods will be published before launch.

**Your choices and rights:** Depending on jurisdiction, users may have access, correction, export, restriction, objection or deletion rights. Some trading/audit records may need to be preserved. Contact/controller and request procedures require legal completion.

**Analytics and cookies:** Nonessential analytics require an approved consent basis and cannot capture broker credentials, account values, order content or sensitive portal data.

## CP-08 — Request Access

**H1:** Request access to MAKH

**Intro:** Tell us how to contact you and your general intended use. A request does not create a brokerage account, guarantee access or authorize live trading.

**Privacy helper:** Do not submit passwords, broker credentials, account numbers, government identifiers or confidential trading instructions.

**Consent label:** I have read the provisional privacy notice and understand how this request will be handled.

**Submit:** Submit access request

**Success:** Request received. Keep reference **{referenceId}** for follow-up. We will not ask for your broker password by email. Response timing and contact details will be finalized before launch.

## CP-09 — Sign In

**H1:** Sign in securely

**Intro:** Continue to the approved identity provider. MAKH does not ask for your broker password on this page.

**Action:** Continue to sign in

**Support:** If you did not expect to sign in, close this page. Check service status or use the approved support channel before sharing account information.
