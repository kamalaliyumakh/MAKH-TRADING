# WBS 1.5 — Current Hosting Official-Source Review Log

Date reviewed: 28 October 2026  
Purpose: identify current provider facts requiring direct validation. These entries do not establish residency, select a provider, approve architecture or authorize spend.

| ID | Official source | Discovery observation | Required follow-up |
|---|---|---|---|
| HSR-01 | Azure regions list: https://learn.microsoft.com/azure/reliability/availability-zones-region-support | Region, paired-region and availability-zone support vary, and service support must be checked separately. | Bind every proposed service/tier to the exact region and zone capability. |
| HSR-02 | Azure Container Apps reliability: https://learn.microsoft.com/en-us/azure/container-apps/disaster-recovery | Container Apps is single-region; zone redundancy has creation/network/replica requirements and regional recovery needs a separate design. | Validate zone configuration and execute application-level zone plus region recovery exercises. |
| HSR-03 | Azure PostgreSQL Flexible Server backup/restore: https://learn.microsoft.com/azure/postgresql/backup-restore/concepts-backup-restore | PITR, retention, backup redundancy and geo-restore behavior depend on configuration and region; restore time is workload-dependent. | Confirm creation-time settings and measure RPO/RTO through reconciled restores. |
| HSR-04 | AWS RDS regions and availability zones: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html | AWS Regions are isolated and resources are not automatically replicated across regions. | Define and test explicit cross-region data and application recovery. |
| HSR-05 | Google Cloud Run locations: https://cloud.google.com/run/docs/locations | Cloud Run resources and associated customer data reside in selected regions; service features and pricing tiers vary by location. | Verify complete service compatibility, support and data-flow location for the proposed region. |
| HSR-06 | Cloud SQL PostgreSQL high availability: https://cloud.google.com/sql/docs/postgres/high-availability | HA uses a regional primary/standby design but does not replace backup or cross-region recovery. | Validate failover, backup, regional disaster recovery and measured application recovery separately. |
| HSR-07 | Cloud SQL PostgreSQL backups: https://cloud.google.com/sql/docs/postgres/backup-recovery/backups | Backup options, retention and cross-region recovery depend on edition and configuration. | Record exact edition/settings and execute restore, integrity and retention tests. |
| HSR-08 | Microsoft Entra data residency: https://learn.microsoft.com/en-us/entra/fundamentals/data-residency | Identity data location depends on cloud model, tenant geography, component and optional paid features. | Include identity, support and operational metadata in the end-to-end residency review. |

## Source-control rules

- Recheck service availability, terms, subprocessors, prices and limitations at decision time.
- Record exact account, region, zone, service, tier, version, topology, configuration and source revision.
- Provider documentation and calculators are discovery inputs, not implementation, recovery or budget proof.
- A provider, region, tier, topology, data class, user geography or terms change requires re-review.
