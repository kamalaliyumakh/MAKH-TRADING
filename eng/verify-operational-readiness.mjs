import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/OPERATIONAL_READINESS_REVIEW.md',
  'docs/engineering/OPERATIONAL_READINESS_CURRENT_EVIDENCE.md',
  'docs/engineering/OPERATIONAL_READINESS_DECISION_REGISTER.md',
  'outputs/notification-readiness/readiness-manifest.json',
  'outputs/reporting-readiness/readiness-manifest.json',
  'outputs/audit-export-readiness/readiness-manifest.json',
  'outputs/administration-readiness/readiness-manifest.json',
  'outputs/observability-readiness/readiness-manifest.json',
  'outputs/recovery-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));
const review = contents.get(files[0]);
const evidence = contents.get(files[1]);
const decisions = contents.get(files[2]);
const notification = JSON.parse(contents.get(files[3]));
const reporting = JSON.parse(contents.get(files[4]));
const auditExport = JSON.parse(contents.get(files[5]));
const administration = JSON.parse(contents.get(files[6]));
const observability = JSON.parse(contents.get(files[7]));
const recovery = JSON.parse(contents.get(files[8]));

const criterionIds = Array.from({ length: 12 }, (_, index) => `ORR-${String(index + 1).padStart(2, '0')}`);
const criterionRows = review.match(/^\| ORR-\d{2} \|/gm) ?? [];
const blockerRows = review.match(/^\| (?!Finding \|)[^|]+ \| (?:Critical|High)[^|]* \|/gm) ?? [];
const pendingRows = decisions.match(/^\| [^|]+ \| [^|]+ \| Pending \|$/gm) ?? [];
const signatureFields = decisions.match(/^[A-Za-z][^\n:]* signature: _{10,}[ \t]*$/gm) ?? [];
const predecessors = [notification, reporting, auditExport, administration, observability, recovery];

const checks = [
  { id: 'twelve-gate-criteria', passed: criterionRows.length === 12 && criterionIds.every((id) => review.includes(`| ${id} |`)), detail: 'The review contains exactly ORR-01 through ORR-12.' },
  { id: 'six-current-predecessor-manifests', passed: predecessors.every((item) => item.localControls === 'PASS') && notification.notificationAccepted === false && reporting.reportingAccepted === false && auditExport.auditExportAccepted === false && administration.administrationAccepted === false && observability.observabilityAccepted === false && recovery.recoveryAccepted === false, detail: 'WBS 8.1–8.6 local controls pass while accountable acceptance remains false.' },
  { id: 'evidence-register-reconciled', passed: ['8.1', '8.2', '8.3', '8.4', '8.5', '8.6'].every((id) => evidence.includes(`| ${id} |`)) && evidence.includes('90%') && evidence.includes('92%') && evidence.includes('72%'), detail: 'The evidence register lists all six packages and their current completion states.' },
  { id: 'eight-explicit-blockers', passed: blockerRows.length === 8, detail: 'The review retains exactly eight Critical/High operational blockers.' },
  { id: 'seven-pending-decisions', passed: pendingRows.length === 7, detail: 'All seven accountable operational decisions remain Pending.' },
  { id: 'unsigned-accountable-approval', passed: signatureFields.length === 7 && decisions.includes('Codex cannot provide, infer or substitute these approvals'), detail: 'All seven signature fields remain unsigned and cannot be inferred.' },
  { id: 'reject-defer-boundary', passed: review.includes('Reject or defer operational readiness.') && evidence.includes('Reject / Defer — Deployment, Exercises and Accountable Acceptance Pending') && decisions.includes('Reject / Defer — Deployment, Exercises and Accountable Acceptance Pending') && !review.includes('Status: Operationally ready') && !review.includes('Recommendation: Approve'), detail: 'All records consistently enforce Reject/Defer.' },
  { id: 'notification-gate-open', passed: review.includes('WBS 8.1 is 90%') && notification.externalDeliveryEnabled === false, detail: 'Notification local controls do not imply external delivery readiness.' },
  { id: 'reporting-and-export-gates-open', passed: review.includes('WBS 8.2 is 92%') && review.includes('WBS 8.3 is 90%') && reporting.officialStatementCreated === false && auditExport.externalPublicationEnabled === false, detail: 'Reporting and exports remain non-authoritative and unpublished.' },
  { id: 'administration-gate-open', passed: review.includes('WBS 8.4 is 90%') && administration.authenticatedWorkflowEnabled === false && administration.externalMutationEnabled === false, detail: 'Administration lacks durable authenticated mutation workflows.' },
  { id: 'observability-gate-open', passed: review.includes('WBS 8.5 is 90%') && observability.externalPagingEnabled === false && observability.productionMonitoringProven === false, detail: 'No deployed paging or production monitoring proof exists.' },
  { id: 'recovery-unexecuted', passed: review.includes('WBS 8.6 is 72%') && recovery.exerciseAuthorized === false && recovery.exerciseExecuted === false && recovery.rpoMeasured === false && recovery.rtoMeasured === false, detail: 'Recovery remains unauthorized, unexecuted and unmeasured.' },
  { id: 'historical-test-evidence-qualified', passed: review.includes('historical retained baseline is 455 architecture tests and 66 API-security tests') && review.includes('no fresh aggregate execution is claimed'), detail: 'Historical test evidence is not presented as a fresh aggregate run.' },
  { id: 'no-authority-or-entry-lock-clearance', passed: recovery.entryLockCleared === false && evidence.includes('No operational, paper-trading or live-trading authority is created') && review.includes('does not approve an environment') && review.includes('clear entry lock'), detail: 'The gate cannot approve an environment, clear entry lock or create trading authority.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Operational readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = blockerRows.map((row) => row.split('|')[1].trim());
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 8.7 current hydrated operational-readiness evidence',
  localControls: 'PASS',
  readinessDecision: 'Reject / Defer — Deployment, Exercises and Accountable Acceptance Pending',
  gateAccepted: false,
  recoveryExerciseExecuted: false,
  recoveryObjectivesMeasured: false,
  entryLockCleared: false,
  createsOperationalAuthority: false,
  createsPaperAuthority: false,
  createsLiveAuthority: false,
  checks,
  blockers,
  artifacts: files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') })),
};
const outputDirectory = path.join(root, 'outputs/operational-readiness');
await mkdir(outputDirectory, { recursive: true });
const encoded = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(outputDirectory, 'current-evidence-manifest.json'), encoded);
await writeFile(path.join(outputDirectory, 'local-evidence-manifest.json'), encoded);
console.log(`Operational readiness: ${checks.length} checks, ${files.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`);
