# Public Access-Request Data Minimization

Date: 28 August 2026  
WBS: 4.4  
Result: Local preview checkpoint passed

## Change

- Replaced normalized email-address map keys with lowercase/trimmed SHA-256 lookup digests.
- Duplicate requests still resolve to the original daily local reference without retaining the submitted email address as a service key.
- Honeypot screening remains outside the three-request rolling window and produces no network request.
- The local three-attempt-per-minute fail-closed boundary remains enforced.

## Verification

- Three focused service cases cover normalized duplicate matching, honeypot screening without request-limit consumption and fourth-attempt throttling.
- The public application suite passes 26 tests across two files.
- Production SSR build succeeds and prerenders all nine routes.

## Boundary

The digest is a local data-minimization safeguard, not approved pseudonymization for production. The service remains browser-memory-only and sends no HTTP request, notification or database write. Durable encrypted storage, server-side keyed lookup/idempotency, edge/WAF controls, retention/deletion, privacy-controller facts and accountable approval remain required before real capture.
