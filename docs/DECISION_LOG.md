# MAKH Trading Platform — Decision Log

Last updated: 12 August 2026

| ID | Date | Decision | Status | Rationale / Consequence |
|---|---|---|---|---|
| ADR-000 | 2026-08-11 | Use `/Users/tmkaliyu/Documents/ChatGPT/MAKH Trading` as the dedicated trading-platform repository. | Accepted | Prevents mixing the project with the unrelated, dirty MAKHMS HR/logistics/SaaS repository. |
| ADR-001 | 2026-08-11 | Use Angular 22 for the public site and authenticated portal. | Accepted | Current supported Angular baseline at specification date. |
| ADR-002 | 2026-08-11 | Use .NET 10 LTS and ASP.NET Core with Clean Architecture. | Accepted | Supported LTS baseline and separation of domain logic from infrastructure. |
| ADR-003 | 2026-08-11 | Use PostgreSQL 18 on the current supported minor release. | Accepted | Current stable PostgreSQL baseline with five-year major support policy. |
| ADR-004 | 2026-08-12 | Begin as a modular monolith with Clean Architecture and clear extraction boundaries. | Accepted | Reduces distributed-system risk while preserving scalability options. Detailed decision: `docs/architecture/adr/ADR-0001-MODULAR-MONOLITH-CLEAN-ARCHITECTURE.md`. |
| ADR-005 | 2026-08-11 | Deliver paper trading before any controlled-live capability. | Accepted | Live activation requires paper, operations, security, compliance and explicit user-authorization gates. |
| ADR-006 | 2026-08-12 | Treat PostgreSQL as the authoritative platform store and the broker as authoritative for accepted orders, executions, live positions and buying power. | Accepted | Requires idempotent event processing and continuous broker reconciliation. |
| ADR-007 | 2026-08-12 | Use REST/OpenAPI for recoverable application operations and SignalR only for authorized real-time deltas. | Accepted | REST snapshot recovery resolves disconnects and sequence gaps; real-time delivery is not authoritative state. |
| ADR-008 | 2026-08-12 | Use an ASP.NET Core BFF with server-side identity tokens and an opaque secure cookie session for Angular. | Accepted | Keeps reusable tokens out of the browser and centralizes expiry, revocation, MFA freshness, CSRF and resource authorization. Detailed decision: `docs/architecture/adr/ADR-0002-BFF-COOKIE-SESSION.md`. |
| ADR-009 | 2026-08-12 | Use one PostgreSQL database initially with schema-per-module ownership, module DbContexts and centrally ordered migrations. | Accepted | Preserves local risk/order atomicity and module boundaries without premature distributed transactions. Detailed decision: `docs/architecture/adr/ADR-0003-POSTGRESQL-SCHEMA-OWNERSHIP.md`. |
| ADR-010 | 2026-08-12 | Use versioned REST/OpenAPI for snapshots and all commands; use authenticated SignalR only for recoverable sequenced deltas. | Accepted | Maintains one authorization/idempotency/audit command path and makes disconnect/gap recovery explicit. Detailed decision: `docs/architecture/adr/ADR-0004-REST-SIGNALR-CONTRACTS.md`. |
| DS-001 | 2026-08-12 | Adopt the “calm precision under pressure” brand direction and the code-native light operational design-system baseline. | Accepted | Prioritizes safety, evidence, mode and uncertainty while avoiding urgency/casino patterns. Detailed baseline: `docs/design-system/`. |

## Decisions still required

| ID | Decision | Needed by |
|---|---|---|
| DEC-001A | Identity provider supporting required jurisdiction, code+PKCE, MFA/step-up and revocation behavior | Before identity implementation |
| DEC-002 | Broker supporting user jurisdiction, paper/live API and required securities/order types | Before broker adapter implementation |
| DEC-003 | Market, float, news/filing and permitted social-data providers | Before scanner integration implementation |
| DEC-004 | Hosting platform, regions, secrets, monitoring and backup services | Before environment provisioning |
| DEC-005 | Brand and Angular component/design system | Before public-web implementation |
