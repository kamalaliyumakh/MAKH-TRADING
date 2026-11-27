# Hosting Requirements

Date: 12 August 2026  
Status: Baseline for vendor validation

| ID | Requirement | Acceptance evidence |
|---|---|---|
| HR-01 | Run the Angular public site/portal and stateless ASP.NET Core API as independently deployable workloads. | Deployment and rollback test |
| HR-02 | Run the background worker separately with controlled scaling and no public ingress. | Network and scale configuration |
| HR-03 | Provide managed PostgreSQL 18 with encryption, private access and supported maintenance. | Service/version and configuration evidence |
| HR-04 | Preserve dev, test, staging, paper-production and live-production isolation. | Subscription/account, network and identity map |
| HR-05 | Keep live and paper broker credentials in separate managed secret boundaries. | Vault inventory and access test |
| HR-06 | Use workload identity; do not place reusable cloud credentials in source, images or CI variables where federation is available. | Identity and secret-scan evidence |
| HR-07 | Centralize logs, metrics, distributed traces, dashboards and actionable alerts with correlation IDs. | Observability acceptance results |
| HR-08 | Protect public ingress with TLS, DDoS controls, WAF/rate limiting and controlled origin access. | Security configuration and test |
| HR-09 | Encrypt data in transit and at rest; support provider-managed keys initially and customer-managed keys if required. | Cryptographic configuration |
| HR-10 | Support zone-resilient production deployment where the selected region and service tier permit it. | Failure test and service evidence |
| HR-11 | Provide automated PostgreSQL backup and PITR; target RPO is at most five minutes and planning RTO is at most 60 minutes. | Timed restore drill; targets are not vendor guarantees |
| HR-12 | Retain independent logical exports and immutable audit/archive copies under approved retention rules. | Restore and immutability test |
| HR-13 | Permit infrastructure as code, policy enforcement, tagged costs and separate deployment approvals. | Repository and policy evidence |
| HR-14 | Keep production personal/trading data out of lower environments and control cross-border transfers. | Data-flow/privacy approval |
| HR-15 | Expose service health/status and operational support suitable for a trading safety runbook. | Support/SLA review and exercise |
| HR-16 | Provide documented exit/export paths for database, object data, secrets metadata and telemetry. | Exit rehearsal and dependency inventory |

## Hard gates

Failure of HR-03, HR-04, HR-05, HR-07, HR-08, HR-11 or HR-14 blocks production. A hosting selection does not authorize a live broker connection.
