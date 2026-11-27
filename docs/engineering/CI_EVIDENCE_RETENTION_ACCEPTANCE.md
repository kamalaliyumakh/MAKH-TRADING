# CI Evidence Retention Acceptance

Date: 2026-08-27  
WBS: 3.6 DevSecOps

## Accepted implementation

- .NET test projects emit collision-safe TRX evidence plus a human-readable test log.
- Angular production-build and test output is retained with the test evidence.
- PostgreSQL role, four-migration and protected-ticket verification output is retained.
- Evidence upload runs even after failure and now fails when no evidence exists.
- The repository policy checker requires these controls and continues to reject floating actions, excessive permissions and deployment behavior in provenance workflows.

## Verification

- DevSecOps workflow policy passed.
- Secret scan passed across 567 source files.
- 314 architecture and 31 API-security tests passed.
- Git whitespace validation passed.

## Remaining boundary

The workflow has not run on an approved hosted repository. Branch protection, required checks, hosted secret scanning, CodeQL entitlement, runner trust, evidence retention and controlled-tag signing must be configured and evidenced by authorized owners. No deployment or live-trading authority is granted.
