# Current Architecture and UX Gate Evidence Index

Date: 5 November 2026  
WBS: 2.8

| ID | Evidence area | Current source | Gate use |
|---|---|---|---|
| AXE-01 | Current gate review | `CURRENT_ARCHITECTURE_UX_GATE_REVIEW.md` | Criteria, blockers, permissions and exit sequence. |
| AXE-02 | Current decision register | `CURRENT_ARCHITECTURE_UX_GATE_DECISION_REGISTER.md` | Accountable decisions and approval fields. |
| AXE-03 | Architecture consistency | `ARCHITECTURE_CONSISTENCY_MATRIX.md` | ACM-01–ACM-18 alignment baseline. |
| AXE-04 | System architecture | `SYSTEM_ARCHITECTURE.md` | Authority, topology and dependency boundaries. |
| AXE-05 | Threat model | `../security/THREAT_MODEL.md` | TM-01–TM-20 design threats and controls. |
| AXE-06 | Data invariants | `../data/DATA_INVARIANTS.md` | DI-001–DI-018 authoritative-state rules. |
| AXE-07 | API contract | `../api/openapi.yaml` | OpenAPI 3.1 eighteen-path design baseline. |
| AXE-08 | Discovery predecessor | `../../outputs/discovery-gate-readiness/current-readiness-manifest.json` | Current rejected/deferred governance state. |
| AXE-09 | Landing UX predecessor | `../../outputs/landing-ux-readiness/current-readiness-manifest.json` | Current 16-check implementation-ready, acceptance-pending state. |
| AXE-10 | Portal UX predecessor | `../../outputs/portal-ux-readiness/current-readiness-manifest.json` | Current 16-check implementation-ready, acceptance-pending state. |
| AXE-11 | Engineering foundation successor | `../../outputs/engineering-foundation-gate-readiness/current-readiness-manifest.json` | Confirms downstream gate remains rejected/deferred. |
| AXE-12 | Original approval template | `ARCHITECTURE_GATE_APPROVAL.md` | Preserved signature and limitation template. |

Every evidence artifact is hashed by the executable verifier. Hashing proves package integrity only; it does not create acceptance, funding, procurement or operational authority.
