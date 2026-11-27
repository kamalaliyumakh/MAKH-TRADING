# ADR-0005 — Prefer Azure Managed Containers for Validation

Date: 13 October 2026  
Status: Proposed — Operations Owner decision pending

## Context

The platform needs Angular hosting, separate ASP.NET Core API/worker execution, PostgreSQL 18, workload identity, managed secrets, observability, protected ingress and tested recovery. The operator jurisdiction, production data location, support tier and commercial budget are unresolved.

## Proposed decision

Validate this Azure mapping first:

- Azure Front Door/WAF in front of the public origin;
- static Angular assets on an appropriate managed static/object origin;
- Azure Container Apps for separate API and non-public worker workloads;
- Azure Database for PostgreSQL Flexible Server 18 with private access, production HA where supported, automated backup and PITR;
- Key Vault with managed identities and separate paper/live vault boundaries;
- Azure Monitor/Application Insights with OpenTelemetry-compatible instrumentation;
- immutable Blob Storage for approved archives and logical exports;
- infrastructure as code and separate environment/subscription or equivalent policy boundaries.

## Consequences

- Strong alignment with .NET and an identity path that avoids stored cloud credentials.
- Managed PostgreSQL reduces operational burden but PITR creates a new server and recovery time is workload-dependent; drills are mandatory.
- Container/application portability is retained, but identity, edge, telemetry and managed-database configuration remain provider-specific.
- Region, cross-border safeguards, service coverage, support, quotas and actual cost remain approval gates.

## Alternatives

AWS ECS/Fargate with RDS, and Google Cloud Run with Cloud SQL, remain technically credible. AWS is the preferred commercial/continuity counter-option. Self-managed Kubernetes/PostgreSQL is rejected for the initial release because it adds operational risk without a demonstrated requirement.

## Approval conditions

1. Confirm operator, controller, user and regulatory facts.
2. Approve primary/paired region and cross-border safeguards.
3. Obtain a reproducible quote and approved 12-month budget scenario.
4. Verify every selected service and PostgreSQL 18 in the chosen region.
5. Pass the applicable `docs/hosting/RECOVERY_AND_OPERATIONS_ACCEPTANCE.md` tests.
6. Record Operations Owner acceptance under DR-10.

## Local readiness verification

Run `node eng/verify-hosting-discovery-readiness.mjs` to validate the hosting-discovery package and write `outputs/hosting-discovery-readiness/readiness-manifest.json`.

The verifier checks HR-01–HR-16, seven hard production gates, three-cloud mappings across six capabilities, eight weighted-assessment rows, five environments, eight capacity inputs, six cost controls, HOA-01–HOA-18, staged paper/live acceptance, six ADR approval conditions, unavailable scope/legal predecessors and the no-cloud/no-spend/no-trading-authority boundary. It hashes all eight evidence inputs and fails closed if an inventory or authority boundary changes.

Passing local verification means **Prepared / Validation and Approval Pending** only. It does not select a provider or region, approve privacy or budget, execute recovery tests, accept this ADR, create an account/subscription/resource/secret, authorize spend, or create paper/live trading authority.

No cloud provisioning or spend is authorized by this ADR.
