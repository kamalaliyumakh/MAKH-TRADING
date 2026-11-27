# MAKH Trading Platform — Environment and Promotion Plan

Last updated: 12 August 2026

## Isolation matrix

| Control | Dev/Test | Staging | Paper production | Live production |
|---|---|---|---|---|
| Broker identity | Emulator/sandbox | Paper | Dedicated paper | Dedicated live |
| Market/evidence rights | Fixture/test contract | Non-live approved | Production permitted | Production permitted |
| Secrets | Local approved/dev store | Managed non-live | Managed paper | Separate managed live |
| Database | Disposable/shared test | Production-like isolated | Paper isolated | Live isolated |
| User identities | Synthetic/test tenant | Test accounts | Authorized paper users | Explicit live-entitled users |
| Network/egress | Limited | Production-like | Approved providers | Separate approved live allowlist |
| Mode presentation | TEST | STAGING/PAPER | PAPER persistent | LIVE persistent |
| Deployment approval | Engineering | Engineering/QA | Product/Risk/Ops | Sponsor/Risk/Security/Legal/Ops |

## Promotion checklist

1. Artifact provenance/SBOM and scans pass.
2. Unit, integration, architecture, contract, accessibility and applicable E2E tests pass.
3. Database migration and compatibility evidence exists.
4. Environment configuration contains no credential/account crossover.
5. Required feature and policy versions are approved; flags cannot bypass controls.
6. Observability, alerting and rollback/roll-forward plan are ready.
7. Gate owner approves promotion and records residual risk.

## Live safeguards

Live configuration is absent by default. Creating live secrets, linking a live account, enabling a live entitlement, deploying live configuration or issuing live orders requires explicit user authority plus the controlled-live gate. Live access is limited, time/audit controlled and tested independently from paper.
