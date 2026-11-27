# MAKH Trading Platform — Provider Provenance and Quality Acceptance

Last updated: 12 August 2026  
Status: Planned; no provider tests executed

| Test ID | Scenario | Required result |
|---|---|---|
| PQA-01 | Map listed common share and symbol history | Stable security identity; OTC/non-common instruments excluded |
| PQA-02 | Replay trades with sale conditions | Eligible price/volume reproduces approved bars |
| PQA-03 | Reconcile stream to REST/bulk recovery | No unexplained persistent gaps or duplication |
| PQA-04 | Late/corrected/cancelled trade | Corrective fact retained; dependent metrics recomputed/versioned |
| PQA-05 | Split/symbol change | Adjusted/unadjusted series and identity remain unambiguous |
| PQA-06 | Quote becomes stale/crossed/locked | Quality state visible; unsafe entries blocked by policy |
| PQA-07 | LULD/halt/reopen event | Trading state and freshness propagate without optimistic readiness |
| PQA-08 | Time-of-day RVOL replay | Same source window/version yields reproducible result |
| PQA-09 | Extreme gain candidate | Reference close/corporate action validated; risk flag only |
| PQA-10 | Float comparison across sources/filing | Definition/date/difference retained; no false qualification |
| PQA-11 | New SEC filing dissemination | Stable accession/CIK, timestamps, form and original URL recorded |
| PQA-12 | Filing correction/amendment | Original and amendment linked; trust/current-state rules applied |
| PQA-13 | Duplicate news across publishers | Canonical grouping preserves every source and timestamp |
| PQA-14 | Deleted/corrected licensed content | Retention/deletion rules applied while permitted provenance remains |
| PQA-15 | Social spike without verified source | Attention flag only; catalyst remains unverified |
| PQA-16 | Provider rate limit/outage | Backoff/health state; no fabricated freshness; controlled recovery |
| PQA-17 | Licence entitlement removed | Feed/display stops and retained data follows contract disposition |
| PQA-18 | Audit reconstruction | Source, observation, payload hash, normalization and calculation versions trace to decision |

