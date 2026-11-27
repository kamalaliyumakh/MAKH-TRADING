# MAKH Trading Platform — SignalR Contract

Last updated: 16 September 2026

## Hubs and authorization

- Hub endpoint: `/hubs/trading-v1` using the authenticated BFF session.
- Connection authentication is necessary but not sufficient: every subscription/group operation applies current role, account and resource authorization.
- Server constructs group names; clients cannot supply raw group names or another account identifier to bypass scope.
- Logout/revocation disconnects the session. Entitlement/policy changes cause reauthorization or disconnect.
- Client-to-server trading commands are prohibited on SignalR. All mutations use REST so CSRF, idempotency, authorization and audit behavior is uniform.
- Scanner subscription method: `SubscribeScannerUpdates()`. The server derives the account group from authenticated claims and admits it only after persisted-session revalidation; clients never supply a group or account identifier. Explicit revocation/logout aborts matching local connections, and publication revalidates each persisted session before selecting recipients. New runs persist ownership, sequence and an outbox fact atomically. The background loop remains disabled until reconnect recovery and multi-replica behavior are certified.

## Event envelope

```json
{
  "eventId": "uuid",
  "eventType": "order.updated",
  "schemaVersion": 1,
  "stream": "account:{opaque}:orders",
  "sequence": 1042,
  "occurredAt": "2026-08-12T10:15:30.123Z",
  "publishedAt": "2026-08-12T10:15:30.456Z",
  "correlationId": "uuid",
  "accountMode": "Paper",
  "payload": {}
}
```

`sequence` is monotonic within a named stream, not globally. Events are at-least-once, may be duplicated and are transport deltas—not the system of record.

## Event catalogue

| Event | Stream | Minimum payload | Client behavior |
|---|---|---|---|
| `market.status.updated` | public-auth market | session, provider health, asOf | replace by version; display freshness |
| `quote.updated` | security quote | securityId, bid/ask/last, source/event/receipt time, quality | apply in sequence; never infer risk approval |
| `scanner.updated` | user/account scanner | scannerVersion, runId, upserts/removals, asOf | apply delta; snapshot after gap |
| `evidence.updated` | security evidence | securityId, evidenceId, trust/verification state, publishedAt | refresh workspace evidence |
| `order.updated` | account orders | orderId, state, filledQuantity, remainingQuantity, version, brokerTime | merge only newer version; snapshot after gap |
| `position.updated` | account positions | positionId, securityId, quantity, P&L snapshot, protection/reconciliation state, version | replace projection; broker reconciliation remains authoritative |
| `risk.updated` | account risk | policyVersion, capacity, pauses, breach, health, version | immediately disable invalid UI actions; server still authoritative |
| `alert.created` | user/account alerts | alertId, type, severity, subject, occurredAt | display/dedupe by alertId |
| `system.notice` | authorized scope | code, severity, message, effective/expiry | display; no hidden trading state |

Payloads contain no tokens, secrets, full broker payloads, unrestricted personal data or unlicensed raw content.

## Recovery protocol

1. Client stores last applied sequence per stream only in runtime/session state.
2. Duplicate event (`sequence <= lastApplied`) is ignored after event/version validation.
3. Gap (`sequence > lastApplied + 1`), reconnect, authorization change or client uncertainty marks the view stale.
4. Client stops applying dependent deltas and calls the documented REST snapshot endpoint.
5. Snapshot returns state plus `streamSequence`/`asOf`; client replaces local state and resumes after that sequence.
6. If snapshot or authorization fails, the UI remains degraded/read-only as appropriate; it never fabricates state.

The Angular adapter is disabled by default. When enabled in an approved environment, it uses authenticated cookies, invokes only `SubscribeScannerUpdates`, and performs snapshot replacement on initial connection and every reconnect before accepting the stream as current.

The server dispatcher is independently disabled by default through `Realtime:OutboxDispatcher:Enabled`. Enabling a client does not enable publication, and enabling publication does not grant any trading authority.

## Compatibility

Consumers ignore unknown optional fields. Breaking payload semantics require a new `schemaVersion` and parallel compatibility window. Removal/renaming without a version is prohibited. Contract tests replay duplicates, gaps, reordering, reconnects and entitlement revocation.
