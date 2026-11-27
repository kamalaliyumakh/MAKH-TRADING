# MAKH Trading — Authenticated Portal Smoke UAT

Test date: 24 August 2026  
Environment: Local Angular trading portal on port 4200  
Prerequisite: Browser-session UAT registration, email verification, password authentication and MFA completed

## Executive result

**PASS — all primary authenticated portal routes render after MFA.**

The test used a fresh UAT identity and exercised the complete registration → email verification → password → MFA sequence before visiting each portal destination. No route returned to login while the valid 30-minute session was active, and no protected route was exposed before authentication.

## Route results

| ID            | Route               | Expected protected surface | Result |
| ------------- | ------------------- | -------------------------- | ------ |
| UAT-PORTAL-01 | `/app`              | Trading dashboard          | Pass   |
| UAT-PORTAL-02 | `/app/scanner`      | Candidate scanner          | Pass   |
| UAT-PORTAL-03 | `/app/trading`      | Paper trading              | Pass   |
| UAT-PORTAL-04 | `/app/risk`         | Risk console               | Pass   |
| UAT-PORTAL-05 | `/app/journal`      | Trading journal            | Pass   |
| UAT-PORTAL-06 | `/app/reports`      | Reports                    | Pass   |
| UAT-PORTAL-07 | `/app/admin`        | Administration             | Pass   |
| UAT-PORTAL-08 | `/app/symbols/SYNB` | SYNB symbol workspace      | Pass   |

## Safety observations

- The portal consistently displays `Paper mode · Foundation only` and an `Entry locked` status.
- Dashboard data is identified as synthetic and not broker-authoritative.
- The risk console fails closed when authenticated risk context is unavailable.
- Risk pause controls remain unavailable, and consequential kill-switch actions remain review-only.
- Scanner and symbol surfaces do not authorize or submit trades.

## Acceptance boundary

This is local route/rendering smoke evidence, not production acceptance. API authorization, account isolation, provider-backed identity, data persistence, broker/risk/reconciliation authority, accessibility certification, performance/load evidence, cross-browser coverage and independent security testing remain mandatory.

No paper-trading trial, controlled-live pilot or production release is authorized by this result.
