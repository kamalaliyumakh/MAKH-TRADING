# MAKH Trading Platform — API Contract Baseline

Last updated: 12 August 2026  
WBS evidence: 2.4 — OpenAPI, SignalR, errors and idempotency

## Contents

- `openapi.yaml` — OpenAPI 3.1 baseline for critical REST resources and commands.
- `REST_CONVENTIONS.md` — versioning, authorization, concurrency, pagination and caching rules.
- `ERROR_AND_IDEMPOTENCY.md` — RFC 9457 problem details and mutation replay behavior.
- `SIGNALR_EVENTS.md` — authorized real-time event envelopes, sequencing and snapshot recovery.
- `CONTRACT_TEST_MATRIX.md` — contract linting, negative authorization and safety verification.
- `../architecture/adr/ADR-0004-REST-SIGNALR-CONTRACTS.md` — transport contract decision.

The OpenAPI file is the design baseline. Generated clients and executable API tests become implementation evidence in Wave C1 and later feature waves.
