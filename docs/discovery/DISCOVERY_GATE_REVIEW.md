# Discovery Gate Review Pack

Date: 12 August 2026  
WBS: 1.7  
Status: Review package ready; gate not approved

## Executive recommendation

Do not sign the Discovery Gate yet. The product and technical direction is sufficiently developed for reversible engineering preparation, but mandatory legal, provider, hosting, budget and authorized-owner evidence is incomplete. No production, paid-vendor, external-user or live-trading commitment is authorized.

## Readiness assessment

| Area | Evidence maturity | Gate state | Required decision/evidence |
|---|---:|---|---|
| Charter and integrated plan | 85% | Not approved | Named Sponsor/Product Owner; charter and plan approval |
| Scope baseline | 90% | Not approved | Authorized Product Owner signature and WBS 0.2 predecessor |
| Legal/compliance/privacy | 65% | Not approved | LF-01–12 facts and qualified jurisdiction/privacy advice |
| Broker | 70% | Not approved | Owner/entity/residence; written eligibility; paper certification |
| Market/evidence vendors | 75% | Not approved | Rights, quotes, definitions and provenance certification |
| Hosting | 75% | Not approved | Region/privacy, quotes, service checks and recovery evidence |
| UX discovery | 100% | Evidence baseline complete | Representative-user validation continues at UX gates |
| Budget/capacity | Template ready | Not approved | Named capacity, rates, currency/tax, quotes and funding ceiling |

Percentages describe evidence maturity, not acceptance or authority.

## Gate criteria

| ID | Criterion | Status | Evidence |
|---|---|---|---|
| DG-01 | Authorized Sponsor and Product Owner are recorded. | Fail | `../governance/CHARTER_APPROVAL.md` pending |
| DG-02 | Integrated plan and scope baseline are approved. | Fail | Integrated-plan and scope approvals pending |
| DG-03 | Operating jurisdiction/entity and legal/privacy work plan are accepted. | Fail | `../legal/` evidence exists; qualified acceptance pending |
| DG-04 | A viable paper-broker path is confirmed for the actual operator. | Fail | `../broker/` shortlist only; eligibility/certification pending |
| DG-05 | Data providers have acceptable rights, definitions and quality plans. | Fail | `../vendors/` shortlist only; contracts/certification pending |
| DG-06 | Hosting direction, region, secrets, observability and recovery are accepted. | Fail | `../hosting/`; ADR-0005 proposed only |
| DG-07 | Refined budget and capacity baseline is funded. | Fail | `REFINED_BUDGET_BASELINE.md`; inputs pending |
| DG-08 | Critical discovery risks have accountable responses. | Conditional | RAID-001–024 recorded; critical dependencies remain open |
| DG-09 | Paper-first, owner-only and safety boundaries remain unchanged. | Pass as working baseline | Project memory and scope baseline |
| DG-10 | Approvers acknowledge discovery does not authorize live trading. | Pending signature | `DISCOVERY_GATE_APPROVAL.md` |

## Permitted work before approval

- Local scaffolding and vendor-neutral interfaces using synthetic fixtures.
- Architecture, security, data/API contract and UX refinement.
- Automated quality/security/accessibility tooling with no external commitment.
- Non-production spikes only after credentials, terms and costs receive authority.

## Prohibited work before approval

- Provider purchase, production provisioning or contractual commitment.
- Real personal/trading data in shared lower environments.
- Public launch, paid access, third-party account or advisory operation.
- Live credentials, funded brokerage, live routing or weakened risk controls.

## Exit sequence

1. Close or explicitly accept DG-01–02.
2. Confirm legal/operator facts and qualified work plan under DG-03.
3. Obtain written broker/data/hosting evidence for DG-04–06.
4. Populate and approve the refined budget under DG-07.
5. Reconcile RAID, decisions, exceptions and scope changes.
6. Authorized Sponsor signs `DISCOVERY_GATE_APPROVAL.md`.

Until all required criteria pass, WBS 1.7 remains in progress and downstream completion gates remain formally blocked.
