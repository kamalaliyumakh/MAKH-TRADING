# DevSecOps Foundation Acceptance

Date: 15 October 2026  
WBS: 3.6  
Owner: DevOps Lead  
Status: In progress — 95%

## Executable readiness decision

`node eng/verify-devsecops-foundation-readiness.mjs` validates this acceptance matrix against the committed workflow, policy, scanner, dependency-maintenance and predecessor evidence. The verifier emits `outputs/devsecops-foundation-readiness/readiness-manifest.json` with SHA-256 artifact hashes and an explicit `Implementation Ready / Acceptance Pending` decision.

The 95% maturity reflects complete local control design and refreshed fail-closed verification, including 14 secret-scanner regressions and a clean scan of 727 tracked plus eligible untracked source files. It does not represent hosted CI execution, protected branch/tag enforcement, an externally verifiable SBOM/signature, human approval, deployment authority or trading authority.

## Acceptance evidence

| Criterion | Evidence | Result |
|---|---|---|
| CI quality gates are defined | `quality.yml` builds/tests Angular and .NET and verifies PostgreSQL | Pass locally / hosted run pending |
| Dependency graphs are locked and reviewed | frozen pnpm, locked NuGet, dependency review and audits | Pass locally / hosted review pending |
| Static analysis is configured | CodeQL security-extended for C# and JavaScript/TypeScript | Configured / hosted result pending |
| Secret detection fails closed | local/CI source scanner plus required hosted push protection | Local pass / hosted protection pending |
| SBOM is generated | Anchore/Syft CycloneDX JSON workflow evidence | Configured / hosted artifact pending |
| Release artifacts are signed | isolated tag workflow with keyless Cosign signing and checksums | Configured / controlled tag proof pending |
| Third-party actions are immutable | repository policy requires 40-character commit SHAs | Pass |
| Workflow permissions are minimized | read-only default; OIDC only in tag signing job | Pass |
| Automation cannot deploy/live-trade | release policy rejects deployment commands; no deployment job exists | Pass |
| Maintenance is automated safely | weekly bounded Dependabot PRs; no auto-merge | Pass |

## Local verification record

- DevSecOps workflow-policy check passed.
- Source secret scan passed across 271 eligible files at the WBS 3.8 gate review.
- npm audit reported no known vulnerabilities after overriding Angular CLI's development-only MCP adapter to patched `@hono/node-server` 2.0.10; locked Angular builds/tests passed afterward.
- Existing locked restore, Release build, 20 .NET tests, nine Angular tests, seven Angular builds and PostgreSQL compatibility verification remain the baseline required by CI.
- No credentials, GitHub repository settings, hosted runner, release tag, signature, cloud resource, external artifact or deployment was created.
- On 1 September 2026, all fourteen reader/discovery regression tests, formatting checks and the DevSecOps workflow-policy gate passed; the corrected tracked-plus-eligible-untracked repository scan passed across 589 selected files. See `SECRET_SCAN_DISCOVERY_2026-08-31.md`.

## Remaining acceptance actions

The prior WBS value was 88%. Scanner reliability and discovery evidence is recorded in `SECRET_SCAN_RELIABILITY_2026-08-31.md` and `SECRET_SCAN_DISCOVERY_2026-08-31.md`. The executable readiness consolidation supports 95% while retaining every external enforcement and approval requirement below.

1. DevOps Lead and Security Lead approve the workflow/control policy.
2. Real repository teams are identified and CODEOWNERS/branch/tag rules are configured.
3. A hosted pull request proves every required check and artifact.
4. A controlled non-production release tag proves SBOM, checksum and keyless-signature verification.
5. WBS 3.1 and architecture gate dependencies receive authorized acceptance.

Automated preparation is not human approval. Until these actions are complete, WBS 3.6 remains in progress and no release or deployment authority exists.
