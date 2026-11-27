# MAKH Trading Platform — API Contract Test Matrix

Last updated: 12 August 2026

| ID | Contract property | Required verification | Gate |
|---|---|---|---|
| CT-001 | OpenAPI syntax/reference integrity | Parse 3.1 document; resolve every `$ref`; unique operation IDs | C0/C1 |
| CT-002 | Endpoint security declaration | Every non-session endpoint requires cookie auth and documented policy | C1 |
| CT-003 | Resource authorization | Cross-account ID/path/body/filter tests deny without leakage | C1+ |
| CT-004 | CSRF | Every mutation rejects missing/invalid anti-forgery token before side effects | C1 |
| CT-005 | Problem details | All error responses conform; secrets/provider payloads absent | C1+ |
| CT-006 | Idempotency replay | Exact key/hash returns original outcome and one side effect | C5 |
| CT-007 | Idempotency conflict | Same key/different hash returns 409 and no mutation | C5 |
| CT-008 | Concurrent order command | Parallel same intent creates one order/broker client ID | C5 |
| CT-009 | Broker timeout | Returns/persists unknown reconciliation state; no blind retry | C5 |
| CT-010 | Optimistic concurrency | Stale `If-Match` returns 409; no stale mutation | C2/C5 |
| CT-011 | Pagination isolation | Stable cursors; account scope before page/filter; bounded limit | C2+ |
| CT-012 | SignalR authorization | Unauthorized group/account subscription denied and audited | C2+ |
| CT-013 | SignalR duplicate/gap/reorder | Client dedupes and requests REST snapshot on uncertainty | C3–C5 |
| CT-014 | Event privacy | Events contain no secrets, broker raw payload or disallowed content | C2+ |
| CT-015 | Risk binding | Changed proposal/account/mode/price/quantity invalidates decision | C5 |
| CT-016 | Fail-closed dependency state | Stale market/risk/reconciliation/broker uncertainty blocks entry | C5 |
| CT-017 | Live gate | Missing entitlement/MFA/environment allowlist denies live mutation | C5/C7 |
| CT-018 | Generated client drift | Regeneration produces no unreviewed diff; compile passes | C1+ |

No API contract may imply that a successful request guarantees fill price, execution or profit. No feature flag can bypass server authorization, risk approval, idempotency or reconciliation.
