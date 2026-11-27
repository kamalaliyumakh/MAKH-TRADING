# Operational Readiness Evidence Index

Status: Prepared for review; deployed, operational and accountable evidence absent.

| Area | Local evidence | Gate state |
|---|---|---|
| Notifications | `NOTIFICATION_ACCEPTANCE.md`; application/in-memory service/tests | Local pass; persistence/providers/operations acceptance pending |
| Reports | `REPORTING_ACCEPTANCE.md`; reporting contracts/service/tests | Local pass; authoritative adapters/persistence/reconciliation pending |
| Audit exports | `AUDIT_EXPORT_ACCEPTANCE.md`; export contracts/service/tests | Local pass; encrypted storage/download lifecycle/security approval pending |
| Administration | `ADMINISTRATION_ACCEPTANCE.md`; admin service/store/tests | Local pass; identity/durable audit/API/UI/privilege drills pending |
| Observability | `OBSERVABILITY_ACCEPTANCE.md`; `OBSERVABILITY_AND_ALERTS.md`; evaluator/store/tests | Local pass; backend/dashboards/pages/on-call/drills pending |
| Recovery | `RECOVERY_EXERCISE_ACCEPTANCE.md`; runbook/evaluator/template/tests | Preparation 40%; not executed and RPO/RTO unmeasured |
| Security/privacy/quality | Threat model, retention baseline, test matrix and package acceptance files | Design/local evidence; independent production-like acceptance pending |
| Paper/predecessors | Paper gate and preceding gate records | Rejected/deferred or unsigned; dependencies unavailable |
| Decision | `OPERATIONAL_READINESS_APPROVAL.md` | Unsigned; readiness unavailable |
| Local gate manifest | `outputs/operational-readiness/local-evidence-manifest.json` | Reject/Defer; 8 checks, 9 hashed artifacts, 8 blockers and no operational/paper/live authority |

Every narrative reference must be replaced or supplemented with immutable deployment, telemetry, drill, defect, approval and artifact identifiers before an approval decision. Missing evidence is a failure or pending item, never an implied pass.
