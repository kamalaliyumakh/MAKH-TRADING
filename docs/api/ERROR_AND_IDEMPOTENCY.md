# MAKH Trading Platform — Errors and Idempotency

Last updated: 12 August 2026

## RFC 9457 problem details

All non-success API responses use `application/problem+json` with:

| Field | Meaning |
|---|---|
| `type` | Stable HTTPS URI identifying the problem class |
| `title` | Safe human-readable summary |
| `status` | HTTP status |
| `detail` | Safe instance-specific guidance; no secrets/provider payloads |
| `instance` | Request path or opaque problem instance |
| `code` | Stable machine code |
| `correlationId` | Support/audit correlation identifier |
| `errors` | Optional field validation entries |
| `retryable` | Whether retry may be safe, subject to idempotency and `retryAfter` |
| `retryAfter` | Optional RFC 3339 instant or seconds |

Risk rejection additionally returns `decisionId`, `policyVersion` and safe rule results. It never returns hidden security thresholds or another account’s data.

## Stable problem codes

| Code | Status | Meaning / required client behavior |
|---|---:|---|
| `AUTH_REQUIRED` | 401 | Re-authenticate; do not loop |
| `MFA_STEP_UP_REQUIRED` | 403 | Start approved step-up flow; original mutation did not occur |
| `ACCESS_DENIED` | 403 | Do not retry unchanged request |
| `RESOURCE_NOT_FOUND` | 404 | Resource absent or intentionally undisclosed |
| `VALIDATION_FAILED` | 400 | Correct fields |
| `CONCURRENCY_CONFLICT` | 409 | Refresh authoritative snapshot before new intent |
| `IDEMPOTENCY_CONFLICT` | 409 | Same key used for different canonical request; generate key only for new intent |
| `RISK_REJECTED` | 422 | Review rules; no broker submission occurred |
| `STALE_MARKET_DATA` | 422 | Refresh/wait; new exposure blocked |
| `TRADING_PAUSED` | 422 | Entry blocked by configured scope |
| `BROKER_STATE_UNKNOWN` | 503 | Do not resubmit blindly; poll order/reconciliation state |
| `DEPENDENCY_UNAVAILABLE` | 503 | Retry only when marked safe and with same idempotency key |
| `RATE_LIMITED` | 429 | Respect `Retry-After` with jitter |

## Idempotency protocol

`Idempotency-Key` is mandatory for order proposal, order submission, cancel, replace, position-close proposal, kill-switch and other consequential POST commands. It is a client-generated UUID (or equivalent 128-bit random value), scoped server-side by authenticated subject, account, route and method.

1. Server canonicalizes the validated command and calculates a request hash.
2. It atomically claims the scoped key before side effects.
3. The exact same key and hash returns the original status/body/resource reference, including in-progress state.
4. The same key with a different hash returns `409 IDEMPOTENCY_CONFLICT` and performs no action.
5. Concurrent claims serialize; only one handler may progress.
6. Failed authentication/authorization/CSRF does not reserve a trading idempotency key.
7. A server timeout after possible broker submission remains associated with the same command/order and enters `UnknownPendingReconciliation`; it is never treated as broker rejection.
8. Retrying uses the same key. A new key means a new user intent and requires current authorization/risk evaluation.

Keys for order creation are retained for at least the full order/audit retention relationship; lower-impact command records may use a configured shorter period. The resulting order retains the stable broker client-order ID permanently with its evidence.

## Concurrency interaction

Idempotency prevents duplicate intent; `If-Match` prevents acting on stale mutable state. Cancel or replace requires both where specified. A repeated exact command returns its prior result even if the resource subsequently advances; clients then fetch the current resource snapshot.
