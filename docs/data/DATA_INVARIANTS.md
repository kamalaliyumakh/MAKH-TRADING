# MAKH Trading Platform — Data Invariants

Last updated: 12 August 2026

These invariants must be enforced by a combination of PostgreSQL constraints, transactions, application rules and automated tests. Client-side validation is never sufficient.

| ID | Invariant | Database enforcement | Application/test enforcement |
|---|---|---|---|
| DI-001 | Paper and live account identity cannot be ambiguous | non-null mode; provider/account/mode unique | environment allowlist and startup assertion |
| DI-002 | External identity belongs to one platform user | unique issuer/subject | issuer/audience validation and linking workflow |
| DI-003 | Every order proposal has one stable client request identity | unique account/client-request ID | request hash conflict returns error, exact replay returns prior result |
| DI-004 | Every submitted order has an approved unexpired decision for the exact proposal/account/mode | unique proposal decision; FK references | canonical digest, policy/snapshot binding and expiry recheck |
| DI-005 | One intended order cannot map to multiple broker submissions | unique client-order ID; provider-order uniqueness | concurrency/idempotency and query-before-retry tests |
| DI-006 | Execution effect occurs once | provider/account/execution ID unique | inbox dedupe and transactional position update |
| DI-007 | Order state changes are monotonic and reconstructable | unique order/version; append-only events | state-machine transition rules and out-of-order tests |
| DI-008 | Historical risk decisions, rule results, executions and audit events are immutable | runtime role has no UPDATE/DELETE; FK restrict | architecture/repository tests and tamper alarms |
| DI-009 | Published policy effective periods cannot overlap | exclusion/range constraint where practical | policy publication transaction and boundary tests |
| DI-010 | Quote prices and quantities are internally valid | positive/non-negative checks; bid ≤ ask when present | schema, outlier and freshness validation |
| DI-011 | Bars are arithmetically coherent | non-negative volume; low ≤ open/close/high | correction/version and property tests |
| DI-012 | Security symbol mappings do not overlap for the same venue/symbol | exclusion constraint on effective range | corporate-action replay tests |
| DI-013 | Position projection cannot silently lose concurrent fills | row version/fencing and execution uniqueness | retry transaction and broker reconciliation |
| DI-014 | Outbox facts correspond to committed aggregate state | same local transaction; aggregate/version key | publisher retry and consumer idempotency tests |
| DI-015 | Reconciliation mismatch blocks affected new exposure | mismatch state and account/scope index | risk health gate and game-day test |
| DI-016 | Timestamps preserve source and receipt context | non-null UTC receipt; source time retained | trusted clock/drift/future-time validation |
| DI-017 | Social evidence alone cannot become verified catalyst authority | evidence trust/source class and separate verification fact | verification policy and order-flow test |
| DI-018 | Deletion cannot remove records under legal/security hold | hold record checked by deletion procedure | authorized workflow, dry-run manifest and audit |

## Concurrency pattern

Mutable aggregates (`orders`, `positions`, connection state and job leases) carry a monotonically increasing version. Updates use `WHERE id = ... AND version = expected`; zero affected rows causes reload/re-evaluation. Worker leases use fencing tokens so an expired worker cannot later overwrite a newer owner.

## Delete pattern

There are no general-purpose cascade deletes across trading, risk, evidence or audit history. User-facing deletion requests create a reviewed erasure job that discovers eligible data, checks holds/relationships, produces a manifest, anonymizes or deletes only approved fields, and writes an audit result. Cryptographic/object deletion is used only where policy and evidence requirements allow it.

## Required database integration tests

Each invariant above receives a PostgreSQL integration test. DI-003 through DI-009 and DI-13 through DI-15 are paper-trading release blockers; DI-001 through DI-018 must pass before controlled live.
