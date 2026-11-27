# ADR-0003 — Use PostgreSQL Schema-per-Module Ownership

Date: 12 August 2026  
Status: Accepted

## Context

The modular monolith requires strong ownership without distributed transactions. Risk, order and audit data need local atomicity and strict write boundaries, while provider volume and reporting must not turn the database into an ungoverned shared model.

## Decision

- Use one PostgreSQL database initially, with a schema for each business module and a shared `platform` schema for outbox/inbox/idempotency/leases.
- Each module maps through its own EF Core `DbContext` and writes only its schema.
- Cross-module behavior uses application contracts, domain identifiers and explicit read models, not direct foreign-table mutation.
- PostgreSQL constraints enforce stable identity, idempotency and high-value invariants; application logic enforces workflow and authorization.
- Risk decisions, rule results, order events, executions and audit events are append-only for the runtime role. Corrections are new facts.
- Migrations are centrally ordered and deployed by a separate identity using expand/migrate/contract.

## Consequences

Local transactions can atomically persist risk/order facts and outbox events. Ownership and future extraction boundaries remain visible. The team must govern cross-schema references carefully, maintain multiple mappings and create deliberate read models for reporting. A single database remains a shared availability boundary until measured scaling justifies extraction.

## Rejected alternatives

- One unrestricted `public` schema: weak ownership and accidental coupling.
- Database per module from day one: unnecessary distributed consistency and operational complexity.
- Event store as the only source of truth: high implementation/operational cost before event-sourcing needs are proven.

## Verification

Architecture tests validate context ownership; integration tests validate runtime permissions, immutable tables, unique idempotency/execution keys, transaction/outbox atomicity and clean migration from empty/prior versions.
