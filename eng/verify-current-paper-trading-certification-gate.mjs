import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/CURRENT_PAPER_TRADING_CERTIFICATION_GATE_REVIEW.md',
  'docs/engineering/CURRENT_PAPER_TRADING_CERTIFICATION_GATE_DECISION_REGISTER.md',
  'docs/engineering/CURRENT_PAPER_TRADING_CERTIFICATION_GATE_EVIDENCE_INDEX.md',
  'outputs/engineering-foundation-gate-readiness/current-readiness-manifest.json',
  'outputs/scanner-certification-gate-readiness/current-readiness-manifest.json',
  'outputs/portal-provenance-gate/current-readiness-manifest.json',
  'docs/engineering/RISK_DOMAIN_ACCEPTANCE.md',
  'docs/engineering/BROKER_PAPER_ADAPTER_ACCEPTANCE.md',
  'docs/engineering/PAPER_OMS_ACCEPTANCE.md',
  'docs/engineering/POSITION_LEDGER_ACCEPTANCE.md',
  'docs/engineering/RECONCILIATION_ACCEPTANCE.md',
  'docs/engineering/PAPER_TRADING_UI_ACCEPTANCE.md',
  'docs/engineering/RISK_CONSOLE_ACCEPTANCE.md',
  'outputs/paper-trial/readiness-manifest.json',
  'docs/engineering/PAPER_TRADING_GATE_REVIEW.md',
  'docs/engineering/PAPER_TRADING_GATE_APPROVAL.md',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const review = contents.get(files[0]);
const decisions = contents.get(files[1]);
const index = contents.get(files[2]);
const foundation = JSON.parse(contents.get(files[3]));
const scanner = JSON.parse(contents.get(files[4]));
const portal = JSON.parse(contents.get(files[5]));
const risk = contents.get(files[6]);
const broker = contents.get(files[7]);
const oms = contents.get(files[8]);
const ledger = contents.get(files[9]);
const reconciliation = contents.get(files[10]);
const paperUi = contents.get(files[11]);
const riskConsole = contents.get(files[12]);
const trial = JSON.parse(contents.get(files[13]));
const legacyReview = contents.get(files[14]);
const legacyApproval = contents.get(files[15]);
const ids = (prefix, count) => Array.from({ length: count }, (_, indexValue) => `${prefix}-${String(indexValue + 1).padStart(2, '0')}`);
const hasInventory = (text, prefix, count) => ids(prefix, count).every((id) => text.includes(id));
const rejected = (manifest) => String(manifest.readinessDecision).includes('Reject / Defer') && manifest.gateAccepted === false;
const checks = [
  { id: 'fifteen-current-criteria', passed: hasInventory(review, 'PTC', 15) && review.includes('7 LocalPass / 2 Conditional / 5 Fail / 1 Pending'), detail: 'PTC-01–PTC-15 reconcile local, provider, hosted, trial and approval states.' },
  { id: 'ten-open-blockers', passed: hasInventory(review, 'PTB', 10) && (review.match(/^\| PTB-\d{2} \| (Critical|High) \|/gm) ?? []).length === 10, detail: 'PTB-01–PTB-10 remain explicit Critical/High blockers.' },
  { id: 'fourteen-exit-steps', passed: (review.match(/^\d+\. /gm) ?? []).length === 14, detail: 'The gate has a fourteen-step accountable exit sequence.' },
  { id: 'bounded-preparation', passed: review.includes('## Permitted preparation') && review.includes('## Authority boundary') && review.includes('no-live boundaries'), detail: 'Preparation remains synthetic, entry-locked and non-operational.' },
  { id: 'ten-pending-decisions', passed: hasInventory(decisions, 'PTD', 10) && (decisions.match(/^\| PTD-\d{2} \| .* \| Pending \|/gm) ?? []).length === 10, detail: 'PTD-01–PTD-10 remain Pending.' },
  { id: 'eight-pending-approval-fields', passed: hasInventory(decisions, 'PTA', 8) && (decisions.match(/^\| PTA-\d{2} \| .* \| Pending \|/gm) ?? []).length === 8, detail: 'PTA-01–PTA-08 remain Pending.' },
  { id: 'fifteen-evidence-items', passed: hasInventory(index, 'PTE', 15), detail: 'PTE-01–PTE-15 define the hydrated evidence package.' },
  { id: 'mandatory-predecessors-rejected', passed: rejected(foundation) && rejected(scanner) && rejected(portal), detail: 'WBS 3.8, WBS 5.8 and WBS 6.7 remain rejected/deferred.' },
  { id: 'risk-and-broker-unaccepted', passed: risk.includes('Local Risk Domain Ready / Persistence, Authoritative Inputs and Accountable Acceptance Pending') && broker.includes('Local Synthetic Broker Adapter Ready / Selected-Provider Certification and Accountable Acceptance Pending'), detail: 'WBS 7.1–7.2 remain local/synthetic and unaccepted.' },
  { id: 'oms-no-broker-authority', passed: oms.includes('In progress — 90%') && oms.includes('cannot submit an order to any broker') && oms.includes('can authorize live trading'), detail: 'WBS 7.3 remains synthetic and non-authoritative.' },
  { id: 'ledger-no-live-authority', passed: ledger.includes('In progress — 90%') && ledger.includes('cannot authorize live trading'), detail: 'WBS 7.4 remains synthetic and unaccepted.' },
  { id: 'reconciliation-entry-lock', passed: reconciliation.includes('In progress — 90%') && reconciliation.includes('not broker certification') && reconciliation.includes('cannot authorize live trading'), detail: 'WBS 7.5 remains synthetic and entry-lock preserving.' },
  { id: 'paper-ui-submission-disabled', passed: paperUi.includes('In progress — 99%') && paperUi.includes('Submission is disabled') && paperUi.includes('cannot authorize live trading'), detail: 'WBS 7.6 cannot submit orders or create authority.' },
  { id: 'risk-console-non-executable', passed: riskConsole.includes('In progress — 99%') && riskConsole.includes('non-executable containment previews') && riskConsole.includes('cannot create trading authority'), detail: 'WBS 7.7 remains non-executable.' },
  { id: 'trial-unexecuted-fails-closed', passed: trial.trialReady === false && trial.trialAuthorized === false && trial.trialExecuted === false && trial.resultsRecorded === false && trial.trialAccepted === false && trial.gateAccepted === false && trial.paperCertificationCreated === false && trial.liveTradingAuthorityCreated === false, detail: 'WBS 7.8 remains unauthorized, unexecuted and uncertified.' },
  { id: 'reject-defer-no-authority', passed: review.includes('Reject / Defer') && legacyReview.includes('Reject/Defer') && legacyApproval.includes('Codex cannot provide this approval') && review.includes('creates no exception'), detail: 'The gate remains rejected/deferred, unsigned and authority-free.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Paper-Trading Certification Gate verification failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = ids('PTB', 10).map((id) => {
  const parts = review.split('\n').find((line) => line.startsWith(`| ${id} |`)).split('|');
  return { id, severity: parts[2].trim(), summary: parts[3].trim(), status: 'Open' };
});
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 7.9 current Paper-Trading Certification Gate evidence only',
  localControls: 'PASS / qualified hydrated evidence',
  readinessDecision: 'Reject / Defer — Trial Execution, Defect Closure and Accountable Certification Pending',
  gateAccepted: false,
  exceptionApproved: false,
  trialReady: false,
  trialAuthorized: false,
  trialExecuted: false,
  resultsRecorded: false,
  trialAccepted: false,
  paperCertificationCreated: false,
  providerContactAuthorized: false,
  providerCommitmentAuthorized: false,
  accountOpeningAuthorized: false,
  fundingAuthorized: false,
  credentialCreationAuthorized: false,
  brokerDataConnectionAuthorized: false,
  brokerOrderAuthorized: false,
  controlledLivePreparationAuthorized: false,
  pilotAuthorityCreated: false,
  capitalAuthorized: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};
const directory = path.join(root, 'outputs/paper-trading-gate');
await mkdir(directory, { recursive: true });
await writeFile(path.join(directory, 'current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Paper-Trading Certification Gate remains Reject / Defer: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} open blockers; trial and certification remain false and no provider, broker, paper, pilot or live authority was created.`);
