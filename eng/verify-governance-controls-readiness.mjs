import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/governance/RAID_REGISTER.md',
  'docs/governance/CHANGE_CONTROL.md',
  'docs/governance/DECISION_LOG.md',
  'docs/governance/QUALITY_MANAGEMENT_PLAN.md',
  'docs/governance/GOVERNANCE_PACK_ACCEPTANCE.md',
  'outputs/integrated-plan-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const raid = contents.get(evidenceFiles[0]);
const change = contents.get(evidenceFiles[1]);
const decisions = contents.get(evidenceFiles[2]);
const quality = contents.get(evidenceFiles[3]);
const acceptance = contents.get(evidenceFiles[4]);
const predecessor = JSON.parse(contents.get(evidenceFiles[5]));

const raidRows = raid.match(/^\| RAID-\d{3} \|/gm) ?? [];
const changeClasses = change.match(/^\| CC-[1-4] /gm) ?? [];
const workflowSteps = change.split('## Workflow')[1]?.split('## Change request template')[0]?.match(/^\d+\. /gm) ?? [];
const requestFields = change.split('## Change request template')[1]?.split('## Initial log')[0]?.split('\n').filter((line) => /^\| [^|-][^|]+ \|/.test(line) && !line.startsWith('| Field |')) ?? [];
const decisionRows = decisions.match(/^\| DEC-\d{3} \|/gm) ?? [];
const pendingDecisionRows = decisions.split('\n').filter((line) => /^\| DEC-\d{3} \|/.test(line) && /\| (?:Pending|Proposed)\s+\|/.test(line));
const objectiveRows = quality.match(/^\| QO-\d{2} \|/gm) ?? [];
const gateRows = quality.split('## Quality gates')[1]?.split('## Defect policy')[0]?.split('\n').filter((line) => /^\| (?:Charter|Discovery|Architecture|Foundation|Public Web|Scanner|Portal|Paper Trading|Operations|Controlled Live) \|/.test(line)) ?? [];
const defectRows = quality.match(/^\| D[1-4] /gm) ?? [];
const preparedRows = acceptance.split('## Evidence checklist')[1]?.split('## Acceptance record')[0]?.split('\n').filter((line) => /^\| [^|-][^|]+ \| `[^`]+` \|/.test(line)) ?? [];
const acceptedPendingRows = preparedRows.filter((line) => /\| Pending \|$/.test(line));
const preparedYesRows = preparedRows.filter((line) => /\| Yes \| Pending \|$/.test(line));
const preparedNoRows = preparedRows.filter((line) => /\| No \| Pending \|$/.test(line));
const acceptanceFields = acceptance.split('## Acceptance record')[1]?.split('## Local readiness verification')[0]?.split('\n').filter((line) => /^\| [^|-][^|]+ \| Pending/.test(line)) ?? [];

const sequential = (prefix, count, width) => Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(width, '0')}`);
const checks = [
  { id: 'twenty-four-raid-items', passed: raidRows.length === 24 && sequential('RAID-', 24, 3).every((id) => raid.includes(`| ${id} |`)), detail: 'The governed register contains exactly RAID-001 through RAID-024.' },
  { id: 'four-change-classes', passed: changeClasses.length === 4 && ['CC-1', 'CC-2', 'CC-3', 'CC-4'].every((id) => change.includes(`| ${id} `)), detail: 'Exactly four change classes define approval and evidence boundaries.' },
  { id: 'change-workflow-and-template', passed: workflowSteps.length === 9 && requestFields.length === 9, detail: 'The change process has nine workflow steps and nine required request fields.' },
  { id: 'fifteen-decisions-with-pending-visible', passed: decisionRows.length === 15 && sequential('DEC-', 15, 3).every((id) => decisions.includes(`| ${id} |`)) && pendingDecisionRows.length > 0, detail: 'DEC-001 through DEC-015 exist and proposed/pending decisions remain visibly unapproved.' },
  { id: 'eight-quality-objectives', passed: objectiveRows.length === 8 && sequential('QO-', 8, 2).every((id) => quality.includes(`| ${id} |`)), detail: 'The plan contains exactly QO-01 through QO-08.' },
  { id: 'ten-quality-gates', passed: gateRows.length === 10, detail: 'Ten lifecycle quality gates name mandatory checks and accountable acceptance.' },
  { id: 'four-defect-severities', passed: defectRows.length === 4 && ['D1', 'D2', 'D3', 'D4'].every((id) => quality.includes(`| ${id} `)), detail: 'The defect policy contains exactly D1 through D4.' },
  { id: 'acceptance-record-pending', passed: preparedRows.length === 6 && acceptedPendingRows.length === 6 && preparedYesRows.length === 5 && preparedNoRows.length === 1 && acceptanceFields.length === 6 && acceptance.includes('Status: Pending authorization'), detail: 'Five controls are prepared, the predecessor is unavailable and all acceptance fields remain Pending.' },
  { id: 'predecessor-and-authority-boundary', passed: predecessor.planApproved === false && predecessor.sponsorApprovalRecorded === false && predecessor.environmentProvisioningAuthorized === false && predecessor.procurementAuthorized === false && predecessor.publicationAuthorized === false && predecessor.liveConfigurationAuthorized === false && predecessor.liveTradingAuthorized === false && acceptance.includes('Preparation, automated validation or Codex review is not Sponsor acceptance.'), detail: 'WBS 0.2 is unavailable and no Sponsor or downstream authority is inferred.' },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Governance controls readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = [
  'WBS 0.2 integrated-plan approval remains unavailable.',
  'Sponsor name, authority and acceptance remain Pending.',
  'Project Manager identity and review date remain Pending.',
  'The governance-pack decision, conditions and durable approval reference remain Pending.',
  'Open RAID items and pending/proposed decisions require accountable human disposition through the governed lifecycle.',
];
const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 0.4 local governance-controls readiness evidence only',
  readinessDecision: 'Prepared / Acceptance Pending',
  governancePackAccepted: false,
  predecessorAccepted: false,
  sponsorAccepted: false,
  downstreamGateAuthorityCreated: false,
  provisioningAuthorityCreated: false,
  procurementAuthorityCreated: false,
  publicationAuthorityCreated: false,
  liveAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};
const outputDirectory = path.join(root, 'outputs/governance-controls-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Governance controls prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; Sponsor acceptance remains Pending and no downstream authority created.`);
