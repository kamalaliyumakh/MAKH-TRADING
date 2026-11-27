import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/CURRENT_OPERATIONAL_READINESS_REVIEW.md',
  'docs/engineering/CURRENT_OPERATIONAL_READINESS_DECISION_REGISTER.md',
  'docs/engineering/CURRENT_OPERATIONAL_READINESS_EVIDENCE_INDEX.md',
  'outputs/paper-trading-gate/current-readiness-manifest.json',
  'outputs/notification-readiness/readiness-manifest.json',
  'outputs/reporting-readiness/readiness-manifest.json',
  'outputs/audit-export-readiness/readiness-manifest.json',
  'outputs/administration-readiness/readiness-manifest.json',
  'outputs/observability-readiness/readiness-manifest.json',
  'outputs/recovery-readiness/readiness-manifest.json',
  'outputs/operational-readiness/current-evidence-manifest.json',
  'docs/engineering/OPERATIONAL_READINESS_REVIEW.md',
  'docs/engineering/OPERATIONAL_READINESS_DECISION_REGISTER.md',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const review = contents.get(files[0]);
const decisions = contents.get(files[1]);
const index = contents.get(files[2]);
const paper = JSON.parse(contents.get(files[3]));
const notification = JSON.parse(contents.get(files[4]));
const reporting = JSON.parse(contents.get(files[5]));
const auditExport = JSON.parse(contents.get(files[6]));
const administration = JSON.parse(contents.get(files[7]));
const observability = JSON.parse(contents.get(files[8]));
const recovery = JSON.parse(contents.get(files[9]));
const previous = JSON.parse(contents.get(files[10]));
const legacyReview = contents.get(files[11]);
const legacyDecisions = contents.get(files[12]);
const ids = (prefix, count) => Array.from({ length: count }, (_, indexValue) => `${prefix}-${String(indexValue + 1).padStart(2, '0')}`);
const hasInventory = (text, prefix, count) => ids(prefix, count).every((id) => text.includes(id));
const localManifestPasses = (manifest) => manifest.checks?.length === 12 && manifest.checks.every((check) => check.passed);
const checks = [
  { id: 'fifteen-current-criteria', passed: hasInventory(review, 'OPC', 15) && review.includes('1 LocalPass / 6 Conditional / 7 Fail / 1 Pending'), detail: 'OPC-01–OPC-15 reconcile local, deployed, exercise, support and approval states.' },
  { id: 'ten-open-blockers', passed: hasInventory(review, 'OPB', 10) && (review.match(/^\| OPB-\d{2} \| (Critical|High) \|/gm) ?? []).length === 10, detail: 'OPB-01–OPB-10 remain explicit Critical/High blockers.' },
  { id: 'fourteen-exit-steps', passed: (review.match(/^\d+\. /gm) ?? []).length === 14, detail: 'The ORR has a fourteen-step accountable exit sequence.' },
  { id: 'bounded-preparation', passed: review.includes('## Permitted preparation') && review.includes('## Authority boundary') && review.includes('entry lock'), detail: 'Preparation remains local, synthetic, entry-locked and non-operational.' },
  { id: 'ten-pending-decisions', passed: hasInventory(decisions, 'OPD', 10) && (decisions.match(/^\| OPD-\d{2} \| .* \| Pending \|/gm) ?? []).length === 10, detail: 'OPD-01–OPD-10 remain Pending.' },
  { id: 'eight-pending-approval-fields', passed: hasInventory(decisions, 'OPA', 8) && (decisions.match(/^\| OPA-\d{2} \| .* \| Pending \|/gm) ?? []).length === 8, detail: 'OPA-01–OPA-08 remain Pending.' },
  { id: 'twelve-evidence-items', passed: hasInventory(index, 'OPE', 12), detail: 'OPE-01–OPE-12 define the hydrated evidence package.' },
  { id: 'paper-predecessor-rejected', passed: String(paper.readinessDecision).includes('Reject / Defer') && paper.gateAccepted === false && paper.paperCertificationCreated === false, detail: 'WBS 7.9 remains rejected/deferred and uncertified.' },
  { id: 'notification-unaccepted', passed: localManifestPasses(notification) && notification.notificationAccepted === false && notification.operationalAuthorityCreated === false, detail: 'WBS 8.1 local controls pass without operational acceptance.' },
  { id: 'reporting-unaccepted', passed: localManifestPasses(reporting) && reporting.reportingAccepted === false && reporting.operationalAuthorityCreated === false, detail: 'WBS 8.2 remains synthetic and unaccepted.' },
  { id: 'audit-export-unaccepted', passed: localManifestPasses(auditExport) && auditExport.auditExportAccepted === false && auditExport.operationalAuthorityCreated === false, detail: 'WBS 8.3 lacks durable secure delivery acceptance.' },
  { id: 'administration-unaccepted', passed: localManifestPasses(administration) && administration.administrationAccepted === false && administration.operationalAuthorityCreated === false, detail: 'WBS 8.4 lacks durable workflow acceptance.' },
  { id: 'observability-unaccepted', passed: localManifestPasses(observability) && observability.observabilityAccepted === false && observability.operationalAuthorityCreated === false, detail: 'WBS 8.5 lacks deployed telemetry and incident acceptance.' },
  { id: 'recovery-unexecuted', passed: localManifestPasses(recovery) && recovery.recoveryAccepted === false && recovery.exerciseAuthorized === false && recovery.exerciseExecuted === false && recovery.rpoMeasured === false && recovery.rtoMeasured === false, detail: 'WBS 8.6 remains unauthorized, unexecuted and unmeasured.' },
  { id: 'previous-aggregate-fails-closed', passed: previous.gateAccepted === false && previous.recoveryExerciseExecuted === false && previous.recoveryObjectivesMeasured === false && previous.entryLockCleared === false && previous.createsOperationalAuthority === false && previous.createsPaperAuthority === false && previous.createsLiveAuthority === false, detail: 'The prior aggregate preserves all fail-closed authority flags.' },
  { id: 'reject-defer-no-authority', passed: legacyReview.includes('Reject or defer') && legacyDecisions.includes('Codex cannot provide') && review.includes('creates no exception'), detail: 'ORR remains rejected/deferred, unsigned and authority-free.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Operational Readiness verification failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = ids('OPB', 10).map((id) => {
  const parts = review.split('\n').find((line) => line.startsWith(`| ${id} |`)).split('|');
  return { id, severity: parts[2].trim(), summary: parts[3].trim(), status: 'Open' };
});
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 8.7 current Operational Readiness Review evidence only',
  localControls: 'PASS / qualified hydrated evidence',
  readinessDecision: 'Reject / Defer — Deployment, Exercises, Support Ownership and Accountable Acceptance Pending',
  gateAccepted: false,
  exceptionApproved: false,
  deploymentAuthorized: false,
  sharedEnvironmentAuthorized: false,
  providerContactAuthorized: false,
  providerCommitmentAuthorized: false,
  operationalPageAuthorized: false,
  recoveryExerciseAuthorized: false,
  recoveryExerciseExecuted: false,
  recoveryObjectivesMeasured: false,
  entryLockCleared: false,
  operationalAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  controlledLivePreparationAuthorized: false,
  pilotAuthorityCreated: false,
  capitalAuthorized: false,
  brokerOrderAuthorized: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};
const directory = path.join(root, 'outputs/operational-readiness');
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, 'current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Operational Readiness remains Reject / Defer: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} open blockers; entry lock remains set and no deployment, exercise, operational, paper, pilot or live authority was created.`);
