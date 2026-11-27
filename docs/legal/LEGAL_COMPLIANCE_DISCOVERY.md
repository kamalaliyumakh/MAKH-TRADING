# MAKH Trading Platform — Legal and Compliance Discovery

Last updated: 12 August 2026  
Status: Counsel-ready working analysis; not legal advice or approval

## Working position

The product is currently designed for one owner making self-directed decisions through the owner's own regulated broker account. It does not hold customer assets, manage third-party accounts, promise returns or permit a social signal to authorize a trade. Those product constraints reduce risk but do not, by themselves, establish that registration, licensing or other obligations are absent.

Nigeria is a working jurisdiction hypothesis based on the project context, not a confirmed legal fact. U.S. securities rules and broker controls are also relevant because the proposed instruments are U.S.-listed equities and execution would occur through a broker serving the approved user jurisdiction.

## Primary-source findings

1. Nigeria SEC states that operators in Nigeria must register before commencing operation and provides a registered-operator search. The exact operator category for this platform requires a fact-specific review: https://www.sec.gov.ng/for-investors/find-a-registered-operator/
2. Nigeria SEC's fintech material describes regulated robo-advisory services, including registration, algorithm governance, disclosures, suitability, cybersecurity, continuity, privacy and AML controls. It also describes digital sub-broker rules and transaction-record obligations: https://www.sec.gov.ng/our-mandate/regulation/rules-and-regulations/sec-rules-for-fintechs/
3. The Nigeria SEC page states that the Investments and Securities Act 2025 repealed the 2007 Act. Counsel must use the current Act and effective rules, not rely on the superseded statute: https://www.sec.gov.ng/our-mandate/regulation/rules-and-regulations/sec-rules-for-fintechs/
4. The Nigeria Data Protection Commission publishes the Nigeria Data Protection Act 2023. The platform must identify controller/processor roles, lawful bases, notices, rights, security, retention, vendors and cross-border transfers before production: https://ndpc.gov.ng/download/nigeria-data-protection-act-2023
5. U.S. SEC materials indicate that providing securities advice for compensation may create investment-adviser questions; an interactive site using personal information to provide advice is treated differently from a tool that only aggregates information. This is a fact-specific counsel question: https://www.sec.gov/rules-regulations/2002/12/exemption-certain-investment-advisers-operating-through-internet
6. U.S. SEC marketing guidance prohibits materially misleading advisory advertising and requires fair and balanced presentation of material risks and limitations when applicable: https://www.sec.gov/resources-small-businesses/small-business-compliance-guides/investment-adviser-marketing
7. FINRA Rule 4210 currently contains broker margin requirements relevant to low-priced securities and pattern day trading. Broker/account controls must be discovered dynamically rather than duplicated as a static platform promise: https://www.finra.org/rules-guidance/rulebooks/finra-rules/4210

## Required operating facts

| ID | Question | Why it changes the conclusion | Owner | Status |
|---|---|---|---|---|
| LF-01 | Who is the operator: individual or legal entity, with registered address and control persons? | Determines regulator, liability, filings and contracting party. | Sponsor | Pending |
| LF-02 | Where will the operator, servers and support personnel be located? | Determines establishment, supervision, privacy and cross-border analysis. | Sponsor | Pending |
| LF-03 | Is access strictly limited to the owner, or offered to any other person? | Multi-user access can change advisory, broker/intermediary, privacy and consumer obligations. | Product Owner | Pending |
| LF-04 | Will the platform charge fees, subscriptions, performance compensation, referrals or data-related consideration? | Compensation and conflicts affect advisory/marketing analysis. | Sponsor | Pending |
| LF-05 | Does any output personalize a recommendation using user portfolio, objectives or risk information? | Personalized securities advice can change regulatory classification. | Product Owner | Pending |
| LF-06 | Can the system exercise discretion, rebalance automatically or transmit an order without contemporaneous owner approval? | Discretion/automation materially increases licensing and control exposure. | Product Owner | Pending |
| LF-07 | Which broker entity will contract with the user and is the user eligible in the operating jurisdiction? | Determines account, execution, margin, tax and cross-border constraints. | Solution Architect | Pending |
| LF-08 | Who pays the platform and are there broker, issuer, promoter or vendor affiliations? | Conflicts and promotion/referral rules may apply. | Sponsor | Pending |
| LF-09 | What personal data, financial data, telemetry and communications are collected and why? | Required for privacy roles, lawful bases, notices, DPIA and retention. | Privacy owner | Pending |
| LF-10 | Which countries receive or host personal data and under what transfer mechanism? | Determines cross-border safeguards and vendor terms. | Privacy owner | Pending |
| LF-11 | What market, news, filing and social content will be displayed, stored or redistributed? | Licences may restrict derived data, caching, display, audit retention and AI use. | Data/vendor owner | Pending |
| LF-12 | Will the public site make performance claims, show hypothetical results, testimonials or specific stock outcomes? | Marketing and consumer-protection exposure increases. | Product Owner | Pending |

## Provisional launch constraints

- Local development and paper simulation only until the legal entity, operator jurisdiction and user population are confirmed.
- No public launch, paid access, referral economics, third-party user onboarding or marketing performance claims before qualified review.
- No description of the platform as an adviser, broker, fiduciary, exchange, guaranteed system or SEC-approved service.
- No custody, pooled funds, discretionary third-party trading or order transmission for another person.
- No live broker credentials or controlled-live trading before broker eligibility, data rights, privacy, tax/records, security and regulatory classification are approved.
- Product copy must distinguish objective screening signals from recommendations and disclose that filters do not establish suitability or future performance.
- The broker remains the source for current eligibility, account restrictions, margin, settlement and order availability.

## Counsel deliverable requested

Qualified counsel should return a dated written memorandum identifying the governing entity and jurisdictions; product classification; required registrations/licences or defensible exclusions; public/private launch boundary; broker and data contracting constraints; privacy/controller duties and transfer mechanism; AML/KYC allocation; record periods; approved disclosures; marketing restrictions; tax/reporting referrals; and conditions for paper and controlled-live operation.

