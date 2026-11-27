# MAKH Trading Platform — Data and Evidence Vendor Requirements

Last updated: 12 August 2026  
Status: Evaluation baseline; no vendor selected or licensed

## Mandatory requirements

| ID | Requirement | Required evidence | Failure effect |
|---|---|---|---|
| DVR-01 | Nasdaq/NYSE common-share universe can be identified without OTC leakage. | security master, venue/MIC and instrument-type mapping tests | Scanner blocked |
| DVR-02 | Current trades, NBBO bid/ask and sizes include source/exchange, conditions and event timestamps. | stream/replay samples and field contract | Trading views blocked |
| DVR-03 | Historical trades/bars support time-of-day RVOL and 100%–600% gain calculations. | sufficient history, session rules and reproducible replay | Scanner blocked |
| DVR-04 | Corrections, cancels, late/out-of-sequence events, splits and symbol changes are represented. | correction/corporate-action documentation and tests | Certification blocked |
| DVR-05 | Market session, halt and LULD status is available or sourced independently. | event/status coverage tests | New exposure blocked when unknown |
| DVR-06 | Public-float value includes definition, source/as-of date, frequency and revision behavior. | data dictionary and sampled issuer reconciliation | Float filter cannot qualify candidates |
| DVR-07 | News/evidence includes stable ID, publisher/source, published/updated times, symbol/entity links and original URL. | API contract and provenance sample | Catalyst cannot be verified |
| DVR-08 | SEC/issuer/exchange evidence remains distinguishable from news and social attention. | trust-class mapping and UI/API tests | Evidence gate blocked |
| DVR-09 | Contract expressly permits server use, calculation, display, caching, audit retention and any derived metrics. | signed licence/use schedule | Production blocked |
| DVR-10 | Redistribution and third-party/user access are either licensed or technically prevented. | entitlement design and legal approval | Public/multi-user display blocked |
| DVR-11 | Rate limits, entitlements, outage, backfill, correction and deprecation processes are documented. | operational SLA/support plan | Promotion blocked |
| DVR-12 | Social data is obtained only by an approved API/agreement and can be deleted or refreshed as required. | platform agreement, privacy/retention review | Social adapter disabled |
| DVR-13 | Provider payloads can be normalized without storing prohibited raw content. | minimization mapping and retention schedule | Storage blocked |
| DVR-14 | Commercial terms and usage metrics remain viable for expected symbols, streams and users. | quote, unit model and load estimate | Selection deferred |

## Metric definitions requiring approval

| ID | Metric | Controlled definition |
|---|---|---|
| DVM-01 | Price | executable NBBO context plus last eligible trade; never last trade alone for order readiness |
| DVM-02 | Intraday gain | current eligible price versus approved reference close, adjusted consistently for corporate actions |
| DVM-03 | RVOL | cumulative eligible volume to current session time divided by historical mean cumulative volume at the same normalized session time |
| DVM-04 | Public float | vendor-defined freely tradable shares; not interchangeable with shares outstanding |
| DVM-05 | Spread | ask minus bid and percentage/midpoint basis from a fresh valid NBBO |
| DVM-06 | Dollar volume/liquidity | eligible volume multiplied by price with session/window and calculation version retained |
| DVM-07 | Catalyst | verified issuer, SEC, exchange or approved news evidence; social cannot independently satisfy it |
| DVM-08 | Social attention | limited metadata/statistic with source, window, method, confidence and manipulation warning |

