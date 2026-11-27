# Observability and Alert Baseline

## Initial service objectives

| Signal | Paper-stage objective | Measurement | Promotion effect |
|---|---|---|---|
| API availability | 99.9% monthly | successful non-user-error requests | breach reviewed before promotion |
| API latency | p95 ≤500 ms for portal APIs | server duration excluding streaming | sustained breach blocks release |
| Scanner freshness | 99% within approved provider interval | source timestamp to normalized snapshot | stale state blocks new entries |
| Order/risk decision | p95 ≤250 ms internal decision time | command receipt to decision record | breach blocks paper certification |
| Reconciliation | no unresolved material divergence | broker versus local state | divergence activates entry lock |
| Recovery | RPO ≤5 min, RTO ≤60 min | timed restore exercise | failure blocks production/live gate |

## Required alerts

- API/Worker unavailable, crash loop or readiness failure.
- Elevated 5xx rate, latency saturation or request queue pressure.
- PostgreSQL unavailable, storage/connection saturation, failed migration or backup/PITR health warning.
- Market/evidence feed stale, sequence gap or provider outage.
- Broker disconnect, unknown order state or reconciliation divergence.
- Risk service failure, entry-lock activation or attempted policy bypass.
- Authentication failure surge, authorization denials, stale MFA and privileged action.
- Telemetry exporter failure or material ingestion gap.

Every alert requires environment, service, severity, UTC time, correlation/trace reference, runbook, owner and acknowledgement. Alert payloads must be redacted. Paging routes and thresholds remain provisional until baseline load tests and named on-call ownership exist.
