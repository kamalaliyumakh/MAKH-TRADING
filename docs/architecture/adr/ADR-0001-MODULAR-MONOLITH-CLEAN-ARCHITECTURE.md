# ADR-0001: Modular Monolith with Clean Architecture

- Status: Accepted
- Date: 12 August 2026
- Decision owners: Solution Architecture and Engineering
- WBS: 2.1

## Context

The platform must combine public web content, authentication, market ingestion, scanner calculations, news/filing evidence, risk evaluation, broker execution, reconciliation, journal and reporting. Several areas may eventually have different throughput and reliability characteristics. However, the first release has one account-owner operating model, unresolved vendor choices and stringent consistency/audit requirements around risk and orders.

A microservice-first design would introduce network failure modes, distributed transactions, duplicated authorization, more operational infrastructure and difficult end-to-end debugging before scale requirements are measured. A traditional layered application without module boundaries would reduce initial effort but would allow trading, reporting and provider concerns to become tightly coupled.

## Decision

Build the first release as a modular monolith organized by Clean Architecture:

- Domain contains business state and invariants and depends on no external implementation.
- Application contains use cases, authorization requirements, ports and transaction orchestration and depends on Domain.
- Infrastructure implements database, identity, broker, market/evidence, notification and file ports.
- API and Worker are independent entry points composed with Application and Infrastructure.
- Business capabilities are vertical modules with explicit contracts and table ownership.
- PostgreSQL is the authoritative platform store; a transactional outbox publishes events.
- The API is stateless and the worker can scale independently.
- High-volume modules may be extracted only after measured need and contract maturity.

## Consequences

### Positive

- Risk, order and reconciliation state can use local transactions.
- Business logic remains testable without PostgreSQL or vendors.
- Deployment and incident response are simpler than a distributed first release.
- Provider selection can change behind ports.
- Module contracts create a controlled path to future extraction.

### Negative

- Poor discipline could still create a tightly coupled monolith.
- Worker and API share deployment-version compatibility requirements.
- Database ownership must be enforced by code review and tests rather than separate physical databases.
- Very high market-event volume may later require a specialized ingestion or time-series component.

## Guardrails

- Architecture tests enforce project dependencies.
- Module Infrastructure is private to the module; no cross-module repository access.
- Cross-module writes occur through Application commands, not shared DbContext manipulation.
- Reporting uses public read contracts/read models rather than private tables.
- All broker submissions require the centralized Risk application contract.
- Extracted services must preserve idempotency, audit correlation and fail-closed behavior.

## Extraction triggers

Consider extracting a module only when at least one condition is demonstrated with production-like evidence:

- Independent scaling cannot be achieved acceptably with separate API/worker replicas.
- Provider stream throughput materially harms order/risk workloads despite isolation and tuning.
- Availability or deployment cadence requires independent ownership.
- A stable contract and data ownership boundary already exists.

Extraction is not approved merely to follow a technology trend.

## Alternatives considered

### Microservices from initial release

Rejected because operational and consistency costs are disproportionate to the initial account model and unresolved requirements.

### Single conventional layered application

Rejected because it provides insufficient business-module ownership and would make future extraction and domain testing harder.

### Serverless functions as primary architecture

Rejected as the primary model because long-lived provider streams, reconciliation, durable ordering and predictable transaction boundaries need explicit service ownership. Serverless functions may still support isolated ancillary jobs where appropriate.

## Validation

- Domain and Application compile without references to Infrastructure or API.
- Architecture tests fail on forbidden project dependencies.
- A broker adapter can be replaced in tests without changing risk/domain code.
- Order proposal, risk decision and outbox event commit atomically in an integration test.
- Scanner and reporting modules cannot invoke broker submission directly.

