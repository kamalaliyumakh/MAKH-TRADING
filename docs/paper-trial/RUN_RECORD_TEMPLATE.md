# Paper-Trial Run Record — TEMPLATE

Status: **Not executed**

## Identity

| Field                                             | Value |
| ------------------------------------------------- | ----- |
| Run ID / UTC start-end                            |       |
| Trial week/session                                |       |
| Release artifact digest                           |       |
| Environment/config/migration versions             |       |
| Paper broker/account reference                    |       |
| Market/evidence sources and rights record         |       |
| Risk policy/strategy version                      |       |
| Participants and roles                            |       |
| Start authorization record                        |       |
| Prior manifest SHA-256 / current manifest SHA-256 |       |

## Start checks

Record PAPER separation, identity/MFA, health, freshness, reconciliation, entry state, open defects, monitoring and evidence capture as Pass/Fail with references. Any Fail prevents start.

## Scenario results

| Scenario/repetition | UTC | Expected | Actual | Correlation/audit evidence | Reconciliation | Defect | Reviewer |
| ------------------- | --- | -------- | ------ | -------------------------- | -------------- | ------ | -------- |
|                     |     |          |        |                            |                |        |          |

## Metrics and deviations

Record raw numerator/denominator/percentile samples, exclusions, collection query/version and evidence location. Describe deviations from protocol and authorization.

## End checks

Record entry block, broker/platform order-execution-position-cash reconciliation, open exposure/protection, evidence manifest checksum, incidents/defects and continuation decision.

The evidence manifest must list each retained artifact with media type, byte length and SHA-256 digest, bind the prior run manifest when one exists, and use a unique run ID. Missing evidence, duplicate run identity or a broken hash chain invalidates the run.

## Sign-off

| Role        | Name | Decision | Date/time | Evidence/signature reference |
| ----------- | ---- | -------- | --------- | ---------------------------- |
| Trial Owner |      |          |           |                              |
| Risk        |      |          |           |                              |
| Operations  |      |          |           |                              |
| QA          |      |          |           |                              |

Do not duplicate this template as a passing record until an authorized run has actually occurred.
