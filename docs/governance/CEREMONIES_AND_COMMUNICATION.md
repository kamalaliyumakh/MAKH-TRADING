# MAKH Trading Platform — Ceremonies and Communication Plan

Last updated: 12 August 2026

## Ceremonies

| ID | Ceremony | Cadence | Participants | Output / timebox |
|---|---|---|---|---|
| CC-01 | Delivery sync | Daily on active delivery days | Active work-package team | progress, next step, blockers; 15 min |
| CC-02 | Backlog refinement | Weekly | Product, PM, engineering, QA; SMEs as needed | dependency-ready items and acceptance evidence; 60 min |
| CC-03 | Iteration planning | Fortnightly | Delivery team and Product Owner | two-week coordination forecast/capacity; 60–90 min |
| CC-04 | Architecture/security/risk review | Weekly or change-triggered | Architect, Engineering, Security, Risk, Data/Ops | ADR/control/test decisions; 60 min |
| CC-05 | Product demonstration | Fortnightly | Product, Sponsor/delegates and stakeholders | feedback and acceptance dispositions; 45–60 min |
| CC-06 | Retrospective | Fortnightly | Delivery team | improvement actions with owners; 45 min |
| CC-07 | RAID/decision review | Weekly | PM, Product and relevant leads | updated owners/dates/escalations; 30 min |
| CC-08 | Sponsor governance review | Monthly and gate-triggered | Sponsor, Product, PM and leads | funding/scope/gate decisions; 60 min |
| CC-09 | Release readiness | Per release/gate | Accountable gate roles | evidence decision and rollback/ownership; 45–90 min |
| CC-10 | Incident coordination | Event-driven | Incident roles | containment, broker truth, evidence, recovery and review |

Ceremonies do not create approval by attendance. Decisions are written into the applicable approval, ADR, change, RAID or gate record.

## Communication channels

The final tools remain to be selected. Use these logical channels regardless of platform:

| Channel | Purpose | Record rule |
|---|---|---|
| Project control | WBS, milestones, owners, RAID, decisions and change | authoritative structured records |
| Engineering work | branches/PRs, code review, CI and technical discussion | WBS ID and evidence links |
| Team chat | rapid coordination | material decisions copied to durable record |
| Documentation | requirements, architecture, API/data/security/UX/runbooks | version controlled and reviewed |
| Incident | restricted real-time response | immutable incident timeline and follow-up |
| Confidential/legal | privileged legal/privacy/vendor material | access-restricted approved repository |

Do not place credentials, tokens, full broker payloads, account-sensitive data or legal privileged material in ordinary team chat or public issue descriptions.

## Meeting hygiene

- Agenda, objective, accountable facilitator and decision needed are stated in advance.
- Pre-reads are linked, not pasted repeatedly.
- Decisions, owners and due dates are captured during or immediately after the meeting.
- Unresolved disagreements use the escalation plan; absence is not consent.
- Accessibility needs, timezone and asynchronous participation are supported.
