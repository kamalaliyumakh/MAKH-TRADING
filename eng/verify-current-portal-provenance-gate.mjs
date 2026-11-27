import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/CURRENT_PORTAL_PROVENANCE_GATE_REVIEW.md',
  'docs/engineering/CURRENT_PORTAL_PROVENANCE_GATE_DECISION_REGISTER.md',
  'docs/engineering/CURRENT_PORTAL_PROVENANCE_GATE_EVIDENCE_INDEX.md',
  'outputs/engineering-foundation-gate-readiness/current-readiness-manifest.json',
  'outputs/scanner-certification-gate-readiness/current-readiness-manifest.json',
  'docs/engineering/NEWS_FILINGS_ADAPTER_ACCEPTANCE.md',
  'docs/engineering/SOCIAL_SIGNAL_ADAPTER_ACCEPTANCE.md',
  'docs/engineering/EVIDENCE_SERVICE_ACCEPTANCE.md',
  'docs/engineering/SYMBOL_WORKSPACE_ACCEPTANCE.md',
  'docs/engineering/DASHBOARD_ACCEPTANCE.md',
  'docs/engineering/JOURNAL_ACCEPTANCE.md',
  'docs/engineering/PORTAL_PROVENANCE_GATE_REVIEW.md',
  'docs/engineering/PORTAL_PROVENANCE_GATE_APPROVAL.md',
  'outputs/portal-provenance-gate/local-evidence-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const review = contents.get(files[0]);
const decisions = contents.get(files[1]);
const index = contents.get(files[2]);
const foundation = JSON.parse(contents.get(files[3]));
const scanner = JSON.parse(contents.get(files[4]));
const news = contents.get(files[5]);
const social = contents.get(files[6]);
const evidence = contents.get(files[7]);
const workspace = contents.get(files[8]);
const dashboard = contents.get(files[9]);
const journal = contents.get(files[10]);
const legacyReview = contents.get(files[11]);
const legacyApproval = contents.get(files[12]);
const local = JSON.parse(contents.get(files[13]));
const ids = (prefix, count) => Array.from({ length: count }, (_, indexValue) => `${prefix}-${String(indexValue + 1).padStart(2, '0')}`);
const hasInventory = (text, prefix, count) => ids(prefix, count).every((id) => text.includes(id));
const checks = [
  { id: 'fifteen-current-criteria', passed: hasInventory(review, 'PPC', 15) && review.includes('6 LocalPass / 4 Conditional / 4 Fail / 1 Pending'), detail: 'PPC-01–PPC-15 reconcile local, licensed, privacy, hosted and approval states.' },
  { id: 'ten-open-blockers', passed: hasInventory(review, 'PPB', 10) && (review.match(/^\| PPB-\d{2} \| (Critical|High) \|/gm) ?? []).length === 10, detail: 'PPB-01–PPB-10 remain explicit Critical/High blockers.' },
  { id: 'twelve-exit-steps', passed: (review.match(/^\d+\. /gm) ?? []).length === 12, detail: 'The gate has a twelve-step accountable exit sequence.' },
  { id: 'bounded-preparation', passed: review.includes('## Permitted preparation') && review.includes('## Authority boundary') && review.includes('trading actions disabled'), detail: 'Preparation remains local, synthetic, read-only and non-operational.' },
  { id: 'ten-pending-decisions', passed: hasInventory(decisions, 'PPD', 10) && (decisions.match(/^\| PPD-\d{2} \| .* \| Pending \|/gm) ?? []).length === 10, detail: 'PPD-01–PPD-10 remain Pending.' },
  { id: 'eight-pending-approval-fields', passed: hasInventory(decisions, 'PPA', 8) && (decisions.match(/^\| PPA-\d{2} \| .* \| Pending \|/gm) ?? []).length === 8, detail: 'PPA-01–PPA-08 remain Pending.' },
  { id: 'thirteen-evidence-items', passed: hasInventory(index, 'PPE', 13), detail: 'PPE-01–PPE-13 define the hydrated evidence package.' },
  { id: 'foundation-and-scanner-rejected', passed: String(foundation.readinessDecision).includes('Reject / Defer') && foundation.gateAccepted === false && String(scanner.readinessDecision).includes('Reject / Defer') && scanner.gateAccepted === false, detail: 'WBS 3.8 and WBS 5.8 remain rejected/deferred.' },
  { id: 'news-pipeline-unaccepted', passed: news.includes('Local Evidence Pipeline Ready / Licensed and Hosted Certification Pending') && news.includes('All fixtures are synthetic'), detail: 'WBS 6.1 remains synthetic and uncertified.' },
  { id: 'social-pipeline-unaccepted', passed: social.includes('Local Aggregate-Privacy Ready / Licensed and Hosted Certification Pending') && social.includes('In progress — 99%'), detail: 'WBS 6.2 lacks provider/DPIA/hosted acceptance.' },
  { id: 'evidence-service-unaccepted', passed: evidence.includes('Local Evidence Aggregation Ready / Licensed and Hosted Certification Pending') && evidence.includes('In progress — 99%'), detail: 'WBS 6.3 lacks licensed and hosted certification.' },
  { id: 'workspace-unaccepted', passed: workspace.includes('Local Read-Only Workspace Ready / Hosted and Accountable Acceptance Pending') && workspace.includes('In progress — 99%'), detail: 'WBS 6.4 remains locally ready and unaccepted.' },
  { id: 'dashboard-unaccepted', passed: dashboard.includes('Local Read-Only Dashboard Ready / Hosted and Accountable Acceptance Pending') && dashboard.includes('In progress — 99%'), detail: 'WBS 6.5 remains locally ready and unaccepted.' },
  { id: 'journal-unaccepted', passed: journal.includes('Local Read-Only Journal Ready / Persistence, Privacy and Accountable Acceptance Pending') && journal.includes('In progress — 99%'), detail: 'WBS 6.6 lacks persistence/privacy acceptance.' },
  { id: 'legacy-local-gate-fails-closed', passed: local.gateAccepted === false && local.entryLockCleared === false && local.providerOrDeploymentAuthorized === false && local.brokerConnected === false && local.paperTradingAuthorityCreated === false && local.liveTradingAuthorityCreated === false, detail: 'Historical local evidence preserves all negative authority flags.' },
  { id: 'reject-defer-no-authority', passed: review.includes('Reject / Defer') && legacyReview.includes('rejected/deferred') && legacyApproval.includes('Codex cannot provide this approval') && review.includes('creates no exception'), detail: 'The gate remains rejected/deferred, unsigned and authority-free.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Portal and Provenance Gate verification failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = ids('PPB', 10).map((id) => {
  const parts = review.split('\n').find((line) => line.startsWith(`| ${id} |`)).split('|');
  return { id, severity: parts[2].trim(), summary: parts[3].trim(), status: 'Open' };
});
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 6.7 current Portal and Provenance Gate evidence only',
  localControls: 'PASS / qualified hydrated evidence',
  readinessDecision: 'Reject / Defer — External Provenance, Privacy, Hosted Integrity and Accountable Acceptance Pending',
  gateAccepted: false,
  exceptionApproved: false,
  entryLockCleared: false,
  providerContactAuthorized: false,
  providerCommitmentAuthorized: false,
  subscriptionAuthorized: false,
  credentialCreationAuthorized: false,
  licensedContentIngestionAuthorized: false,
  personalDataProcessingAuthorized: false,
  sharedDeploymentAuthorized: false,
  externalPublicationAuthorized: false,
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
const directory = path.join(root, 'outputs/portal-provenance-gate');
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, 'current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Portal and Provenance Gate remains Reject / Defer: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} open blockers; no provider, content, deployment, broker, paper, pilot or live authority was created.`);
