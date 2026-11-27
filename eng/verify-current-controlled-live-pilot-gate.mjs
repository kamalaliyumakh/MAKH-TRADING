import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/controlled-live-pilot/CURRENT_CONTROLLED_LIVE_PILOT_GATE_REVIEW.md',
  'docs/controlled-live-pilot/CURRENT_CONTROLLED_LIVE_PILOT_GATE_DECISION_REGISTER.md',
  'docs/controlled-live-pilot/PILOT_SCENARIO_AND_METRIC_MATRIX.md',
  'docs/controlled-live-pilot/PILOT_DAILY_RUN_RECORD_TEMPLATE.md',
  'docs/controlled-live-pilot/PILOT_REPORT_TEMPLATE.md',
  'outputs/controlled-live-go-no-go/current-readiness-manifest.json',
  'outputs/controlled-live-configuration/current-readiness-manifest.json',
  'outputs/paper-trading-gate/current-readiness-manifest.json',
  'docs/controlled-live-pilot/CURRENT_PILOT_READINESS_REVIEW.md',
  'docs/controlled-live-pilot/CURRENT_PILOT_DECISION_REGISTER.md',
];
const contents = new Map();
for (const file of evidenceFiles) contents.set(file, await readFile(path.join(root, file), 'utf8'));
const review = contents.get(evidenceFiles[0]);
const decisions = contents.get(evidenceFiles[1]);
const matrix = contents.get(evidenceFiles[2]);
const daily = contents.get(evidenceFiles[3]);
const report = contents.get(evidenceFiles[4]);
const gate = JSON.parse(contents.get(evidenceFiles[5]));
const configuration = JSON.parse(contents.get(evidenceFiles[6]));
const paper = JSON.parse(contents.get(evidenceFiles[7]));
const priorReview = contents.get(evidenceFiles[8]);
const priorDecisions = contents.get(evidenceFiles[9]);
const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`);
const decision = 'DO NOT START — Mandatory Predecessors, Immutable Pilot Scope and Accountable Start Authorization Pending';
const checks = [
  ['criteria-inventory', ids('PLC', 15).every((id) => review.includes(`| ${id} |`)) && (review.match(/^\| PLC-\d{2} \|/gm) ?? []).length === 15, 'Exactly PLC-01 through PLC-15 are evaluated.'],
  ['criteria-results', (review.match(/^\| PLC-\d{2} \|[^\n]+\| Fail \|/gm) ?? []).length === 12 && (review.match(/^\| PLC-\d{2} \|[^\n]+\| Conditional \|/gm) ?? []).length === 2 && review.includes('Summary: **0 LocalPass / 2 Conditional / 12 Fail / 1 Pending**'), 'The gate records twelve Fail, two Conditional and one Pending outcome.'],
  ['critical-blockers', ids('PLB', 10).every((id) => review.includes(`| ${id} | Critical | Open |`)) && (review.match(/^\| PLB-\d{2} \| Critical \| Open \|/gm) ?? []).length === 10, 'Exactly ten Critical/Open blockers remain.'],
  ['decisions-scope-approvals', ids('PLD', 10).every((id) => decisions.includes(`| ${id} |`)) && ids('PLS', 9).every((id) => decisions.includes(`| ${id} |`)) && ids('PLA', 9).every((id) => decisions.includes(`| ${id} |`)), 'Ten decisions, nine scope fields and nine approvals are governed.'],
  ['all-pending', (decisions.match(/^\| PLD-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 10 && (decisions.match(/^\| PLS-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 9 && (decisions.match(/^\| PLA-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 9, 'Every governed decision, scope field and approval remains Pending.'],
  ['scenario-inventory', ids('CLP', 15).every((id) => matrix.includes(`| ${id} |`)) && (matrix.match(/\| Not executed \|$/gm) ?? []).length === 15, 'CLP-01 through CLP-15 remain Not executed.'],
  ['metrics-no-results', review.includes('Twelve safety/exposure metrics: **No samples**') && report.includes('Status: **No pilot executed; no results exist**'), 'No metric samples or pilot results exist.'],
  ['records-not-executed', daily.includes('Status: **Not executed**') && daily.includes('DO NOT START — WBS 9.4 Reject/Defer'), 'The daily run record remains Not executed and fail-closed.'],
  ['current-gate-rejected', gate.readinessDecision.startsWith('Reject / Defer') && gate.gateAccepted === false && gate.entryLockCleared === false && gate.pilotAuthorized === false && gate.capitalAuthorized === false && gate.brokerOrdersAuthorized === false && gate.liveTradingAuthorityCreated === false, 'Current WBS 9.4 remains rejected and creates no pilot authority.'],
  ['configuration-disabled', configuration.configurationApplied === false && configuration.environmentCreated === false && configuration.entryLockCleared === false && configuration.pilotCapitalAuthorized === false, 'Current WBS 9.3 configuration remains disabled.'],
  ['paper-rejected', paper.gateAccepted === false && paper.paperCertificationCreated === false && paper.controlledLivePreparationAuthorized === false && paper.liveTradingAuthorityCreated === false, 'Current paper certification remains rejected/deferred.'],
  ['prior-negative-records', priorReview.includes('No pilot executed; no results exist') && priorDecisions.includes('DO NOT START'), 'Prior negative pilot records remain traceable.'],
  ['non-waivable-controls', review.includes('Null limits never mean unlimited') && review.includes('Restart requires containment, reconciliation, remediation, independent verification and renewed authorization'), 'Hard limits, stop and restart rules remain fail-closed.'],
  ['exit-sequence', (review.match(/^\d+\. /gm) ?? []).length === 14, 'Fourteen controlled exit steps are defined.'],
  ['authority-boundary', review.includes('creates no exception, deployment, environment, account, credential, provider/broker connection, entry-lock clearance, pilot readiness, pilot authorization, capital allocation, broker order, execution, result, continuation or live-trading authority.'), 'The review creates no execution or trading authority.'],
  ['decision-consistency', review.includes(`Decision: **${decision}**`) && decisions.includes('Status: **DO NOT START**'), 'The review and decision register consistently enforce DO NOT START.'],
].map(([id, passed, detail]) => ({ id, passed, detail }));
const failed = checks.filter(({ passed }) => !passed);
if (failed.length) throw new Error(`Current controlled-live pilot gate verification failed: ${failed.map(({ id }) => id).join(', ')}`);

const blockers = ids('PLB', 10).map((id) => {
  const line = review.split('\n').find((value) => value.startsWith(`| ${id} |`));
  return { id, severity: 'Critical', status: 'Open', finding: line.split('|')[4].trim() };
});
const artifacts = evidenceFiles.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 9.5 current controlled-live pilot gate evidence',
  readinessDecision: decision,
  localReadinessControls: 'PASS',
  pilotReady: false,
  pilotAuthorized: false,
  pilotExecuted: false,
  resultsRecorded: false,
  continuationAuthorized: false,
  gateAccepted: false,
  exceptionApproved: false,
  deploymentAuthorized: false,
  environmentAuthorized: false,
  accountAuthorized: false,
  credentialCreationAuthorized: false,
  providerBrokerConnectionAuthorized: false,
  entryLockCleared: false,
  capitalAuthorized: false,
  brokerOrdersAuthorized: false,
  liveTradingAuthorityCreated: false,
  inventory: { criteria: 15, failedCriteria: 12, conditionalCriteria: 2, pendingCriteria: 1, criticalBlockers: 10, pendingDecisions: 10, pendingScopeFields: 9, pendingApprovals: 9, scenarios: 15, metrics: 12, exitSteps: 14 },
  checks,
  blockers,
  artifacts,
};
await mkdir(path.join(root, 'outputs/controlled-live-pilot'), { recursive: true });
await writeFile(path.join(root, 'outputs/controlled-live-pilot/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Current controlled-live pilot gate verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} Critical blockers; DO NOT START and no pilot, capital, order, result or live authority.`);
