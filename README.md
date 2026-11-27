# MAKH Trading Platform

Risk-controlled low-float momentum stock discovery and self-directed trading platform.

## Approved project documents

- `MAKH_Trading_Platform_BRD_PRD.docx` — business and product requirements.
- `MAKH_Trading_Platform_FSD.docx` — functional and technical specification.
- `outputs/makh-wbs/MAKH_Trading_Platform_WBS.xlsx` — project WBS, schedule, stage gates, RACI and RAID log.
- `MAKH_Trading_Codex_Execution_Plan.md` — implementation waves and completion protocol.
- `docs/PROJECT_MEMORY.md` — durable project context and operating decisions.
- `docs/DEVELOPMENT_PROGRESS.md` — completed work, evidence and current next step.
- `docs/DECISION_LOG.md` — material architecture, product and delivery decisions.

## Technology baseline

- Angular 22 for the public landing application and authenticated portal.
- .NET 10 LTS with ASP.NET Core and Clean Architecture for backend services.
- PostgreSQL 18 on the current supported minor release.
- Paper trading before any separately authorized controlled-live pilot.

## Current state

Project controls and architecture discovery are in progress. WBS 3.1–3.7 provide the local engineering foundation. WBS 4.1–4.2 provide the tested public shell and five core content routes. WBS 4.3 now adds versioned public risk and privacy drafts without public consent capture. Foundation, UX, qualified legal/privacy and human acceptance gates remain open, so this is local preparation only. No public deployment, analytics, external identity connection, hosted database, broker, market-data, monitoring, cloud resource, production or live-trading integration is configured.

## Foundation verification

Use Node 24.15.0 and .NET SDK 10.0.400, then run:

```bash
eng/verify-foundation.sh
```

See `docs/engineering/ENGINEERING_STANDARDS.md` for repository and quality rules.

DevSecOps policy and secret preflight checks are also available independently:

```bash
pnpm check:devsecops
pnpm scan:secrets
```

The GitHub workflows define pull-request quality/security gates and release-only SBOM/signing evidence. They do not deploy or authorize live trading.
