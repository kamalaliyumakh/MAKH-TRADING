# Secret scan reliability checkpoint

Date: 31 August 2026  
WBS: 3.6 — DevSecOps  
Status: Local regression suite and repository scan passed

## Changes

- Replaced sequential reads with at most eight concurrent reads; source discovery and detection categories are unchanged.
- Unreadable files now fail the scan instead of being silently skipped. Read-error payloads and matched credential values are not printed.
- Findings and unreadable paths are sorted for reproducible diagnostics; duplicate candidates are counted once.
- Progress is reported every 50 checked files and at completion. The final count represents files actually scanned, excluding the existing scanner-entry-point exemption.
- The standard `pnpm scan:secrets` command runs the regression suite before the repository scan, so the existing CI invocation also exercises these checks.

## Verification

Seven Node tests pass: clean/deduplicated input and progress; all five detection categories and redaction; unreadable-input rejection; bounded concurrency and deterministic findings; combined findings/read errors; empty input; invalid concurrency.

The initial completed repository run checked 584 source files without findings or unreadable-file failures, closing the interrupted 30 August verification item. The final rerun, including this evidence document, passed across 585 source files; all seven regression tests and the DevSecOps policy check passed again.

The DevSecOps workflow-policy check, changed-file formatting and whitespace checks pass. No Angular, backend, broker or production configuration was changed; the 30 August application build/test evidence is not represented as rerun evidence for this checkpoint.

## Boundary

This local pattern-based scan is not exhaustive secret detection, Git-history scanning, hosted push protection, a penetration test or security approval. Hosted CI execution, repository protections, controlled signing/SBOM proof and accountable acceptance remain pending. WBS 3.6 stays at its existing 88%; no release or live-trading authority is granted.
