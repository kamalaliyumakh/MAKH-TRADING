import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/DEVSECOPS_FOUNDATION_ACCEPTANCE.md',
  'docs/security/DEVSECOPS_IMPLEMENTATION.md',
  '.github/workflows/quality.yml',
  '.github/workflows/release-provenance.yml',
  '.github/dependabot.yml',
  'eng/check-devsecops.mjs',
  'eng/discover-secret-files.mjs',
  'eng/scan-secret-files.mjs',
  'outputs/repository-foundation-readiness/current-readiness-manifest.json',
];

const contents = new Map();
for (const file of files) {
  contents.set(file, readFileSync(path.join(root, file), 'utf8'));
}

const acceptance = contents.get(files[0]);
const implementation = contents.get(files[1]);
const quality = contents.get(files[2]);
const release = contents.get(files[3]);
const dependabot = contents.get(files[4]);
const policy = contents.get(files[5]);
const discovery = contents.get(files[6]);
const scanner = contents.get(files[7]);
const entryPoint = policy;
const predecessor = JSON.parse(contents.get(files[8]));

const workflowText = `${quality}\n${release}`;
const actionReferences = [...workflowText.matchAll(/^\s*uses:\s*[^\s#]+@([^\s#]+)/gm)].map(
  (match) => match[1],
);
const acceptanceRows = acceptance.match(/^\| (?!Criterion)[^|]+\|[^\n]+\|[^\n]+\|$/gm) ?? [];

const checks = [
  {
    id: 'ten-acceptance-controls',
    passed: acceptanceRows.length === 10,
    detail: 'The acceptance matrix contains exactly ten DevSecOps controls.',
  },
  {
    id: 'quality-and-database-gates',
    passed:
      quality.includes('--frozen-lockfile') &&
      quality.includes('--locked-mode') &&
      quality.includes('dotnet test') &&
      quality.includes('test:angular') &&
      quality.includes('verify-postgres-foundation.sh') &&
      quality.includes('if-no-files-found: error'),
    detail: 'Locked restore, build, test, PostgreSQL and fail-closed evidence upload gates are defined.',
  },
  {
    id: 'static-and-dependency-analysis',
    passed:
      quality.includes('security-extended') &&
      quality.includes('dependency-review-action') &&
      quality.includes('fail-on-severity: moderate') &&
      quality.includes('package --vulnerable --include-transitive'),
    detail: 'CodeQL, dependency review and transitive vulnerability checks are configured.',
  },
  {
    id: 'fail-closed-secret-scanning',
    passed:
      quality.includes('node eng/scan-secrets.mjs') &&
      discovery.includes("execFileSync('git', ['ls-files'") &&
      scanner.includes('readFile') &&
      entryPoint.includes('scan-secrets.mjs'),
    detail: 'Tracked plus eligible untracked discovery and unreadable-file failure are wired into CI.',
  },
  {
    id: 'sbom-and-keyless-signing',
    passed:
      quality.includes('cyclonedx-json') &&
      release.includes('cosign sign-blob') &&
      release.includes('id-token: write') &&
      release.includes('SHA256SUMS'),
    detail: 'CycloneDX inventory, checksums and keyless signing are configured for v* tags.',
  },
  {
    id: 'immutable-actions-and-least-privilege',
    passed:
      actionReferences.length > 0 &&
      actionReferences.every((reference) => /^[0-9a-f]{40}$/.test(reference)) &&
      quality.includes('permissions:\n  contents: read') &&
      release.includes('permissions:\n  contents: read'),
    detail: 'Every action is SHA-pinned and workflow permissions default to read-only.',
  },
  {
    id: 'no-deployment-authority',
    passed:
      !release.includes('environment: production') &&
      !release.includes('kubectl') &&
      !release.includes('az containerapp') &&
      implementation.includes('cannot deploy, provision infrastructure, enable live trading'),
    detail: 'Release provenance cannot deploy, provision or authorize trading.',
  },
  {
    id: 'bounded-dependency-maintenance',
    passed:
      (dependabot.match(/package-ecosystem:/g) ?? []).length === 3 &&
      (dependabot.match(/interval: weekly/g) ?? []).length === 3 &&
      (dependabot.match(/open-pull-requests-limit: 5/g) ?? []).length === 3,
    detail: 'Weekly npm, NuGet and GitHub Actions proposals are bounded and remain review-gated.',
  },
  {
    id: 'predecessor-and-hosted-proof-pending',
    passed:
      predecessor.foundationAccepted === false &&
      acceptance.includes('hosted pull request') &&
      acceptance.includes('controlled non-production release tag'),
    detail: 'The unaccepted WBS 3.1 predecessor and missing hosted execution remain blockers.',
  },
  {
    id: 'approvals-and-authority-pending',
    passed:
      acceptance.includes('DevOps Lead and Security Lead approve') &&
      acceptance.includes('no release or deployment authority exists'),
    detail: 'Accountable approvals and all release/deployment authority remain unavailable.',
  },
  {
    id: 'current-predecessor-evidence',
    passed:
      predecessor.repositoryFoundationAccepted === false ||
      predecessor.foundationAccepted === false,
    detail: 'The current repository-foundation manifest remains explicitly unaccepted.',
  },
  {
    id: 'pull-request-quality-boundary',
    passed: quality.includes('pull_request:') && quality.includes('push:'),
    detail: 'Quality evidence is configured for pull-request and bounded push execution.',
  },
  {
    id: 'release-tag-boundary',
    passed: release.includes("tags:") && release.includes("'v*'"),
    detail: 'Release provenance is restricted to version-tag evidence generation.',
  },
  {
    id: 'preserved-evidence-contract',
    passed:
      quality.includes('upload-artifact') &&
      release.includes('upload-artifact') &&
      quality.includes('if-no-files-found: error'),
    detail: 'Quality and release evidence are preserved with fail-closed upload behavior.',
  },
  {
    id: 'secret-scan-source-boundary',
    passed:
      discovery.includes('ls-files') &&
      scanner.includes('readFile') &&
      policy.includes('scan-secrets'),
    detail: 'Secret discovery, reading and policy wiring remain explicit and reviewable.',
  },
  {
    id: 'acceptance-decision-boundary',
    passed:
      acceptance.includes('DevOps Lead') &&
      acceptance.includes('Security Lead') &&
      acceptance.includes('no release or deployment authority exists'),
    detail: 'Named accountable acceptance remains separate from local implementation evidence.',
  },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) {
  throw new Error(`DevSecOps readiness checks failed: ${failed.map((check) => check.id).join(', ')}`);
}

const blockers = [
  { id: 'DSB-01', severity: 'Critical', status: 'Open', detail: 'WBS 3.1 and Architecture/UX predecessor acceptance remains unavailable.' },
  { id: 'DSB-02', severity: 'Critical', status: 'Open', detail: 'Hosted pull-request execution remains pending.' },
  { id: 'DSB-03', severity: 'Critical', status: 'Open', detail: 'Preserved hosted quality-run evidence remains pending.' },
  { id: 'DSB-04', severity: 'Critical', status: 'Open', detail: 'Protected main branch rules and required checks remain pending.' },
  { id: 'DSB-05', severity: 'Critical', status: 'Open', detail: 'Protected version-tag rules remain pending.' },
  { id: 'DSB-06', severity: 'Critical', status: 'Open', detail: 'CODEOWNERS and push-protection enforcement remain pending.' },
  { id: 'DSB-07', severity: 'Critical', status: 'Open', detail: 'Controlled non-production release-tag execution remains pending.' },
  { id: 'DSB-08', severity: 'Critical', status: 'Open', detail: 'SBOM, checksum and keyless-signature verification evidence remains pending.' },
  { id: 'DSB-09', severity: 'Critical', status: 'Open', detail: 'DevOps Lead acceptance remains unavailable.' },
  { id: 'DSB-10', severity: 'Critical', status: 'Open', detail: 'Security Lead acceptance remains unavailable.' },
];
const artifacts = files.map((file) => ({
  path: file,
  sha256: createHash('sha256').update(contents.get(file)).digest('hex'),
}));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 3.6 DevSecOps foundation readiness',
  readinessDecision: 'Implementation Ready / Acceptance Pending',
  devSecOpsFoundationAccepted: false,
  hostedCiCertified: false,
  branchAndTagProtectionCertified: false,
  signedReleaseEvidenceVerified: false,
  deploymentAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  releaseAuthorized: false,
  repositoryProtectionsCertified: false,
  devOpsLeadApprovalRecorded: false,
  securityLeadApprovalRecorded: false,
  inventory: {
    acceptanceControls: acceptanceRows.length,
    checks: checks.length,
    blockers: blockers.length,
    artifacts: artifacts.length,
  },
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/devsecops-foundation-readiness'), { recursive: true });
await writeFile(
  path.join(root, 'outputs/devsecops-foundation-readiness/readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await writeFile(
  path.join(root, 'outputs/devsecops-foundation-readiness/current-readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `DevSecOps readiness: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers.`,
);
