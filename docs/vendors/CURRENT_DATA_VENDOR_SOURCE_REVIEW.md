# WBS 1.4 — Current Data-Rights Official-Source Review Log

Date reviewed: 28 October 2026  
Purpose: identify current primary-source questions for qualified review. These entries do not grant rights, confirm eligibility, select a provider or approve production use.

| ID | Primary source | Discovery observation | Required follow-up |
|---|---|---|---|
| DSR-01 | Nasdaq U.S. Equities and Options Data Policies: https://www.nasdaqtrader.com/content/AdministrationSupport/Policy/USEquitiesandOptionsDataPolicies.pdf | Nasdaq distinguishes display, non-display, distribution and fee-liable automated uses. | Bind the exact product and MAKH use cases to a written licence and reporting schedule. |
| DSR-02 | Nasdaq Display Requirements Policy: https://www.nasdaqtrader.com/content/AdministrationSupport/Policy/DISPLAYREQUIREMENTSPOLICY.pdf | Real-time and delayed displays can require attribution, status indicators and prominent delay messages. | Approve exact UI labels, attribution and delayed-data behavior for each product. |
| DSR-03 | NYSE pricing, policies, contracts and guidelines: https://www.nyse.com/market-data/pricing-policies-contracts-guidelines | NYSE publishes product-specific pricing, contracts, subscriber and reporting materials. | Obtain the current agreement chain for each selected NYSE-origin product. |
| DSR-04 | NYSE Non-Display Use Policy: https://www.nyse.com/publicdocs/nyse/data/Non-Display_Use_Policy.pdf | Automated access, processing and consumption can be non-display use even when data also appears in a UI. | Classify scanner, risk, alert, calculation and order-influencing uses in writing. |
| DSR-05 | SEC Developer Resources: https://www.sec.gov/about/developer-resources | SEC automated access is subject to fair-access behavior, declared automation and request limits. | Implement approved identity, throttling, bulk access and operational monitoring. |
| DSR-06 | SEC EDGAR APIs: https://www.sec.gov/search-filings/edgar-application-programming-interfaces | Public submissions and XBRL APIs have defined coverage, update behavior and bulk archives. | Validate coverage, identifiers, amendment handling and permitted evidence retention. |
| DSR-07 | Massive Market Data Terms: https://massive.com/legal/market-data-terms-of-service | A downstream service can incorporate upstream agreements and restrict business, non-display, derived and redistribution uses by plan/classification. | Treat plan marketing as insufficient; obtain written commercial rights for the confirmed use. |
| DSR-08 | Reddit Data API Terms: https://redditinc.com/policies/data-api-terms | Social API use is purpose-limited and includes retention, deletion, attribution, change and termination duties. | Keep social disabled until commercial use, privacy, deletion and lifecycle controls are approved. |

## Source-control rules

- Recheck the effective terms, incorporated documents, product schedule and fees at decision time.
- Record the exact legal entity, product, account class, upstream source, term version, quote and written clarification.
- Provider documentation and plan pages are discovery inputs, not evidence of commercial or production rights.
- A later provider, product, use, user population, geography or terms change requires re-review.
