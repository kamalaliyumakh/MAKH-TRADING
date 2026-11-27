# Current Architecture and UX Gate Decision Register

Date: 29 October 2026  
WBS: 2.8  
Status: All accountable gate decisions remain pending

## Accountable decisions

| ID | Decision | State | Required authority/evidence |
|---|---|---|---|
| ADD-01 | Accept Discovery scope, budget and delivery baseline. | Pending | Sponsor and Product Owner approved WBS 1.7 record. |
| ADD-02 | Accept modular-monolith and Clean Architecture boundaries. | Pending | Solution Architect decision. |
| ADD-03 | Accept threat model, controls and residual risks. | Pending | Security Lead and Solution Architect decision. |
| ADD-04 | Accept PostgreSQL ownership, invariants, retention and migration approach. | Pending | Data, Security and privacy approval. |
| ADD-05 | Accept REST, SignalR, error, authorization and idempotency contracts. | Pending | Solution Architect and Engineering acceptance. |
| ADD-06 | Accept identity-provider topology and validation outcome. | Pending | Security/Product/Solution Architect approval. |
| ADD-07 | Accept hosting, secrets, telemetry and recovery architecture. | Pending | DevOps/Security/Operations/Solution Architect approval. |
| ADD-08 | Accept landing UX, copy, legal/privacy and accessibility evidence. | Pending | Product Owner, qualified reviewer and accountable accessibility approval. |
| ADD-09 | Accept portal Product/Risk/user/accessibility evidence. | Pending | Product Owner, Risk and accountable accessibility approval. |
| ADD-10 | Accept AGB-01–AGB-10 dispositions, conditions and residual risk. | Pending | Authorized Solution Architect gate decision. |

## Approval record requirements

| ID | Required field | State |
|---|---|---|
| AAP-01 | Solution Architect legal name and organizational authority | Pending |
| AAP-02 | Gate decision: Approve / Approve with conditions / Reject | Pending |
| AAP-03 | Referenced immutable evidence-manifest hash | Pending |
| AAP-04 | Conditions, exceptions and change references | Pending |
| AAP-05 | Residual-risk acceptance and accountable owners | Pending |
| AAP-06 | Sponsor and Product Owner predecessor confirmation | Pending |
| AAP-07 | Approved electronic signature or equivalent record | Pending |
| AAP-08 | Decision date/time and effective scope | Pending |

## Authority boundary

Codex can prepare and verify evidence but cannot supply accountable human acceptance. Until ADD-01–ADD-10 and AAP-01–AAP-08 are completed, the gate remains rejected/deferred and downstream authority remains false.
