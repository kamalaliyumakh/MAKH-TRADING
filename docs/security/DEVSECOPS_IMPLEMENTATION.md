# DevSecOps Implementation

Date: 12 August 2026  
WBS: 3.6  
Status: Provider-neutral foundation implemented; hosted enforcement pending

## Control objective

Every proposed change must produce reproducible build, test, database, security and supply-chain evidence before merge. A release tag may package and sign evidence, but cannot deploy, provision infrastructure, enable live trading or create external authority.

## Pull-request and main-branch controls

`.github/workflows/quality.yml` uses least-privilege read access by default and immutable commit-SHA action references. It provides:

1. Exact Node, pnpm and .NET toolchains with frozen npm and locked NuGet restores.
2. Formatting, Angular boundary and DevSecOps policy validation.
3. Release builds, Angular tests, .NET tests and PostgreSQL role/migration verification.
4. CodeQL extended analysis for C# and JavaScript/TypeScript.
5. Pull-request dependency review blocking moderate-or-higher vulnerabilities and AGPL dependencies.
6. Repository secret-pattern scanning with no allowlist or committed secret fixture.
7. pnpm and NuGet transitive vulnerability inspection.
8. CycloneDX JSON SBOM and bounded-retention test/SBOM evidence.

The build job now retains uniquely named TRX results, readable .NET and Angular logs, Angular production-build output and PostgreSQL migration/security verification output. Evidence upload runs under `always()` and fails closed if no files were produced.

The repository-local `eng/check-devsecops.mjs` rejects floating action tags, missing security gates, excess pull-request permissions and release workflows containing known deployment commands. `eng/scan-secrets.mjs` provides a deterministic local/CI preflight for common high-confidence credential forms. Hosted platform secret protection should remain enabled as a second, independent layer.

## Release provenance boundary

`.github/workflows/release-provenance.yml` runs only for `v*` tags. It builds the API, Worker and Angular applications from locked dependencies, packages outputs, generates a CycloneDX release SBOM, uses GitHub OIDC for keyless Sigstore/Cosign signing, records SHA-256 checksums and uploads evidence without publishing a release or deploying an environment.

The workflow has `id-token: write` only in the signing job and retains `contents: read`. A protected tag/release approval policy, known repository owner, release naming/versioning rule and authorized artifact destination are prerequisites to hosted use.

## Dependency maintenance

Dependabot proposes weekly npm, NuGet and GitHub Actions updates with bounded open pull requests. All updates remain subject to the same quality workflow; automation cannot merge or release.

## Hosted controls still required

- Connect the repository to the approved Git hosting organization.
- Configure protected `main` and `v*` tag rules, required checks, no force-push and authorized reviewers.
- Configure CODEOWNERS after real GitHub teams/users are known; no identity was fabricated in this repository.
- Enable GitHub secret scanning/push protection and verify CodeQL/security-event entitlement.
- Confirm action allowlisting, runner trust, retention, dependency-review availability and Sigstore policy.
- Execute the workflows on a hosted pull request and controlled test tag, then preserve run URLs/digests.
- Define release artifact storage and deployment approvals in WBS 3.7; signing does not authorize deployment.

## Failure handling

All quality and supply-chain checks fail the job on findings. A failed or missing required check blocks promotion after branch protection is configured. Exceptions require an owner, rationale, expiry, compensating control and Security/Engineering approval; they are not encoded as silent workflow bypasses.
