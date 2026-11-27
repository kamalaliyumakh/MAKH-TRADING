# MAKH Trading Platform — Security Architecture

Last updated: 12 August 2026

This package is the WBS 2.2 security baseline for the MAKH Trading Platform.

## Contents

- `THREAT_MODEL.md` — scope, assets, trust boundaries, STRIDE analysis and abuse cases.
- `MITIGATION_PLAN.md` — required controls, delivery ownership, residual risk and release gates.
- `SECURITY_TEST_MATRIX.md` — traceability from critical threats to automated and operational tests.
- `../architecture/adr/ADR-0002-BFF-COOKIE-SESSION.md` — browser session architecture decision.

## Security objective

Prevent unauthorized or unsafe trading actions, preserve the integrity and reconstructability of every material decision, and fail closed when identity, risk, market-data or broker truth cannot be established.

This is a design-stage threat model. It must be reviewed when an identity provider, broker, data provider, hosting platform or live operating model is selected, and before each production/live gate.
