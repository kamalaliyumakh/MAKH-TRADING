# Architecture and UX Gate Review

Date: 14 October 2026  
WBS: 2.8  
Status: Review package ready; gate not approved

## Recommendation

The architecture baseline is suitable for foundation scaffolding using local infrastructure, synthetic data and provider-neutral adapters. Do not sign the architecture gate yet: WBS 2.6 and 2.7 acceptance, identity selection, final hosting/provider decisions, discovery approval and authorized Solution Architect review remain open.

## Gate criteria

| ID | Criterion | Status | Evidence / remaining action |
|---|---|---|---|
| AG-01 | Context, container, component and deployment boundaries are documented. | Pass — design | `SYSTEM_ARCHITECTURE.md`; ADR-0001 |
| AG-02 | Domain/Application remain independent of frameworks and vendors. | Pass — design | Solution structure and dependency rules |
| AG-03 | Threats, controls and verification are traceable. | Pass — design | `../security/`; ADR-0002 |
| AG-04 | Identity/session topology prevents browser-held provider tokens. | Pass — topology | BFF/cookie accepted; identity vendor pending |
| AG-05 | PostgreSQL ownership, invariants, retention and migrations are defined. | Pass — design | `../data/`; ADR-0003 |
| AG-06 | REST, SignalR, errors, authorization and idempotency are consistent. | Pass — design | `../api/`; ADR-0004 |
| AG-07 | Paper/live, authorization, risk and reconciliation boundaries fail closed. | Pass — design | Architecture/security/data/API matrix |
| AG-08 | Hosting, secrets, observability and recovery mapping is accepted. | Conditional | `../hosting/`; ADR-0005 proposed only |
| AG-09 | Brand/tokens/components/responsive states are accepted. | Pass — design baseline | `../design-system/`; DS-001 |
| AG-10 | Landing UX/copy is usable, accessible and legally approved. | Fail | WBS 2.6 at 90%; testing and legal/privacy approval pending |
| AG-11 | Portal workflows are accepted by Product/Risk and representative users. | Fail | WBS 2.7 at 95%; participant/SME/accountable accessibility acceptance pending |
| AG-12 | Provider contracts and identity capabilities preserve defined ports. | Conditional | Broker/data/identity selections and contract spikes pending |
| AG-13 | Discovery Gate has approved scope, budget and delivery baseline. | Fail | WBS 1.7 unsigned |
| AG-14 | Authorized Solution Architect accepts residual risks and decisions. | Pending | `ARCHITECTURE_GATE_APPROVAL.md` |

## Review findings

| Finding | Severity | Disposition |
|---|---|---|
| AF-01 Identity provider remains undecided. | High | Select against BFF, MFA freshness, revocation and audit requirements before WBS 3.5. |
| AF-02 Hosting ADR is proposed, not accepted. | High | Region/privacy/quote/service/recovery evidence before WBS 3.7 staging. |
| AF-03 Broker and data candidates are not contracted or certified. | Critical for production | Keep interfaces provider-neutral and fixtures/sandboxes only. |
| AF-04 Retention periods remain provisional pending legal/privacy approval. | High | Implement configurable policies; block production-data acceptance. |
| AF-05 UX targets are hypotheses, not observed results. | High | Execute participant, SME and coded accessibility protocols. |
| AF-06 Physical database performance and partition/index strategy are unmeasured. | Medium | Establish load/replay baseline before scanner and paper gates. |
| AF-07 Cache/message broker need is intentionally deferred. | Low | Add only from measured throughput/reliability need through ADR. |
| AF-08 Architecture work preceded formal discovery approval. | High governance | Treat outputs as preparation; do not infer downstream authorization. |

## Permitted foundation preparation

- Scaffold Angular/.NET projects, dependency tests and local PostgreSQL containers.
- Generate clients from the approved OpenAPI design baseline.
- Implement synthetic fixtures, emulators, security scans and architecture tests.
- Preserve provider, identity, hosting and notification abstractions.

## Gate limitations

This review does not approve production services, provider contracts, real data, public publication, paper operational readiness or live trading. A passed architecture gate would authorize foundation execution only under the approved discovery and change-control baselines.

## Executable readiness verification — 14 October 2026

`eng/verify-architecture-ux-gate.mjs` now fails closed across AG-01–AG-14, AF-01–AF-08, ACM-01–ACM-18, 20 threats, 18 data invariants, the 18-path OpenAPI design baseline and all 10 pending approval decisions. It consumes the current discovery, landing UX and portal UX manifests and hashes 10 evidence artifacts.

The generated decision remains `Reject/Defer` with five blockers. This raises WBS 2.8 evidence maturity without accepting the gate: discovery and UX predecessors, provider/identity/hosting decisions, hosted validation and the authorized Solution Architect record remain unavailable. No foundation-stage authority, production provisioning, provider commitment, publication, paper certification or live-trading authority is created.
