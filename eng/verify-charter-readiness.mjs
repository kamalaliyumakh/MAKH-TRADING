import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/governance/PROJECT_CHARTER.md',
  'docs/governance/DECISION_RIGHTS.md',
  'docs/governance/RACI_MATRIX.md',
  'docs/governance/CHARTER_APPROVAL.md',
  'docs/governance/README.md',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const charter = contents.get(evidenceFiles[0]);
const decisions = contents.get(evidenceFiles[1]);
const raci = contents.get(evidenceFiles[2]);
const approval = contents.get(evidenceFiles[3]);
const readme = contents.get(evidenceFiles[4]);

const decisionIds = Array.from({ length: 18 }, (_, index) => `DR-${String(index + 1).padStart(2, '0')}`);
const decisionRows = decisions.match(/^\| DR-\d{2} \|/gm) ?? [];
const raciRows = raci
  .split('\n')
  .filter((line) => /^\| [^|]+ \| (?:A|A\/R|R|C|I|—)(?: \| (?:A|A\/R|R|C|I|—)){10} \|$/.test(line));
const namedRoleRows = approval.match(/^\| (?:Sponsor|Product Owner|Project Manager|Risk Owner|Security Lead|Legal\/Compliance reviewer) \| Pending \| Pending \| Pending \| Pending \|$/gm) ?? [];
const pendingChecklistRows = approval.match(/^\| [^|]+ \| Pending \|$/gm) ?? [];
const stageRows = charter
  .split('\n')
  .filter((line) => /^\| (?:Charter|Discovery|Architecture & UX|Foundation|Public web|Scanner\/data|Evidence\/portal|Paper trading|Operational readiness|Controlled live) \|/.test(line));
const guardrailSection = charter.split('## 5. Non-negotiable guardrails')[1]?.split('## 6. Governance roles')[0] ?? '';
const guardrails = guardrailSection.match(/^- /gm) ?? [];

const checks = [
  {
    id: 'charter-scope-and-guardrails',
    passed: charter.includes('WBS: 0.1') && guardrails.length === 9 &&
      charter.includes('Paper before controlled live') && charter.includes('No external publication, live order or production credential'),
    detail: 'The WBS 0.1 charter contains nine non-negotiable guardrails and preserves paper-first authority boundaries.',
  },
  {
    id: 'ten-stage-gates',
    passed: stageRows.length === 10,
    detail: 'The charter defines exactly ten accountable stage gates.',
  },
  {
    id: 'eighteen-decision-rights',
    passed: decisionRows.length === 18 && decisionIds.every((id) => decisions.includes(`| ${id} |`)),
    detail: 'Decision rights contain exactly DR-01 through DR-18.',
  },
  {
    id: 'fifteen-raci-activities',
    passed: raciRows.length === 15 && raci.includes('Each row has one accountable role.'),
    detail: 'The RACI contains fifteen governed activities and the one-accountable-role control.',
  },
  {
    id: 'six-named-roles-pending',
    passed: namedRoleRows.length === 6,
    detail: 'All six mandatory charter role confirmations remain Pending.',
  },
  {
    id: 'six-approval-items-pending',
    passed: pendingChecklistRows.length === 6 && approval.includes('Status: Awaiting named-role confirmation and Sponsor approval'),
    detail: 'All six charter approval checklist items remain Pending.',
  },
  {
    id: 'no-inferred-sponsor-approval',
    passed: approval.includes('Codex cannot provide or infer this approval.') &&
      approval.includes('WBS 0.1 remains in progress') && !approval.includes('Status: Approved'),
    detail: 'The approval record remains unsigned and does not infer Sponsor authority.',
  },
  {
    id: 'governance-package-boundary',
    passed: readme.includes('WBS 0.1 remains in progress until the Sponsor and Product Owner are named') &&
      charter.includes('Human/vendor/legal approvals are never inferred from technical completion.'),
    detail: 'The package distinguishes prepared governance evidence from human approval.',
  },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Charter readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = [
  'Sponsor identity and authority are not confirmed.',
  'Product Owner identity and authority are not confirmed.',
  'Project Manager, Risk Owner, Security Lead and qualified Legal/Compliance reviewer are not confirmed.',
  'All six charter approval checklist items remain Pending.',
  'No authorized Sponsor approval record exists.',
];

const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 0.1 local charter readiness evidence only',
  readinessDecision: 'Prepared / Approval Pending',
  charterApproved: false,
  sponsorConfirmed: false,
  productOwnerConfirmed: false,
  downstreamGateAuthorityCreated: false,
  environmentProvisioningAuthorized: false,
  procurementAuthorized: false,
  publicationAuthorized: false,
  liveTradingAuthorized: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/charter-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log(
  `Charter readiness prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; approval remains Pending and no downstream, provisioning, procurement, publication or live authority created.`,
);
