# MAKH Trading Platform — REST Conventions

Last updated: 12 August 2026

## Contract and versioning

- Base path is `/api/v1`; breaking changes require a new major path and compatibility plan.
- `openapi.yaml` is reviewed in source control and generates Angular transport types/clients.
- Additive optional fields may ship within a major version. Renames, removals, semantic changes, enum narrowing and new mandatory fields are breaking.
- Dates/times use RFC 3339 UTC. IDs are opaque UUID strings. Money uses decimal strings plus ISO currency to avoid binary floating-point loss.
- JSON uses camelCase. Unknown request properties are rejected on high-risk commands; clients tolerate unknown response properties.
- Every response includes `X-Correlation-ID`; clients may send a valid correlation ID but the server sanitizes/creates it.

## Authentication and authorization

- Browser calls use the BFF opaque secure cookie. Mutations require an anti-forgery token header.
- Every operation declares an authorization policy and resource/account scope; default is deny.
- Account identifiers in paths/bodies select a resource but never grant access. Entitlement and live mode are derived server-side.
- Sensitive commands require fresh MFA and may return a step-up problem without changing state.
- Unauthorized (`401`) and forbidden/not-owned resources (`403` or policy-selected non-disclosing `404`) do not expose object existence or another account.

## Commands, queries and status codes

| Pattern | Success | Notes |
|---|---|---|
| `GET` collection/item | `200` | Snapshot is authoritative at its `asOf`/version |
| Create proposal/resource | `201` | `Location` and representation returned |
| Accepted asynchronous command | `202` | Returns command/resource state to poll |
| Idempotent update | `200` | Returns current representation |
| Delete list item | `204` | Only for non-evidentiary user curation |
| Validation/risk rejection | `422` | Structured violations/rule results; no broker call |
| Stale version | `409` | Current version reference returned where safe |
| Rate limit | `429` | `Retry-After`; clients add jitter |
| Dependency uncertainty | `503` | New exposure fails closed; safe retry metadata only |

Trading commands do not use HTTP success to imply broker execution. The representation exposes canonical order state such as `PendingSubmit`, `Accepted`, `PartiallyFilled`, `Filled`, `CancelPending`, `Cancelled`, `Rejected` or `UnknownPendingReconciliation`.

## Pagination, filtering and sorting

- Collections use opaque cursor pagination: `limit` (default 50, maximum 200), `cursor`, stable documented sort and `nextCursor`.
- Server-side account scope is applied before filtering/paging.
- Date ranges are bounded; exports handle larger authorized ranges asynchronously.
- Arbitrary SQL-like filter/sort input is prohibited. Each endpoint allowlists filter and sort fields.

## Concurrency and caching

- Mutable resources expose an opaque `ETag`; updates/cancels/replaces that depend on a version require `If-Match`.
- High-risk POST commands use `Idempotency-Key` and canonical request hashing as defined in `ERROR_AND_IDEMPOTENCY.md`.
- Sensitive authenticated responses use `Cache-Control: no-store` unless a reviewed exception exists.
- Market/scanner snapshots may use short private caching but freshness timestamps remain explicit and never extend a risk-decision validity window.

## Account mode and safety

- Every trading response includes explicit `accountMode` (`Paper` or `Live`).
- Live submission requires live entitlement, fresh MFA, live environment/account allowlist, risk approval, healthy reconciliation and inactive entry block.
- Scanner/evidence endpoints cannot produce executable broker authority.
- A 100%–600% gain or social signal is informational/risk evidence only.
