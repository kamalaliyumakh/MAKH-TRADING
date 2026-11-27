# Secret scan discovery checkpoint

Date: 31 August 2026  
WBS: 3.6 — DevSecOps  
Status: Verified locally

## Gap corrected

The previous entry point selected `git ls-files` and only walked the source tree when that result was empty. In a populated Git index, a new untracked source file could therefore be missed. Newline splitting also did not preserve all legal filenames, and Git failures silently changed the scan scope by falling back to a filesystem walk.

## Coverage policy

- In a repository with root `.git` metadata (directory or worktree pointer), retain all tracked files, including tracked ignored files and tracked assets.
- Add untracked files selected by Git's standard ignore policy, restricted by the existing source-extension and generated-directory rules. Ignored untracked local credentials are outside this repository scan; they are not suitable for committing.
- Use NUL-delimited Git output, deduplicate candidates and sort paths. Spaces and newlines in filenames remain intact.
- Fail if Git metadata exists but file discovery fails; do not silently switch coverage policy.
- Without root Git metadata, retain the source-archive filesystem policy. No ignore parser or broader history scan is implied.
- Retain the existing scanner-entry-point exemption and all detection rules. Unreadable selected files still fail the scan.

## Regression evidence

Seven discovery cases pass using isolated temporary repositories/archives: tracked plus new untracked source; ignored/generated-file boundaries; tracked ignored files/assets; whitespace/newline filenames; archive fallback; malformed Git metadata; and a tracked file missing from disk. Integration assertions verify detection of an untracked synthetic credential and read-error rejection after discovery.

The normal scan command now runs these seven tests plus the existing seven reader/detection tests before scanning the workspace. Temporary fixtures are removed after testing; no project Git commits, repository settings, credentials or external services are changed.

Final verification on 1 September 2026 passed all fourteen regression tests, formatting checks, the DevSecOps workflow-policy gate and the corrected repository scan across 589 tracked and eligible untracked files. No secret finding or unreadable selected file was reported; immutable actions, required gates and release-only signing remain enforced by policy.

The 11 September foundation refresh passed the same fourteen regressions and a new fail-closed scan across 591 tracked and eligible untracked files. No finding or unreadable selected file was reported.

## Decision boundary

WBS 3.6 remains 88% and overall completion remains 74.56% (75% displayed). This is local verification hardening, not hosted security approval, Git-history coverage, production readiness or live-trading authorization. Cloud placeholder reads caused explicit timeouts during preparation; local hydration later allowed the final verification to complete without replacing unreadable source files.
