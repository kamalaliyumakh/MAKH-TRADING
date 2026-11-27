# MAKH Trading Platform — Data Vendor Decision Record

Decision ID: DEC-DATA-001  
Date: 13 October 2026  
Status: Pending — technical shortlist established

## Provisional shortlist

- Massive for U.S. SIP market/reference data technical proof-of-concept.
- Financial Modeling Prep for float technical proof-of-concept, subject to definition and commercial display/redistribution agreement.
- SEC EDGAR as the preferred authoritative filing source.
- Finnhub and FMP as news/press-release commercial candidates.
- No social provider enabled until explicit commercial rights, privacy controls and deletion/retention terms are approved.

## Approval conditions

| Condition | Owner | Status |
|---|---|---|
| Actual use model and users confirmed | Product Owner | Pending |
| Commercial quotes and total-cost model approved | Sponsor | Pending |
| Upstream/display/non-display/derived/retention rights approved | Legal / Data owner | Pending |
| Data definitions and PQA-01–18 pass | Data / QA | Pending |
| Security, credential and cross-border review approved | Security / Privacy | Pending |
| Provider support/SLA and recovery accepted | Operations | Pending |
| Scanner and provenance gate signed | Product Owner | Pending |

## Local readiness verification

Run `node eng/verify-data-vendor-discovery-readiness.mjs` to validate the provider-discovery package and write `outputs/data-vendor-discovery-readiness/readiness-manifest.json`.

The verifier checks DVR-01–DVR-14, DVM-01–DVM-08, eight capability areas, five evidence notes, six provisional recommendations, VDD-01–VDD-20, PQA-01–PQA-18, seven Pending approval conditions, the social-disabled boundary, unavailable scope/legal predecessors and the no-purchase/no-production-authority boundary. It hashes all eight evidence inputs and fails closed if an inventory or authority boundary changes.

Passing local verification means **Prepared / Rights and Certification Pending** only. It does not select or contact a provider, approve a licence, authorize a subscription or credential, execute provider tests, enable social ingestion, grant production entitlements, permit publication, or create trading authority.

No subscription, credential, external contact or production entitlement is authorized by this record.

