# MAKH Trading Platform — Change Control

Last updated: 12 August 2026

## Purpose

Control material changes to scope, schedule, cost, architecture, security, compliance, data rights, trading rules and production operations without suppressing normal backlog refinement.

## Change classes

| Class | Examples | Approval authority | Minimum evidence |
|---|---|---|---|
| CC-1 Administrative | wording, links or ownership correction with no baseline effect | Project Manager | change record and verification |
| CC-2 Delivery | backlog sequencing or implementation adjustment within approved scope and tolerance | Product Owner + Engineering Lead | impact analysis, tests and updated plan |
| CC-3 Baseline | scope, milestone, budget, staffing, vendor, architecture or material quality change | Sponsor; relevant accountable specialists | options, recommendation, impacts, acceptance and rebaseline |
| CC-4 Safety / regulated | trading limits, live enablement, broker behavior, security boundary, legal/privacy/records or data-use rights | Sponsor plus Risk, Security and/or Legal as applicable | specialist approval, verification, rollback and signed gate |

CC-4 changes never use emergency implementation as a substitute for approval. An emergency may disable or contain unsafe behavior; restoration or expanded capability still follows authorization.

## Workflow

1. Submit a uniquely numbered request with problem, objective and requester.
2. Triage class, urgency, affected baselines and conflicts of interest.
3. Analyze scope, dates, cost/capacity, architecture, security, compliance, privacy, data/vendor rights, operational and trading-risk impacts.
4. Record options including no-change, recommendation, tests, rollback and residual risk.
5. Obtain the accountable approvals for the class before implementation.
6. Update WBS, requirements, ADRs, contracts, RAID, release notes and training/runbooks as applicable.
7. Implement through normal review and promotion controls.
8. Verify intended outcome and absence of unauthorized side effects.
9. Close with evidence or reverse using the approved rollback.

## Change request template

| Field | Required content |
|---|---|
| Change ID / submitted | `CR-###`, date and requester |
| Class / urgency | CC-1–CC-4 and rationale |
| Current baseline | requirement, WBS, architecture, policy or operational reference |
| Proposed change | precise behavior and exclusions |
| Impact analysis | scope, schedule, cost, capacity, UX, architecture, security, legal/privacy, data rights, operations and trading risk |
| Options | no-change and viable alternatives |
| Verification / rollback | tests, evidence, monitoring, abort threshold and recovery |
| Decision | approved, rejected, deferred or withdrawn; named authority and date |
| Implementation / closure | linked work, release, evidence and residual RAID items |

## Initial log

| Change ID | Summary | Class | Status | Decision owner | Evidence |
|---|---|---|---|---|---|
| None | No baseline changes submitted as of 2026-08-12. | N/A | N/A | N/A | Initial control baseline |

