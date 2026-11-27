# MAKH Trading Platform — Landing UX Review Pack

Last updated: 14 October 2026  
Gate status: Pending usability and qualified legal/privacy review

## Review inventory

| Review ID | Area | Evidence | Status |
|---|---|---|---|
| LR-01 | Route and navigation coverage | PR-01–PR-09; WF-01–WF-09 | Ready for review |
| LR-02 | Message comprehension | CP-01, CP-02 and UX validation UV-01/03 | Pending participant testing |
| LR-03 | Risk disclosure | CP-01 and CP-06 | Pending risk/legal approval |
| LR-04 | Security claims | CP-03 | Pending security and legal approval |
| LR-05 | Privacy notice and consent | CP-07/08 | Pending privacy/legal approval |
| LR-06 | Status representations | CP-04 | Pending operations approval |
| LR-07 | Accessibility | SEO/accessibility checklist and coded prototype | Pending coded/manual testing |
| LR-08 | SEO/legal entity metadata | Metadata table | Pending domain/entity decisions |

## Usability protocol

Test five tasks on mobile and desktop prototypes:

1. Explain what MAKH does and does not promise after viewing Home.
2. Describe why a scanner candidate cannot directly authorize an order.
3. Locate and explain the main risks of a 100%–600% price move.
4. Distinguish MAKH state from broker execution authority.
5. Submit an access request without entering prohibited sensitive data.

Pass hypotheses: at least 90% correctly understand risk/order authority and complete navigation/form tasks; 100% can locate the risk disclosure; zero participants interpret copy as guaranteed returns. These are targets, not results.

## Legal/privacy approval checklist

- Legal entity, jurisdiction, eligibility and contact details.
- Regulatory characterization and self-directed/no-advice boundary.
- Low-priced-stock, liquidity, execution, stop, halt and loss wording.
- Broker/data-provider responsibility and availability language.
- Terms, limitation, dispute and intellectual-property provisions.
- Privacy controller/processor roles, lawful bases, rights, transfer and retention text.
- Cookies/analytics consent and request-access data flow.
- Effective dates, versioning, acknowledgement and change notification.

## Gate decision

WBS 2.6 may be marked complete only when:

1. responsive wireframes and copy are reviewed against PR-01–PR-09;
2. representative usability findings are resolved or accepted;
3. security claims are confirmed by engineering/security;
4. qualified legal/privacy reviewers approve or replace provisional language;
5. coded accessibility evidence is scheduled for the public milestone.

## Local readiness verification

Run `node eng/verify-landing-ux-readiness.mjs` to validate the landing UX package and write `outputs/landing-ux-readiness/readiness-manifest.json`.

The verifier checks PR-01–PR-09, WF-01–WF-09, CP-01–CP-09, nine metadata rows, LR-01–LR-08, five usability tasks, eight legal/privacy controls, five completion conditions, the coded nine-route shell, current predecessor manifests and the no-publication/no-trading-authority boundary. It hashes all eight evidence inputs and fails closed if an inventory or authority boundary changes.

Passing local verification means **Implementation Ready / Acceptance Pending** only. It does not represent participant results, legal/privacy/risk approval, manual accessibility acceptance, Product Owner sign-off, permission to publish, or paper/live trading authority.

Until then, the package is implementation-ready for prototyping but not approved for external publication.
