# MAKH Trading Platform — Legal Evidence Matrix

Last updated: 12 August 2026

| ID | Topic | Current design position | Primary authority / source | Required evidence | Release effect | Status |
|---|---|---|---|---|---|---|
| LC-01 | Entity and jurisdiction | Not confirmed | Nigeria SEC rules portal; applicable corporate/tax authorities to be confirmed | incorporation/control/address and counsel scope memo | Blocks public and live | Open |
| LC-02 | Operator classification | Owner-only/self-directed hypothesis | https://www.sec.gov.ng/for-investors/find-a-registered-operator/ | counsel classification against ISA 2025 and effective SEC rules | Blocks external users | Open |
| LC-03 | Robo advice | No intended personalized advisory service | https://www.sec.gov.ng/our-mandate/regulation/rules-and-regulations/sec-rules-for-fintechs/ | feature-by-feature advice/personalization/compensation analysis | Blocks recommendations/automation | Open |
| LC-04 | Digital sub-broker/order intermediary | Broker-neutral API design; own account only | https://www.sec.gov.ng/our-mandate/regulation/rules-and-regulations/sec-rules-for-fintechs/ | order-flow, contracting, compensation and custody analysis | Blocks third-party/live flow | Open |
| LC-05 | U.S. adviser exposure | Objective tools plus user-selected rules intended | https://www.sec.gov/rules-regulations/2002/12/exemption-certain-investment-advisers-operating-through-internet | U.S. counsel analysis if U.S. nexus/users/compensation exists | Blocks relevant launch | Open |
| LC-06 | Broker eligibility and margin | Provider not selected | https://www.finra.org/rules-guidance/rulebooks/finra-rules/4210 | broker terms, jurisdiction approval, account type, PDT/margin/restriction behavior | Blocks broker integration | Open |
| LC-07 | Privacy governance | Provisional data model only | https://ndpc.gov.ng/download/nigeria-data-protection-act-2023 | data map, controller/processor roles, lawful bases, notice, DPIA and DPO/registration assessment | Blocks production data | Open |
| LC-08 | Cross-border transfer | Regions/vendors undecided | Nigeria Data Protection Act 2023 and regulator guidance | destination, safeguards, transfer assessment and contracts | Blocks cross-border production | Open |
| LC-09 | Data/content rights | Provider-neutral adapters | Provider contracts and exchange/source terms | display, storage, derived-data, redistribution, retention and AI-use rights | Blocks provider release | Open |
| LC-10 | Marketing and claims | No guarantees; 100%–600% is a risk/watch signal | https://www.sec.gov/resources-small-businesses/small-business-compliance-guides/investment-adviser-marketing | approved claims inventory, substantiation and balanced risk presentation | Blocks public copy | Open |
| LC-11 | Records | Seven-year periods are planning assumptions | Applicable SEC/broker/tax/privacy rules and contracts | counsel-approved record schedule and legal-hold policy | Blocks live | Open |
| LC-12 | AML/KYC/sanctions | Expected to be broker-led for own account; unconfirmed | Broker terms and applicable Nigeria/U.S. requirements | responsibility matrix and screening/escalation evidence | Blocks onboarding/live | Open |
| LC-13 | Consumer terms | Draft terms absent | Applicable consumer/e-commerce rules to be confirmed | terms of use, complaints, availability, liability and electronic-consent review | Blocks public access | Open |
| LC-14 | Tax/reporting | Not assessed | Nigeria/U.S. tax authorities and broker documentation | qualified tax advice and broker reporting allocation | Blocks live readiness | Open |
| LC-15 | Accessibility/electronic consent | UX baseline prepared | Applicable law plus WCAG contractual baseline | accessible notices, versioned consent and withdrawal evidence | Blocks public acceptance | Open |
| LC-16 | Controlled live | Explicitly unauthorized | Project charter and signed legal/security/risk/operations gates | all prior approvals plus named go/no-go | Blocks live | Open |

No item is closed by this research pass. Source pages establish issues for review; only the authorized specialist may record the legal conclusion.

