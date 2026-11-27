import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/CURRENT_PUBLIC_WEB_MILESTONE_REVIEW.md',
  'docs/engineering/CURRENT_PUBLIC_WEB_MILESTONE_DECISION_REGISTER.md',
  'docs/engineering/CURRENT_PUBLIC_WEB_MILESTONE_EVIDENCE_INDEX.md',
  'outputs/engineering-foundation-gate-readiness/current-readiness-manifest.json',
  'outputs/public-shell-readiness/current-readiness-manifest.json',
  'outputs/public-content-readiness/current-readiness-manifest.json',
  'outputs/public-legal-privacy-readiness/current-readiness-manifest.json',
  'outputs/public-access-request-readiness/current-readiness-manifest.json',
  'outputs/public-quality-readiness/current-readiness-manifest.json',
  'outputs/public-web-milestone/local-evidence-manifest.json',
  'docs/engineering/PUBLIC_QUALITY_ACCEPTANCE.md',
  'docs/engineering/PUBLIC_WEB_MILESTONE_APPROVAL.md',
];
const contents = new Map();
for (const file of files) contents.set(file, readFileSync(path.join(root, file), 'utf8'));

const review = contents.get(files[0]);
const decisions = contents.get(files[1]);
const index = contents.get(files[2]);
const foundation = JSON.parse(contents.get(files[3]));
const shell = JSON.parse(contents.get(files[4]));
const content = JSON.parse(contents.get(files[5]));
const legal = JSON.parse(contents.get(files[6]));
const access = JSON.parse(contents.get(files[7]));
const quality = JSON.parse(contents.get(files[8]));
const local = JSON.parse(contents.get(files[9]));
const qualityAcceptance = contents.get(files[10]);
const legacyApproval = contents.get(files[11]);
const ids = (prefix, count) => Array.from({ length: count }, (_, indexValue) => `${prefix}-${String(indexValue + 1).padStart(2, '0')}`);
const hasInventory = (text, prefix, count) => ids(prefix, count).every((id) => text.includes(id));
const checks = [
  { id: 'fourteen-current-criteria', passed: hasInventory(review, 'PWC', 14) && review.includes('4 LocalPass / 5 Conditional / 4 Fail / 1 Pending'), detail: 'PWC-01–PWC-14 reconcile local, hosted, privacy, operational and approval states.' },
  { id: 'ten-open-blockers', passed: hasInventory(review, 'PWB', 10) && (review.match(/^\| PWB-\d{2} \| (Critical|High) \|/gm) ?? []).length === 10, detail: 'PWB-01–PWB-10 remain explicit Critical/High blockers.' },
  { id: 'twelve-exit-steps', passed: (review.match(/^\d+\. /gm) ?? []).length === 12, detail: 'The milestone has a twelve-step accountable exit sequence.' },
  { id: 'bounded-preparation', passed: review.includes('## Permitted preparation') && review.includes('## Authority boundary') && review.includes('analytics, personal-data transmission and production identity disabled'), detail: 'Preparation remains local, synthetic and non-public.' },
  { id: 'ten-pending-decisions', passed: hasInventory(decisions, 'PWD', 10) && (decisions.match(/^\| PWD-\d{2} \| .* \| Pending \|/gm) ?? []).length === 10, detail: 'PWD-01–PWD-10 remain Pending.' },
  { id: 'eight-pending-approval-fields', passed: hasInventory(decisions, 'PWA', 8) && (decisions.match(/^\| PWA-\d{2} \| .* \| Pending \|/gm) ?? []).length === 8, detail: 'PWA-01–PWA-08 remain Pending.' },
  { id: 'twelve-evidence-items', passed: hasInventory(index, 'PWE', 12), detail: 'PWE-01–PWE-12 define the hydrated evidence package.' },
  { id: 'unavailable-evidence-fails-closed', passed: index.includes('cloud-dataless') && index.includes('not treated as current proof') && review.includes('PWB-09'), detail: 'Unavailable legacy evidence is a blocker, not proof.' },
  { id: 'foundation-predecessor-rejected', passed: String(foundation.readinessDecision).includes('Reject / Defer') && foundation.gateAccepted === false && foundation.waveC2Authorized === false, detail: 'WBS 3.8 remains rejected/deferred and creates no public-release authority.' },
  { id: 'shell-and-content-unaccepted', passed: shell.schemaVersion === 3 && shell.shellAccepted === false && shell.publicLaunchAuthorized === false && content.schemaVersion === 3 && content.contentAccepted === false && content.publicLaunchAuthorized === false, detail: 'Current WBS 4.1–4.2 evidence remains locally ready and unaccepted.' },
  { id: 'legal-privacy-unaccepted', passed: legal.schemaVersion === 3 && legal.legalPrivacyAccepted === false && legal.qualifiedLegalApprovalRecorded === false && legal.publicLaunchAuthorized === false, detail: 'Current WBS 4.3 lacks qualified acceptance.' },
  { id: 'access-request-disabled', passed: access.schemaVersion === 3 && access.accessRequestAccepted === false && access.productionCaptureEnabled === false && access.personalDataCaptureAuthorized === false, detail: 'Current WBS 4.4 production personal-data flow remains disabled.' },
  { id: 'quality-hosted-acceptance-pending', passed: quality.schemaVersion === 3 && quality.qualityAccepted === false && quality.hostedQualityCertified === false && quality.publicLaunchAuthorized === false && qualityAcceptance.includes('Hosted execution/field performance'), detail: 'Current WBS 4.5 local quality is ready but hosted/accountable acceptance is pending.' },
  { id: 'recursive-local-evidence', passed: local.localEvidenceChecksPassed === true && local.verification?.hashedPrerenderedRoutes === 9 && local.verification?.hashedBrowserArtifacts === 24 && local.verification?.hashedAcceptanceRecords === 5, detail: 'The local manifest hashes nine routes, twenty-four browser artifacts and five acceptance records.' },
  { id: 'local-boundaries-unaccepted', passed: local.releaseAuthorized === false && local.verification?.actualZoomAccepted === false && local.verification?.hostedExecutionAccepted === false, detail: 'Release, actual zoom and hosted execution remain unaccepted.' },
  { id: 'reject-defer-no-authority', passed: review.includes('Reject / Defer') && decisions.includes('cannot publish') && legacyApproval.includes('Codex cannot provide this approval'), detail: 'The milestone remains rejected/deferred, unsigned and non-public.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Public Web Milestone verification failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = ids('PWB', 10).map((id) => {
  const parts = review.split('\n').find((line) => line.startsWith(`| ${id} |`)).split('|');
  return { id, severity: parts[2].trim(), summary: parts[3].trim(), status: 'Open' };
});
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 4.6 current Public Web Milestone evidence only',
  localControls: 'PASS / qualified hydrated evidence',
  readinessDecision: 'Reject / Defer — External Acceptance, Production Controls and Public-Release Approval Pending',
  milestoneAccepted: false,
  exceptionApproved: false,
  publicLaunchAuthorized: false,
  publicUrlAuthorized: false,
  dnsTlsChangeAuthorized: false,
  hostingDeploymentAuthorized: false,
  productionIdentityAuthorized: false,
  personalDataCaptureAuthorized: false,
  analyticsAuthorized: false,
  notificationDeliveryAuthorized: false,
  externalUserAuthorityCreated: false,
  fundedBrokerageAuthorized: false,
  paperTrialAuthorized: false,
  brokerOrderAuthorized: false,
  pilotAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  inventory: {
    criteria: 14,
    checks: checks.length,
    blockers: blockers.length,
    decisions: 10,
    approvalFields: 8,
    artifacts: artifacts.length,
    currentComponentManifests: 5,
  },
  checks,
  blockers,
  artifacts,
};
const directory = path.join(root, 'outputs/public-web-milestone-readiness');
await mkdir(directory, { recursive: true });
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(directory, 'current-readiness-manifest.json'), serialized, 'utf8');
await writeFile(path.join(directory, 'readiness-manifest.json'), serialized, 'utf8');
console.log(`Public Web Milestone remains Reject / Defer: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} open blockers; no public URL, data capture, analytics, deployment, paper, pilot or live authority was created.`);
