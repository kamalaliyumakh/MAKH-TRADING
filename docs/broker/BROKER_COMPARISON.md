# MAKH Trading Platform — Broker Candidate Comparison

Last updated: 12 August 2026  
Research basis: official provider pages available on the review date

## Current shortlist

| Candidate / route | Intended model | Eligibility signal | Paper/API signal | Current disposition |
|---|---|---|---|---|
| Interactive Brokers individual + API | Owner connects own brokerage account | Nigeria does not appear in the current available-country list; account eligibility therefore fails under the Nigeria hypothesis unless the confirmed residence/entity produces a different result. | Web/TWS APIs can operate with paper accounts; paper has documented simulation differences. | Hold — technically strong, eligibility not established |
| Alpaca Trading API individual | Owner connects own Alpaca account | Global paper-only signup is documented. Live individual eligibility for the confirmed operator/jurisdiction was not established by public evidence. Published Funding Wallet routing excludes Nigeria. | REST/WebSocket trading and paper environment; client order IDs and trade updates documented. | Conditional paper technical candidate only |
| Tradier retail/API | Owner connects own Tradier account | Tradier's current country page explicitly lists Nigeria among countries whose residents cannot open accounts. | API ecosystem exists, but eligibility gate fails under Nigeria hypothesis. | Eliminate under Nigeria-resident hypothesis |
| Alpaca Broker API partnership | Platform/partner embeds brokerage for end users | Alpaca publishes Nigerian partner activity, but this is a commercial/regulatory B2B model, not proof that MAKH or its owner is approved. | API-first brokerage infrastructure and sandbox/paper capabilities. | Future option only; out of owner-only MVP without change/legal approval |
| DriveWealth partnership | Fintech/entity embeds brokerage | Provider describes B2B service for financial institutions/technology companies with compliance onboarding; requires commercial acceptance. | API/UAT, event notifications and lifecycle support documented. | Future B2B option only; out of owner-only MVP |

## Primary evidence

- IBKR available countries: https://www.interactivebrokers.com/en/accounts/open-account-country-list.php
- IBKR paper account and limitations: https://www.interactivebrokers.com/campus/glossary-terms/paper-trading-account/
- IBKR individual-account eligibility statement: https://www.interactivebrokers.com/en/accounts/individual.php
- IBKR order/callback behavior: https://interactivebrokers.github.io/tws-api/order_submission.html
- Alpaca Trading API and global paper-only access: https://docs.alpaca.markets/us/docs/trading-api
- Alpaca order updates/client order ID: https://docs.alpaca.markets/us/v1.1/docs/working-with-orders
- Alpaca Funding Wallet restrictions: https://alpaca.markets/support/funding-wallets-for-broker-api-2
- Tradier permitted/blocked countries: https://support.tradier.com/kb/guide/en/permitted-and-blocked-countries-CLzSa0D1rf/Steps/4997916
- DriveWealth developer model: https://developer.drivewealth.com/apis/docs/intro

## Capability assessment

| Dimension | IBKR individual API | Alpaca Trading API | Tradier retail API | Embedded B2B routes |
|---|---|---|---|---|
| Nigeria-hypothesis eligibility | Not evidenced; country absent | Paper yes; live unconfirmed | Explicitly unavailable | Possible only through approved partner model |
| Paper environment | Strong, documented limitations | Strong, global signup | Technical sandbox/paper exists; account route blocked | UAT/sandbox subject to commercial onboarding |
| Order lifecycle richness | Strong; duplicates and missing callbacks explicitly documented | Strong REST + trade-update stream | API available; deeper verification deferred after eligibility fail | Provider-specific, commercial diligence required |
| Reconciliation support | Orders, executions, positions/account data; TWS session complexity | REST snapshots + streamed account/order updates | Not scored after gate failure | Generally designed for full lifecycle |
| Server operations | TWS/IB Gateway or applicable Web API session model adds operational complexity | Direct HTTPS/WebSocket is simpler | Direct API | Enterprise integration and operational obligations |
| Paper/live fidelity | Stops/complex orders and fills have known simulation limits | Simulator limitations require test catalog | Not assessed | UAT differs from production by provider |
| MVP fit today | No, until eligibility confirmed | Best technical paper spike; not live-approved | No under Nigeria hypothesis | No; changes owner-only scope and compliance model |

## Important interpretation

An API being technically accessible does not mean a live brokerage account is available, lawful or contractually approved. A provider powering another Nigerian firm's product does not confer eligibility on MAKH. Eligibility must be confirmed for the actual account owner/entity, residence, account type, intended API use and funding route.

