import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/FOUNDATION_GATE_REVIEW.md',
  'docs/engineering/FOUNDATION_GATE_APPROVAL.md',
  'eng/verify-foundation-gate.mjs',
  'outputs/architecture-ux-gate/readiness-manifest.json',
  'outputs/repository-foundation-readiness/readiness-manifest.json',
  'outputs/clean-architecture-readiness/readiness-manifest.json',
  'outputs/angular-foundation-readiness/readiness-manifest.json',
  'outputs/postgresql-foundation-readiness/readiness-manifest.json',
  'outputs/identity-foundation-readiness/readiness-manifest.json',
  'outputs/devsecops-foundation-readiness/readiness-manifest.json',
  'outputs/environment-foundation-readiness/readiness-manifest.json',
];

const contents = new Map();
for (const file of files) {
  contents.set(file, await readFile(path.join(root, file), 'utf8'));
}

const review = contents.get(files[0]);
const approval = contents.get(files[1]);
const gateVerifier = contents.get(files[2]);
const manifests = files.slice(3).map((file) => JSON.parse(contents.get(file)));
const architecture = manifests[0];
const components = manifests.slice(1);
const criterionRows = review.match(/^\| FG-\d{2} \|/gm) ?? [];
const findingRows = review.match(/^\| (?:Foundation work|No hosted|PostgreSQL target|Identity provider|Azure ADR|Recovery objectives|Named accountable)/gm) ?? [];
const decisionRows = approval.match(/^\| Accept /gm) ?? [];

const checks = [
  {
    id: 'twelve-gate-criteria',
    passed: criterionRows.length === 12,
    detail: 'FG-01 through FG-12 are present in the gate review.',
  },
  {
    id: 'seven-findings',
    passed: findingRows.length === 7,
    detail: 'Seven governance, hosting, identity, data and recovery findings remain explicit.',
  },
  {
    id: 'eight-accountable-decisions',
    passed: decisionRows.length === 8 && (approval.match(/\| Pending \|$/gm) ?? []).length === 8,
    detail: 'All eight accountable decisions remain Pending rather than inferred.',
  },
  {
    id: 'architecture-predecessor-deferred',
    passed: architecture.readinessDecision === 'Reject/Defer' && architecture.gateAccepted === false,
    detail: 'WBS 2.8 remains Reject/Defer and grants no foundation-stage authority.',
  },
  {
    id: 'seven-component-manifests',
    passed:
      components.length === 7 &&
      components.every((manifest) => manifest.readinessDecision === 'Implementation Ready / Acceptance Pending'),
    detail: 'WBS 3.1–3.7 each provide executable implementation-ready, acceptance-pending evidence.',
  },
  {
    id: 'component-acceptance-unavailable',
    passed: components.every((manifest) =>
      Object.entries(manifest).some(([key, value]) => key.endsWith('Accepted') && value === false),
    ),
    detail: 'Every component manifest retains an explicit unaccepted state.',
  },
  {
    id: 'fail-closed-gate-disposition',
    passed:
      gateVerifier.includes("localControls: 'PASS'") &&
      gateVerifier.includes("decision: 'DEFER'") &&
      gateVerifier.includes('entryLocked: true') &&
      gateVerifier.includes('liveAuthorized: false'),
    detail: 'The existing gate remains PASS/DEFER, entry-locked and live-disabled.',
  },
  {
    id: 'seven-blocker-categories',
    passed: (gateVerifier.match(/^  '[a-z0-9-]+',?$/gm) ?? []).length === 7,
    detail: 'The gate verifier retains seven unresolved blocker categories.',
  },
  {
    id: 'approval-record-unsigned',
    passed:
      approval.includes('Engineering Lead: ________________________________________________') &&
      approval.includes('Approved electronic record/signature: ________________________________________________'),
    detail: 'No accountable approval or signature is fabricated.',
  },
  {
    id: 'no-downstream-authority',
    passed:
      review.includes('does not authorize provider purchase, public launch, production data') &&
      approval.includes('Automation cannot sign or override this decision'),
    detail: 'The package grants no provisioning, publication, paper or live authority.',
  },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) {
  throw new Error(`Engineering foundation gate checks failed: ${failed.map((check) => check.id).join(', ')}`);
}

const blockers = [
  'WBS 2.8 Architecture and UX Gate remains Reject/Defer.',
  'Component-owner acceptance and authorized Engineering Lead decision remain unavailable.',
  'Hosted clean-checkout CI, CodeQL, dependency, SBOM and signing evidence remain pending.',
  'Approved PostgreSQL 18 migration, privilege and recovery certification remains pending.',
  'Identity-provider and multi-replica protected session/key certification remains pending.',
  'Approved infrastructure, Bicep compilation/deployment and private-connectivity proof remain pending.',
  'Timed recovery, telemetry/alert and reconciliation exercise evidence remains pending.',
];
const artifacts = files.map((file) => ({
  path: file,
  sha256: createHash('sha256').update(contents.get(file)).digest('hex'),
}));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 3.8 Engineering Foundation Gate readiness',
  localControls: 'PASS',
  readinessDecision: 'Reject/Defer',
  gateAccepted: false,
  entryLocked: true,
  waveC2Authorized: false,
  productionProvisioningAuthorized: false,
  publicLaunchAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/engineering-foundation-gate-readiness'), { recursive: true });
await writeFile(
  path.join(root, 'outputs/engineering-foundation-gate-readiness/readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `Engineering foundation gate: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Reject/Defer.`,
);
