# Environment Baseline

Date: 12 August 2026  
WBS: 3.7  
Status: Local infrastructure baseline; no environment provisioned

## Isolation

| Environment | Permitted data | Trading mode | Startup state | Telemetry | Database recovery |
|---|---|---|---|---|---|
| Dev | Synthetic only | Synthetic | Entry locked | Optional local OTLP | PostgreSQL 18, 7-day PITR target |
| Test | Synthetic only | Synthetic | Entry locked | Required, 14 days | PostgreSQL 18, 14-day PITR target |
| Staging | Synthetic only | Paper | Entry locked | Required, 30 days | PostgreSQL 18, 35-day PITR target |

Production and live environments are intentionally absent. Staging cannot receive production personal/trading data or live credentials. Restores and new revisions start entry-locked until health, migrations, provider state and broker reconciliation are independently cleared.

## Azure candidate template

`deploy/azure/main.bicep` is a non-deploying validation candidate based on proposed ADR-0005. It defines separate API and Worker Container Apps, a private Container Apps environment, user-assigned identity, RBAC Key Vault, Log Analytics and private PostgreSQL 18 Flexible Server with PITR retention. It accepts immutable image references and an externally supplied secure deployment credential; it contains no credential values.

Every resource is tagged with environment, application, synthetic-only data classification and `live-authorized=false`. The template only accepts dev, test or staging. Region, subscriptions, network IDs, image digests, database credential source, sizing, cost and role assignments remain deployment inputs subject to approval.

## Application telemetry

API and Worker register OpenTelemetry 1.17 for runtime, outbound HTTP and ASP.NET Core signals. OTLP export is disabled unless `OTEL_EXPORTER_OTLP_ENDPOINT` is a valid absolute URI. Resources carry service name, deployment environment and account mode. API responses include a bounded `X-Correlation-ID`, preserving a valid caller value or generating one from the active trace/request.

No secrets, tokens, account identifiers, order payloads or personal data may be added as telemetry attributes. Sampling, backend, retention and access controls require Security/Operations approval before shared use.

## Configuration contract

The JSON manifests and executable validator enforce synthetic-only lower environments, PostgreSQL 18, entry lock, PITR, 7–35 day backup retention, telemetry retention and the planning targets of RPO ≤5 minutes and RTO ≤60 minutes. These are acceptance targets, not provider guarantees.
# Security contract addendum — 2026-08-27

All lower-environment manifests explicitly separate `makh_owner`, `makh_migrator` and `makh_runtime`, deny runtime DDL, forbid broker credentials and all paper/live connectivity, and keep identity-provider configuration false until approval. Test and staging require a shared certificate-protected Data Protection key ring and all environments retain a mandatory recovery exercise. These are configuration requirements, not deployment evidence.
