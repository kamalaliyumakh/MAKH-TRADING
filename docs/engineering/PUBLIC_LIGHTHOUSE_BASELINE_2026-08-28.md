# Public Lighthouse Baseline

Date: 28 August 2026  
WBS: 4.5  
Result: Local production-artifact checkpoint passed

## Scope

- Pinned Lighthouse 13.4.1 and added a deterministic desktop audit for `/`, `/platform` and `/security`.
- Audits run against a dedicated read-only server for the prerendered production browser artifact, not the Angular development server.
- The artifact server enforces path containment, MIME types, immutable non-HTML caching and baseline CSP, referrer, content-type and frame headers.
- Thresholds fail the check below 0.85 performance, 0.95 accessibility, 0.90 best practices or 0.90 SEO.
- Hosted CI retains the raw JSON reports, summary and console log.

## Results

| Route       | Performance | Accessibility | Best practices | SEO  | LCP       | CLS | TBT |
| ----------- | ----------- | ------------- | -------------- | ---- | --------- | --- | --- |
| `/`         | 0.95        | 1.00          | 0.92           | 1.00 | 1,523 ms  | 0   | 0 ms |
| `/platform` | 0.94        | 1.00          | 0.92           | 1.00 | 1,567 ms  | 0   | 0 ms |
| `/security` | 0.95        | 1.00          | 0.92           | 1.00 | 1,524 ms  | 0   | 0 ms |

All thresholds passed. The separate nine-route axe, forced-colors/reduced-motion, metadata and bundle-budget gates also pass against the production artifact server.

## Boundary

These are local Lighthouse lab observations from one machine and three representative indexable routes. They are not hosted measurements, field Core Web Vitals, a service-level objective or a production performance guarantee. Approved hosting, network/security configuration, repeated hosted runs and accountable QA/Operations acceptance remain required.

## Pending remediation

On 29 August 2026, the deployed logo assets were resized to their required display density, the public brand-link accessible name was aligned with its visible text, and the test-only artifact server CSP that blocked Angular hydration was removed. A fresh Angular test/build and Lighthouse rerun have not completed because local dependency reads remained abnormally slow. The results above therefore remain the latest accepted baseline; no improved score or WBS increase is claimed yet.

Update, 30 August: verification has now completed. See `PUBLIC_LIGHTHOUSE_REMEDIATION_2026-08-30.md` for the passing preloaded-artifact audit, two retained failed disk-served runs and measurement limitations. This document preserves the original 28 August baseline; WBS 4.5 remains 91%.
