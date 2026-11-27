# Environment Foundation Acceptance

Date: 15 October 2026  
WBS: 3.7  
Owner: DevOps Lead  
Status: In progress — 95%

## Executable readiness decision

`node eng/verify-environment-foundation-readiness.mjs` validates this acceptance matrix against the three environment contracts, Azure candidate topology, telemetry implementation, alert baseline, recovery runbook and current DevSecOps predecessor. It emits `outputs/environment-foundation-readiness/readiness-manifest.json` with SHA-256 artifact hashes and an explicit `Implementation Ready / Acceptance Pending` decision.

The 95% maturity reflects complete local environment design and policy validation. It does not represent compiled Bicep, cloud provisioning, provider guarantees, private-connectivity verification, telemetry delivery, a timed recovery exercise, human approval, production authority or trading authority.

## Evidence

| Criterion | Result |
|---|---|
| Dev/test/staging isolation manifests | Pass; synthetic-only and entry-locked |
| PostgreSQL 18/PITR/retention policy | Pass structurally; provider exercise pending |
| Private Azure candidate topology | Defined; hosting/region/network approval pending |
| Managed identity and RBAC Key Vault boundary | Defined; role/access proof pending |
| API/Worker OpenTelemetry instrumentation | Pass; optional OTLP exporter and resource tags |
| Correlation propagation | Two new tests pass |
| SLO and alert baseline | Defined; load baseline/on-call approval pending |
| Backup/restore runbook | Defined; timed managed-service drill pending |
| No lower-environment production data/live authority | Pass by manifest/template policy |
| Database owner/migrator/runtime separation and runtime DDL denial | Pass by all three manifests and PostgreSQL smoke |
| Shared certificate-protected session keys outside development | Required by test/staging manifests; deployment proof pending |
| Broker credentials and paper/live connectivity | Explicitly disabled in all three manifests |
| Infrastructure compiler/hosted deployment evidence | Pending |

## Verification record

- Three environment manifests and Azure safety controls pass the executable validator, including identity-key, role-separation and broker-connectivity rules.
- Release build passes with zero warnings.
- All 314 architecture and 31 API-security tests pass.
- PostgreSQL 17.10 compatibility smoke proves idempotent roles, eleven approved schemas, four migrations, five IAM/account tables, protected tickets, uniqueness/no-live constraints and denied runtime DDL.
- Secret scan passes across 568 source files; no cloud account, subscription, resource, secret, image, DNS entry or paid service was created.

## Remaining acceptance

Approve ADR-0005, jurisdiction/region, subscriptions, network design, capacity/cost and named Operations ownership; compile/lint the Bicep template with an approved pinned toolchain; perform non-production what-if/deployment; prove private connectivity, Key Vault access, telemetry/alerts, backup/PITR and timed restore; then obtain DevOps, Security, Data and Operations signatures. WBS 3.7 remains in progress at 95% until that evidence exists.
