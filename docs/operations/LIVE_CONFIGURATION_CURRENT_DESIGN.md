# WBS 9.3 — Current Controlled-Live Configuration Design

Status: Disabled and entry-locked; configuration authorization is unavailable.

## Configuration states

| State | Meaning | Permitted external behavior |
|---|---|---|
| Disabled | `mode=controlled-live-disabled`, `liveEnabled=false`, `entryLocked=true` | No broker connectivity, credential retrieval, capital allocation or order path |
| Prepared | All references, limits, assurance and approvals are evidenced but entry lock remains set | Validation only; no order path |
| Authorized | Separate WBS 9.4 decision references an immutable release/configuration and time-bounded pilot | Only the explicitly approved pilot boundary |
| Revoked | Authorization expired, withdrawn, breached or predecessor evidence changed | Immediate fail-closed disablement and credential/session revocation |

The repository template represents only Disabled. It cannot represent Prepared or Authorized values.

## Startup assertions

| ID | Mandatory assertion before any future controlled-live process |
|---|---|
| LA-01 | Immutable release, SBOM, provenance and deployment digest match the approved decision. |
| LA-02 | Dedicated environment and account inventory match the signed scope. |
| LA-03 | Paper and live broker accounts are segregated and independently attested. |
| LA-04 | Credential references resolve only through the approved vault and workload identity. |
| LA-05 | Identity issuer, audience, role, account scope and fresh MFA are verified. |
| LA-06 | Approved versioned limits are positive, internally coherent and stricter than platform maxima. |
| LA-07 | Entry-lock dependencies—market state, data freshness, risk, broker, telemetry and reconciliation—are healthy. |
| LA-08 | Kill switch is reachable by separated authorized roles and default-denies on uncertainty. |
| LA-09 | Reconciliation has a complete broker/local baseline for orders, executions, positions and cash. |
| LA-10 | Rollback, worker stop, entitlement/session revocation and secret-rotation controls are ready. |
| LA-11 | Operations, independent security and compliance predecessor manifests are accepted and current. |
| LA-12 | WBS 9.4 approval binds configuration digest, capital/limit ceilings, participants, start/end time and stop authority. |

Any false, missing, stale, conflicting or unavailable assertion keeps the entry lock set and prevents adapter startup.

## Limit contract

The disabled template keeps `policyVersion=PENDING` and all seven numeric ceilings null: pilot capital, daily loss, position exposure, order notional, share quantity, open positions and orders per day. Null never means unlimited. A future approved configuration must define positive ceilings, units/currency, effective/expiry time, aggregation rules, breach behavior and a signed policy reference. No value is inferred from mock UI content.

## Containment and revocation

- A kill switch must deny new submissions, cancel eligible working orders under policy, revoke authorization and preserve audit evidence.
- Reconciliation uncertainty, stale market/risk evidence, telemetry loss, breached limit, expired approval, credential anomaly or predecessor revocation forces Disabled/Revoked.
- Rollback restores the last approved immutable release only after authorization; it never clears the entry lock automatically.
- Secrets, account identifiers and tokens never appear in repository configuration or evidence documents.

Decision: `Disabled / Configuration, Drills and Go-No-Go Authorization Pending`.

No environment, account, credential, provider call, broker connection, deployment, drill, capital allocation, pilot or live-trading authority is created.
