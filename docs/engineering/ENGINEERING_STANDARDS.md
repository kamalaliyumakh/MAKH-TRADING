# Engineering Standards

Date: 12 August 2026  
WBS: 3.1  
Status: Repository baseline

## Toolchain

- .NET SDK 10.0.400, pinned by `global.json` with latest-patch roll-forward.
- Node.js 24.15.0, pinned by `.node-version` and `.nvmrc`.
- pnpm 10.27.0, pinned by `packageManager` and the lockfile.
- Angular framework/compiler 22.1.1, Angular CLI 22.1.3 and TypeScript 6.0.3, exact-pinned for deterministic foundation work.

Developers may use a compatible patch after an approved dependency update. Toolchain changes require a reviewable lock/configuration change and successful foundation checks.

## Repository rules

- `apps/` contains deployable Angular applications; `libs/` contains reusable Angular/TypeScript libraries.
- `src/` and `tests/` contain the Clean Architecture solution created in WBS 3.2.
- `deploy/` contains container and infrastructure-as-code assets; secrets never enter the repository.
- Generated output, dependencies, local SDKs and developer-only configuration remain ignored.
- Every production project enables nullable analysis, implicit usings, deterministic builds and warnings-as-errors.
- NuGet versions are centrally managed; npm dependencies are exact-pinned and installed from the frozen pnpm lockfile. pnpm peer checks are advisory because Angular CLI 22.1.3 currently resolves an internal `listr2` patch mismatch; the exact lockfile remains authoritative.

## Change quality

1. Keep changes scoped to one reviewable work package or vertical slice.
2. Add or update tests for behavior, contracts and architecture boundaries.
3. Run formatting, compile, tests and relevant security/accessibility checks.
4. Do not suppress warnings broadly; document any narrow exception with owner and removal condition.
5. Do not commit credentials, provider payloads containing restricted data, production exports or personal data.
6. Preserve paper/live separation and fail-closed risk/order behavior in every layer.

## Verification

Run `eng/verify-foundation.sh` with the pinned Node and .NET executables on `PATH`. Application/project builds, tests, PostgreSQL compatibility and DevSecOps policy checks are mandatory.

## CI and supply-chain rules

- Third-party GitHub Actions must be pinned to full commit SHAs and reviewed through Dependabot pull requests.
- Pull requests must pass locked restores, builds, tests, database verification, CodeQL, dependency review, secret scanning, vulnerability inspection and SBOM generation after hosted branch protection is configured.
- Workflow permissions default to read-only. OIDC token permission is restricted to release-evidence signing on protected `v*` tags.
- Signing produces provenance evidence only. Deployment, production configuration and live capability require separate WBS 3.7 and controlled-live approvals.
- No automated dependency update may merge or release without the same required checks and authorized review.
