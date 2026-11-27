# MAKH Trading Platform — Requirements Traceability Baseline

Last updated: 12 August 2026

| ID | Requirement theme | Baseline source | Delivery evidence/gate |
|---|---|---|---|
| RT-01 | Self-directed owner-only operating model | BRD/PRD scope and stakeholders; FSD roles | Scope approval; legal discovery |
| RT-02 | Public Angular application | FSD public routes | WBS 2.5/2.6; Wave C2 |
| RT-03 | Authenticated Angular portal | FSD route map | WBS 2.5/2.7; Waves C3–C6 |
| RT-04 | USD 3–7, RVOL ≥3, float ≤500k screen | BRD/PRD strategy; FSD scanner | Data/vendor decisions; scanner replay tests |
| RT-05 | 100%–600% gain is not order authority | BRD/PRD AC-02; FSD FSA-04 | Domain/contract/E2E tests |
| RT-06 | Verified catalyst; social alone insufficient | BRD/PRD FR-005; FSD evidence rules | Evidence provenance gate |
| RT-07 | Central pre-trade risk approval | BRD/PRD FR-007/AC-05; FSD risk engine | Risk property/integration tests |
| RT-08 | Limit/marketable-limit initial entries | BRD/PRD FR-006; FSD order lifecycle | Broker decision and paper certification |
| RT-09 | Idempotent order lifecycle | BRD/PRD broker failure response; FSD FSA-06 | API/data contracts and duplicate/race tests |
| RT-10 | Broker truth and reconciliation | BRD/PRD FR-012; FSD order integration | Mismatch/timeout/restore drills |
| RT-11 | Loss/exposure/protection controls | BRD/PRD risk engine; FSD evaluation order | Risk policy approval and boundary tests |
| RT-12 | Separated kill-switch actions | BRD/PRD FR-010; FSD risk console | MFA/authorization/game-day tests |
| RT-13 | Immutable audit/reconstruction | BRD/PRD FR-015/AC-11; FSD audit | Data/security evidence and reconstruction test |
| RT-14 | OIDC, MFA and policy authorization | BRD/PRD NFR-003/004; FSD security | ADR-0002, threat model, identity tests |
| RT-15 | PostgreSQL controlled data/migrations | FSD data model/NFR | ADR-0003, data invariants and restore tests |
| RT-16 | REST snapshots and SignalR deltas | FSD interface/event model | ADR-0004 and contract tests |
| RT-17 | Accessibility and responsive behavior | BRD/PRD NFR-010; FSD acceptance | UX/design baseline and coded WCAG tests |
| RT-18 | Paper before controlled live | BRD/PRD roadmap; FSD release gates | ADR-005, paper certification, live go/no-go |

## Traceability rule

Every material scope change updates the BRD/PRD or approved change record, FSD/API/event contracts where applicable, tests, decision log, project memory and WBS acceptance evidence. No feature flag may redefine or bypass authorization, risk, idempotency, reconciliation or audit requirements.
