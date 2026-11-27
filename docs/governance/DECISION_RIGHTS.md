# MAKH Trading Platform — Decision Rights

Last updated: 12 August 2026

## Decision model

`A` is the single accountable role approving the decision; `R` prepares/recommends; `C` must be consulted; `I` is informed. High-risk decisions require recorded evidence even when one person occupies multiple roles.

| ID | Decision | A | R | C | Required record |
|---|---|---|---|---|---|
| DR-01 | Charter, business mandate and funding | Sponsor | Project Manager | Product Owner | Approved charter |
| DR-02 | Product scope, priority and acceptance | Product Owner | Product/UX/Engineering | Risk, Legal, Security | Scope/change record |
| DR-03 | Material scope, schedule or budget change | Sponsor | Project Manager | Product Owner, leads | Approved change request |
| DR-04 | Architecture and technology standards | Solution Architect | Engineering leads | Security, Data, Operations | ADR/architecture gate |
| DR-05 | Identity/security control and critical finding acceptance | Security Lead | Engineering | Operations, Product, Risk | Security decision/finding record |
| DR-06 | Risk policy and non-bypassable ceilings | Risk Owner | Risk Admin/Engineering | Product, Operations | Versioned policy approval |
| DR-07 | Jurisdiction, legal entity, operating model and disclosures | Legal/Compliance authority | Legal reviewer | Sponsor, Product, Privacy | Legal discovery/approval memo |
| DR-08 | Broker selection and eligibility | Sponsor | Solution Architect | Legal, Risk, Operations, Product | Broker decision record |
| DR-09 | Data/evidence provider selection and permitted use | Data Owner | Solution Architect | Legal, Product, Security | Vendor decision record |
| DR-10 | Hosting, regions, secrets, backups and recovery service | Operations Owner | Solution Architect | Security, Data, Engineering | Hosting ADR |
| DR-11 | UX/product acceptance | Product Owner | UX Lead | Risk, Accessibility, Legal where applicable | Acceptance record |
| DR-12 | Release engineering readiness | Engineering Lead | Engineering/QA | Security, Operations | Build/release evidence |
| DR-13 | Paper trading certification | Risk Owner | QA/Engineering | Product, Operations, Security | Paper certification |
| DR-14 | Operational readiness | Operations Owner | Operations | Security, Engineering, Risk | ORR record |
| DR-15 | Controlled-live go/no-go and capital ceiling | Sponsor | Project Manager | Risk, Security, Legal, Operations, Product | Signed live go/no-go |
| DR-16 | Emergency block/cancel/liquidation | Role defined in active risk policy | Authorized operator | Risk/Operations | MFA, reason and immutable audit |
| DR-17 | Production credential creation/rotation | Operations Owner | Authorized custodian | Security | Secret-access/rotation record |
| DR-18 | External publication | Product Owner | Content/Engineering | Legal, Privacy, Security | Publication approval |

## Escalation

1. Delivery ambiguity: Project Manager and Product Owner resolve within approved scope.
2. Architecture/security/data conflict: relevant accountable leads issue a written recommendation; unresolved material impact escalates to Sponsor.
3. Legal/compliance uncertainty: affected launch capability stops until qualified advice is recorded.
4. Trading-safety uncertainty: new exposure/live enablement stops; Risk Owner and Security/Operations review.
5. Production incident: contain, reconcile and preserve evidence first; decision authority follows the incident/risk policy.

## Prohibited unilateral decisions

No single delivery contributor may authorize live trading, accept a critical authorization/risk bypass, weaken immutable evidence, publish unapproved legal/privacy claims, use production credentials outside approved custody, or expand to third-party managed accounts.
