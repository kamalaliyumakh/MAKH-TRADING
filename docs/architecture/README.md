# MAKH Trading Platform — Architecture Package

Status: Baseline v1.0  
Date: 14 October 2026  
WBS evidence: 2.1 — Context, container, component and deployment views

## Contents

- `SYSTEM_ARCHITECTURE.md` — system context, containers, backend/frontend components, runtime flows and deployment topology.
- `SOLUTION_STRUCTURE.md` — proposed repository, Angular workspace and .NET Clean Architecture layout.
- `MODULE_BOUNDARIES.md` — business modules, ownership, dependencies and provider ports.
- `adr/ADR-0001-MODULAR-MONOLITH-CLEAN-ARCHITECTURE.md` — formal architecture decision.
- `adr/ADR-0002-BFF-COOKIE-SESSION.md` — browser session and server-side token-handling decision.
- `adr/ADR-0003-POSTGRESQL-SCHEMA-OWNERSHIP.md` — module data ownership and migration decision.
- `../security/` — threat model, mitigation plan and security test traceability.
- `../data/` — logical model, invariants, retention and migration/recovery strategy.
- `../api/` — OpenAPI, REST conventions, SignalR events and contract tests.
- `adr/ADR-0004-REST-SIGNALR-CONTRACTS.md` — authoritative transport and recovery decision.
- `adr/ADR-0005-AZURE-MANAGED-CONTAINER-PLATFORM.md` — proposed Azure-first hosting validation decision; not yet accepted.
- `ARCHITECTURE_GATE_REVIEW.md` — WBS 2.8 readiness, findings and controlled preparation boundary.
- `ARCHITECTURE_CONSISTENCY_MATRIX.md` — cross-cutting safety/design consistency traceability.
- `ARCHITECTURE_GATE_APPROVAL.md` — authorized Solution Architect acceptance record.
- `../../outputs/architecture-ux-gate/readiness-manifest.json` — executable predecessor-aware gate evidence and SHA-256 inventory.
- `MODULE_BOUNDARIES.md` — executable backend layer/module dependency policy.
- `../design-system/` — approved brand, code-native tokens, component and responsive-state baseline.

## Architecture baseline

The first production release is a modular monolith. Angular public and portal applications consume a versioned ASP.NET Core API and authenticated SignalR hubs. Domain and application logic remain independent of PostgreSQL, Angular, brokers and data providers. PostgreSQL is the authoritative platform store; the broker remains authoritative for accepted orders, executions and live positions.

## Approval scope

This package establishes structure and boundaries. It does not select the identity provider, broker, market-data vendors, hosting platform or final Angular component system. Those decisions remain open and are tracked in `docs/DECISION_LOG.md`.
