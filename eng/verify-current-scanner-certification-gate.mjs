import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/CURRENT_SCANNER_CERTIFICATION_GATE_REVIEW.md',
  'docs/engineering/CURRENT_SCANNER_CERTIFICATION_GATE_DECISION_REGISTER.md',
  'docs/engineering/CURRENT_SCANNER_CERTIFICATION_GATE_EVIDENCE_INDEX.md',
  'outputs/engineering-foundation-gate-readiness/current-readiness-manifest.json',
  'docs/engineering/SECURITY_MASTER_ACCEPTANCE.md',
  'docs/engineering/MARKET_DATA_ADAPTER_ACCEPTANCE.md',
  'docs/engineering/REFERENCE_DATA_ADAPTER_ACCEPTANCE.md',
  'docs/engineering/SCANNER_CALCULATIONS_ACCEPTANCE.md',
  'docs/engineering/SCANNER_SERVICE_ACCEPTANCE.md',
  'docs/engineering/SCANNER_UI_ACCEPTANCE.md',
  'docs/engineering/SCANNER_REALTIME_ACCEPTANCE.md',
  'docs/engineering/SCANNER_GATE_REVIEW.md',
  'docs/engineering/SCANNER_GATE_APPROVAL.md',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const review = contents.get(files[0]);
const decisions = contents.get(files[1]);
const index = contents.get(files[2]);
const foundation = JSON.parse(contents.get(files[3]));
const securityMaster = contents.get(files[4]);
const market = contents.get(files[5]);
const reference = contents.get(files[6]);
const calculations = contents.get(files[7]);
const service = contents.get(files[8]);
const ui = contents.get(files[9]);
const realtime = contents.get(files[10]);
const legacyReview = contents.get(files[11]);
const legacyApproval = contents.get(files[12]);
const ids = (prefix, count) => Array.from({ length: count }, (_, indexValue) => `${prefix}-${String(indexValue + 1).padStart(2, '0')}`);
const hasInventory = (text, prefix, count) => ids(prefix, count).every((id) => text.includes(id));
const checks = [
  { id: 'fifteen-current-criteria', passed: hasInventory(review, 'SCF', 15) && review.includes('7 LocalPass / 4 Conditional / 3 Fail / 1 Pending'), detail: 'SCF-01–SCF-15 reconcile local, licensed, hosted and approval states.' },
  { id: 'ten-open-blockers', passed: hasInventory(review, 'SCB', 10) && (review.match(/^\| SCB-\d{2} \| (Critical|High) \|/gm) ?? []).length === 10, detail: 'SCB-01–SCB-10 remain explicit Critical/High blockers.' },
  { id: 'twelve-exit-steps', passed: (review.match(/^\d+\. /gm) ?? []).length === 12, detail: 'The gate has a twelve-step accountable exit sequence.' },
  { id: 'bounded-preparation', passed: review.includes('## Permitted preparation') && review.includes('## Authority boundary') && review.includes('trading actions disabled'), detail: 'Preparation remains local, synthetic and non-operational.' },
  { id: 'ten-pending-decisions', passed: hasInventory(decisions, 'SCD', 10) && (decisions.match(/^\| SCD-\d{2} \| .* \| Pending \|/gm) ?? []).length === 10, detail: 'SCD-01–SCD-10 remain Pending.' },
  { id: 'eight-pending-approval-fields', passed: hasInventory(decisions, 'SCA', 8) && (decisions.match(/^\| SCA-\d{2} \| .* \| Pending \|/gm) ?? []).length === 8, detail: 'SCA-01–SCA-08 remain Pending.' },
  { id: 'twelve-evidence-items', passed: hasInventory(index, 'SCE', 12), detail: 'SCE-01–SCE-12 define the hydrated evidence package.' },
  { id: 'unavailable-evidence-fails-closed', passed: index.includes('cloud-dataless') && index.includes('not treated as current proof') && review.includes('SCB-09'), detail: 'Unavailable legacy gate evidence is a blocker, not proof.' },
  { id: 'foundation-predecessor-rejected', passed: String(foundation.readinessDecision).includes('Reject / Defer') && foundation.gateAccepted === false && foundation.entryLocked === true, detail: 'WBS 3.8 remains rejected/deferred and entry locked.' },
  { id: 'security-master-unaccepted', passed: securityMaster.includes('In progress — 82%') && securityMaster.includes('provider certification') && securityMaster.includes('acceptance remain pending'), detail: 'WBS 5.1 remains synthetic and unaccepted.' },
  { id: 'provider-adapters-unaccepted', passed: market.includes('licensed-sample certification') && reference.includes('licensed provider connectivity') && market.includes('accountable approvals remain incomplete') && reference.includes('accountable approvals remain incomplete'), detail: 'WBS 5.2–5.3 lack licensed provider certification.' },
  { id: 'calculations-unaccepted', passed: calculations.includes('In progress — 85%') && calculations.includes('no order authority') && calculations.includes('licensed replay certification'), detail: 'WBS 5.4 remains locally ready and unaccepted.' },
  { id: 'service-unaccepted', passed: service.includes('In progress — 93%') && service.includes('licensed replay') && service.includes('hosted certification'), detail: 'WBS 5.5 lacks licensed and hosted certification.' },
  { id: 'ui-unaccepted', passed: ui.includes('Local UI Ready / Hosted and Accountable Acceptance Pending') && ui.includes('does not authorize production data'), detail: 'WBS 5.6 remains locally ready and unaccepted.' },
  { id: 'realtime-unaccepted', passed: realtime.includes('Local Real-Time Ready / Multi-Replica Hosted Certification Pending') && realtime.includes('No deployment or trading authority'), detail: 'WBS 5.7 lacks multi-replica hosted certification.' },
  { id: 'reject-defer-no-authority', passed: legacyReview.includes('Reject / Defer') && legacyApproval.includes('Codex cannot provide this approval') && review.includes('creates no exception'), detail: 'The gate remains rejected/deferred, unsigned and authority-free.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Scanner Certification Gate verification failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = ids('SCB', 10).map((id) => {
  const parts = review.split('\n').find((line) => line.startsWith(`| ${id} |`)).split('|');
  return { id, severity: parts[2].trim(), summary: parts[3].trim(), status: 'Open' };
});
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 5.8 current Scanner Certification Gate evidence only',
  localControls: 'PASS / qualified hydrated evidence',
  readinessDecision: 'Reject / Defer — Licensed Data, Hosted Multi-Replica Certification and Accountable Approval Pending',
  gateAccepted: false,
  exceptionApproved: false,
  scannerCertified: false,
  providerContactAuthorized: false,
  providerCommitmentAuthorized: false,
  subscriptionAuthorized: false,
  credentialCreationAuthorized: false,
  licensedDataIngestionAuthorized: false,
  sharedDeploymentAuthorized: false,
  externalScannerPublicationAuthorized: false,
  brokerConnectivityAuthorized: false,
  brokerOrderAuthorized: false,
  paperTrialAuthorized: false,
  pilotAuthorityCreated: false,
  capitalAuthorized: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};
const directory = path.join(root, 'outputs/scanner-certification-gate-readiness');
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, 'current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Scanner Certification Gate remains Reject / Defer: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} open blockers; no provider, licensed-data, deployment, broker, paper, pilot or live authority was created.`);
