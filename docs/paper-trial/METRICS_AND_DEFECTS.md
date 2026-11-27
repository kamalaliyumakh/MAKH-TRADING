# Paper-Trial Metrics and Defect Framework

## Measurement rules

- Use UTC timestamps and the exact release/config/policy/source versions.
- Report numerator, denominator, exclusions and confidence limitation; never show a percentage alone.
- Separate user abandonment, policy rejection, dependency failure, platform defect and broker outcome.
- Strategy outcomes are exploratory paper observations, not evidence of future profit.
- No target may encourage bypassing risk controls, overtrading or suppressing defects.

## Proposed metrics

| Metric | Definition | Proposed readiness threshold | Gate effect |
|---|---|---|---|
| Unauthorized accepted commands | accepted commands lacking valid subject/account/permission/MFA | 0 | any occurrence stops trial |
| Duplicate broker orders | duplicate provider orders per unique approved intent | 0 | any occurrence D1 |
| Risk bypasses | accepted proposal/order when any mandatory rule failed/unknown | 0 | any occurrence D1 |
| Paper/live crossover | live-capable endpoint/account/credential/config observed | 0 | any occurrence D1 |
| Reconciliation closure | mismatches resolved with evidence / total mismatches | 100%; no silent deletion | unresolved blocks gate |
| Unknown-outcome containment | unknown outcomes that blocked blind retry / total unknown outcomes | 100% | miss is D1/D2 |
| Order terminal convergence | orders reaching broker-consistent terminal/known state / eligible orders | target approved before run | disclose aging |
| Protection coverage | protected quantity / open quantity after approved window | 100% unless accepted scenario | undercoverage blocks entries |
| Availability | successful eligible requests / eligible requests | threshold from approved SLO | material miss blocks |
| Risk decision latency | receipt-to-decision p50/p95/p99 | p95 ≤250 ms proposed | sustained miss investigated |
| Portal API latency | server duration p50/p95/p99 | p95 ≤500 ms proposed | sustained miss investigated |
| Recovery objectives | measured RPO/RTO for approved failure modes | within approved objectives | failure blocks ORR/paper gate |
| Critical-flow accessibility | passing checks / required browser/AT/zoom/input matrix | 100% critical controls | D2 blocks gate |
| Scenario completion | passed with evidence / mandatory scenarios | 100% | incomplete blocks report |

Thresholds remain proposed until accountable approval. Zero-event metrics need demonstrated opportunity/exposure counts.

## Defects

Use D1–D4 from `docs/governance/QUALITY_MANAGEMENT_PLAN.md`. Each defect records scenario/run, build/config, severity rationale, safety containment, owner, target, evidence, fix version, independent retest and closure authority.

- D1: stop immediately, block new entries and promotion, E1 escalation.
- D2: block affected trial/gate and prioritize correction/retest.
- D3: continue only if unaffected scope is explicit and owner/date are accepted.
- D4: backlog with documented priority.

Reclassification requires QA plus the accountable risk/security/product role. Reopening preserves prior history. Defects are never removed to improve metrics.
