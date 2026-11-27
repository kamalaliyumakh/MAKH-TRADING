# Public Lighthouse remediation

Date: 30 August 2026  
WBS: 4.5  
Result: Local preloaded production-artifact checkpoint passed; formal acceptance pending

## Changes verified

- Both deployed logo copies are 18,063 bytes at 244 × 92. The original 1,220,113-byte source artwork is unchanged.
- The public brand link derives its accessible name from visible text.
- The test-only artifact server no longer applies a CSP that blocks Angular hydration. Production CSP is unchanged and still requires hosting/security approval.
- The server preloads all 24 artifacts before listening, avoiding request-time filesystem hydration. Restart it after rebuilding. It remains loopback-only and read-only.
- Malformed URL encoding returns 400; path containment, missing-route handling and referrer/content-type/frame headers remain enforced.
- The public quality gate rejects a missing logo or one exceeding 32,000 bytes. Both negative cases pass in-memory filesystem fault-injection checks; the optimized artifact passes the normal gate.
- Pinned dependencies were restored outside Documents and native-build approval consolidated in the workspace configuration. See `LOCAL_DEPENDENCY_RECOVERY_2026-08-30.md`.

## Verification

- All 100 Angular tests pass: 26 public, 69 portal and five shared-library tests.
- All seven production builds pass; public SSR prerenders nine routes and the portal contains the optimized logo.
- Nine-route metadata/privacy/bundle checks pass: initial JavaScript 287,459 bytes and CSS 12,058 bytes.
- Desktop/mobile axe and forced-colors/reduced-motion matrices pass, covering 18 cases each.
- Angular boundaries, project formatting, modified-verifier formatting and DevSecOps policy checks pass.
- The final whole-repository secret scan was interrupted after several minutes of cold source-file reads; no refreshed full-scan pass is claimed. This remains a follow-up check, separate from the passing application/browser verification above.
- Server checks pass for home, slash/no-slash platform routes, a missing route, malformed encoding, encoded traversal and byte-identical delivery of the compiled logo.

## Lighthouse results

Lighthouse 13.4.1, desktop preset, loopback server with the immutable production artifact preloaded. Recorded at 2026-08-30T14:59:57Z.

| Route       | Performance | Accessibility | Best practices | SEO  | LCP    | CLS | TBT  |
| ----------- | ----------- | ------------- | -------------- | ---- | ------ | --- | ---- |
| `/`         | 1.00        | 1.00          | 1.00           | 1.00 | 641 ms | 0   | 0 ms |
| `/platform` | 1.00        | 1.00          | 1.00           | 1.00 | 660 ms | 0   | 0 ms |
| `/security` | 1.00        | 1.00          | 1.00           | 1.00 | 637 ms | 0   | 0 ms |

Raw reports and summary: `outputs/public-lighthouse/`. Two earlier failed runs are preserved:

- `2026-08-30-concurrent-first-run/`: performance 1.00 / 1.00 / 0.62 while build/test work ran.
- `2026-08-30-isolated-disk-run/`: performance 0.67 / 0.57 / 0.59 after compilation stopped, but with request-time disk reads. Generated artifacts were observed as `dataless` placeholders; concurrency alone did not explain the issue.

After preloading, the same build passed. This supports filesystem hydration as a local measurement confounder, not a production performance conclusion. The harness change means timing is not a controlled like-for-like comparison with the 28 August disk-served baseline.

## Decision

Retain WBS 4.5 at 91%, `In Progress`; overall formula-weighted completion remains 74.56012332990751% (75% displayed). These fixes improve local evidence, not an outstanding approval gate. Hosted execution/field Core Web Vitals, actual zoom, assistive technology/manual OS sessions, representative validation, approved production facts and accountable acceptance remain pending. No publication or live trading is authorized.
