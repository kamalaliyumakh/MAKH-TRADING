# ADR-0004 — Use REST as Authoritative Transport and SignalR for Recoverable Deltas

Date: 12 August 2026  
Status: Accepted

## Decision

- Use versioned REST/OpenAPI for queries, snapshots and every state-changing command.
- Generate Angular transport clients/types from the reviewed OpenAPI contract.
- Use authenticated SignalR only for authorized, versioned, sequenced deltas.
- SignalR never accepts trading commands and never becomes authoritative state.
- On reconnect, sequence gap or uncertainty, clients recover through REST snapshots.
- Use RFC 9457 problem details, opaque cursor pagination, ETags/`If-Match` for state-dependent mutation and scoped `Idempotency-Key` for consequential commands.

## Rationale and consequences

One command path centralizes CSRF, authorization, validation, idempotency and audit controls. Real-time UX remains responsive without requiring exactly-once delivery. Clients must implement snapshot recovery and the server must maintain stream sequences/versioned payloads. Contract generation and compatibility checks become CI gates.

## Rejected alternatives

- Trading commands over SignalR: creates a second high-risk authorization/idempotency path.
- WebSocket state as the source of truth: disconnects and sequence gaps make recovery unsafe.
- Unversioned ad hoc JSON clients: permits silent drift between Angular and .NET.
