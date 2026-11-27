# Managed Hosting Comparison

Date: 12 August 2026  
Status: Technical shortlist; commercial and jurisdiction review pending

## Candidate mappings

| Capability | Azure | AWS | Google Cloud |
|---|---|---|---|
| Web/API/worker | Static Web Apps or Storage/CDN; Container Apps | S3/CloudFront; ECS on Fargate | Cloud Storage/CDN; Cloud Run |
| PostgreSQL | Database for PostgreSQL Flexible Server | RDS for PostgreSQL | Cloud SQL for PostgreSQL |
| Secrets/workload identity | Key Vault + managed identity | Secrets Manager + IAM roles | Secret Manager + service identity |
| Telemetry | Azure Monitor + Application Insights | CloudWatch + X-Ray/OpenTelemetry | Cloud Monitoring/Logging/Trace |
| Edge protection | Front Door + WAF | CloudFront + WAF | External Application Load Balancer + Cloud Armor |
| Archive | Blob immutable storage | S3 Object Lock | Cloud Storage retention policy |

## Weighted assessment

Score: 1 weak/unknown, 3 adequate, 5 strong. Scores are working judgments, not provider certification.

| Criterion | Weight | Azure | AWS | Google Cloud |
|---|---:|---:|---:|---:|
| .NET/container fit | 20 | 5 | 4 | 4 |
| PostgreSQL/backup fit | 20 | 5 | 5 | 4 |
| Identity/secrets integration | 15 | 5 | 5 | 5 |
| Observability/operations | 15 | 5 | 5 | 5 |
| Region/data-residency fit | 15 | 3 | 3 | 3 |
| Team simplicity | 10 | 5 | 4 | 4 |
| Portability/exit | 5 | 4 | 4 | 4 |
| Weighted score / 5 | 100 | 4.6 | 4.4 | 4.15 |

Region scores remain deliberately neutral until the operator, users, controller location, latency measurements, service availability and cross-border safeguards are confirmed. A cloud region in Africa is not by itself proof of Nigerian data-residency compliance.

## Current evidence and limitations

- Azure documentation currently lists PostgreSQL 18 as supported by Flexible Server. Automated snapshots and archived WAL support PITR; configurable backup retention is 7–35 days. PITR creates a new server and recovery duration varies, so the 60-minute RTO must be tested, not assumed.
- Azure Container Apps managed identities can authenticate to Entra-protected resources such as Key Vault and Storage without application-held cloud credentials.
- Equivalent AWS and Google Cloud mappings remain viable alternatives. Exact PostgreSQL 18 availability, region-by-service coverage, quotas, SLA, support and price must be reconfirmed in a vendor quote/technical spike immediately before selection.

## Provisional recommendation

Use Azure as the first technical and commercial validation candidate because it has the strongest fit with the approved .NET stack and its official material confirms the two critical uncertainties: PostgreSQL 18 and managed workload identity. Retain AWS as the negotiation/continuity alternative and Google Cloud as a valid third option.

This is not final selection. Operations Owner approval is required under DR-10 after region/privacy, measured recovery, support and quote evidence exists.

## Primary references reviewed

- Azure PostgreSQL backup/PITR: https://learn.microsoft.com/azure/postgresql/backup-restore/concepts-backup-restore
- Azure PostgreSQL version support: https://learn.microsoft.com/azure/postgresql/configure-maintain/concepts-major-version-upgrade
- Azure Container Apps managed identity: https://learn.microsoft.com/azure/container-apps/managed-identity
