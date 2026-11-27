# WBS 1.4 — Current Data-Vendor Decision Register

Date: 28 October 2026  
Decision: **Pending — no provider selected, contacted, purchased or authorized**

## Required decisions

| ID | Decision | Accountable role | State | Evidence state |
|---|---|---|---|---|
| DDD-01 | Confirm owner/entity, jurisdiction, users, account class and intended uses | Sponsor / Legal | Pending | Pending |
| DDD-02 | Approve product/feed and upstream-source coverage | Data Owner | Pending | Pending |
| DDD-03 | Approve display, non-display, automated and derived-use rights | Legal / Data | Pending | Pending |
| DDD-04 | Approve storage, retention, backup, deletion and audit rights | Legal / Privacy / Data | Pending | Pending |
| DDD-05 | Approve redistribution, public display, alerts, exports and attribution | Legal / Product | Pending | Pending |
| DDD-06 | Approve entitlements, classification, reporting, fees and total cost | Finance / Legal / Data | Pending | Pending |
| DDD-07 | Accept security, reliability, corrections, recovery and support | Security / Operations | Pending | Pending |
| DDD-08 | Accept PQA-01–PQA-18 and provider certification | Product / Data / Risk / QA | Pending | Pending |
| DDD-09 | Authorize any provider contact, trial, subscription or credential activity | Sponsor | Pending | Pending |
| DDD-10 | Make separate production-entitlement and downstream release decision | Sponsor and gate owners | Pending | Pending |

## Decision rules

- Every decision binds one immutable candidate entity, product/feed, upstream source, term version, account class, geography, use matrix, entitlement schedule, quote and evidence manifest.
- A candidate, product, source, terms, use, user population, account class or geography change requires a new decision.
- Technical API access, trial data, payment or a successful quality test cannot create missing rights.
- Codex may prepare comparisons and verify evidence structure. Codex cannot select/contact a provider, accept terms, purchase a service, create credentials, enable entitlements, ingest or publish external data, or authorize production/paper/live trading.
