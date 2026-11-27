import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/controlled-live-pilot/CURRENT_PILOT_READINESS_REVIEW.md',
  'docs/controlled-live-pilot/CURRENT_PILOT_DECISION_REGISTER.md',
  'docs/controlled-live-pilot/PILOT_SCENARIO_AND_METRIC_MATRIX.md',
  'docs/controlled-live-pilot/PILOT_DAILY_RUN_RECORD_TEMPLATE.md',
  'docs/controlled-live-pilot/PILOT_REPORT_TEMPLATE.md',
  'outputs/controlled-live-go-no-go/current-readiness-manifest.json',
  'outputs/controlled-live-configuration/current-readiness-manifest.json',
  'outputs/paper-trading-gate/local-evidence-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const review = contents.get(evidenceFiles[0]);
const decisions = contents.get(evidenceFiles[1]);
const matrix = contents.get(evidenceFiles[2]);
const dailyRecord = contents.get(evidenceFiles[3]);
const report = contents.get(evidenceFiles[4]);
const goNoGo = JSON.parse(contents.get(evidenceFiles[5]));
const configuration = JSON.parse(contents.get(evidenceFiles[6]));
const paperGate = JSON.parse(contents.get(evidenceFiles[7]));

const countRows = (text, pattern) => (text.match(pattern) ?? []).length;
const entryRows = countRows(review, /^\| PE-\d{2} \|/gm);
const roleRows = countRows(review, /^\| (?:Pilot Owner|Trader|Risk Owner|Operations|Security|QA\/Evidence|Sponsor) \|/gm);
const blockerRows = countRows(review, /^\| PLB-\d{2} \| Critical \| Open \|/gm);
const scopeRows = countRows(decisions, /^\| [^|]+ \| Pending \| [^|]+ \|$/gm);
const approvalRows = countRows(decisions, /^\| [^|]+ \| [^|]+ \| Pending \| Pending \| Pending \| Pending \|$/gm);
const scenarioIds = Array.from({ length: 15 }, (_, index) => `CLP-${String(index + 1).padStart(2, '0')}`);
const scenarioRows = countRows(matrix, /^\| CLP-\d{2} \|/gm);
const metricRows = matrix
  .split('\n')
  .filter((line) => /^\| [^|]+ \| [^|]+ \| [^|]+ \|$/.test(line))
  .filter((line) => !line.startsWith('| Metric |') && !line.startsWith('|---'));

const checks = [
  {
    id: 'eight-current-entry-conditions',
    passed: entryRows === 8 && countRows(review, /^\| PE-0[1-6] \| [^|]+ \| Fail \|/gm) === 6 &&
      countRows(review, /^\| PE-0[78] \| [^|]+ \| Pending \|/gm) === 2,
    detail: 'Exactly eight current entry conditions are recorded: six Fail and two Pending.',
  },
  {
    id: 'seven-separated-roles',
    passed: roleRows === 7 && review.includes('No role may self-approve'),
    detail: 'Seven accountable roles and explicit self-approval separation are present.',
  },
  {
    id: 'fifteen-unexecuted-scenarios',
    passed: scenarioRows === 15 && scenarioIds.every((id) => matrix.includes(`| ${id} |`)) &&
      countRows(matrix, /\| Not executed \|$/gm) === 15,
    detail: 'Exactly CLP-01 through CLP-15 are present and remain Not executed.',
  },
  {
    id: 'twelve-unobserved-metrics',
    passed: metricRows.length === 12 && review.includes('No numerator, denominator, sample, outcome, defect result or performance claim exists.'),
    detail: 'Exactly twelve safety/exposure metrics are defined and no observation is claimed.',
  },
  {
    id: 'stop-restart-exit-controls',
    passed: review.includes('## Stop, restart and exit rules') && review.includes('Immediate stop is mandatory') &&
      review.includes('Restart requires') && review.includes('Exit requires'),
    detail: 'Immediate stop, controlled restart and evidence-bound exit requirements are present.',
  },
  {
    id: 'eight-critical-open-blockers',
    passed: blockerRows === 8,
    detail: 'Exactly eight Critical/Open pilot blocker groups remain.',
  },
  {
    id: 'nine-pending-scope-fields',
    passed: scopeRows === 9,
    detail: 'Exactly nine immutable future-pilot scope fields remain Pending.',
  },
  {
    id: 'nine-pending-approvals',
    passed: approvalRows === 9,
    detail: 'Exactly nine accountable pilot approvals remain Pending and unsigned.',
  },
  {
    id: 'daily-record-do-not-start',
    passed: dailyRecord.includes('Status: **Not executed**') &&
      dailyRecord.includes('DO NOT START — WBS 9.4 Reject/Defer'),
    detail: 'The daily record remains not executed and defaults to DO NOT START.',
  },
  {
    id: 'report-no-results',
    passed: report.includes('Status: **No pilot executed; no results exist**') &&
      report.includes('There is no pilot release, environment, account, credential, capital allocation, order, execution, metric sample, defect result or approval to report.'),
    detail: 'The report explicitly records that no pilot or result exists.',
  },
  {
    id: 'current-go-no-go-rejected',
    passed: goNoGo.readinessDecision.startsWith('Reject / Defer') && goNoGo.gateAccepted === false &&
      goNoGo.entryLockCleared === false && goNoGo.pilotAuthorized === false &&
      goNoGo.capitalAuthorized === false && goNoGo.brokerOrdersAuthorized === false &&
      goNoGo.createsLiveTradingAuthority === false,
    detail: 'Current WBS 9.4 remains Reject/Defer with no gate, pilot, capital, order or live authority.',
  },
  {
    id: 'configuration-disabled',
    passed: configuration.configurationApplied === false && configuration.entryLockCleared === false &&
      configuration.createsPilotAuthority === false && configuration.pilotCapitalAuthorized === false &&
      configuration.createsBrokerConnection === false && configuration.createsLiveTradingAuthority === false,
    detail: 'Current WBS 9.3 remains disabled and creates no pilot, capital, broker or live authority.',
  },
  {
    id: 'paper-gate-unavailable',
    passed: paperGate.readinessDecision.startsWith('Reject / Defer') && paperGate.gateAccepted === false &&
      paperGate.paperCertificationCreated === false && paperGate.controlledLivePreparationAuthorized === false &&
      paperGate.liveTradingAuthorityCreated === false,
    detail: 'Paper certification remains rejected/deferred and creates no controlled-live preparation or live authority.',
  },
  {
    id: 'no-waiver-or-authority',
    passed: review.includes('cannot offset an identity, authorization, segregation, risk, entry-lock, idempotency, reconciliation, audit, security, compliance or evidence failure') &&
      decisions.includes('cannot approve, sign, waive, clear, allocate, connect, order, execute, attest results or authorize the pilot') &&
      review.includes('does not approve a gate, create an exception, clear entry lock'),
    detail: 'Performance cannot offset safety failures and the evidence creates no exception, execution or authority.',
  },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Controlled-live pilot readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = review
  .split('\n')
  .filter((line) => /^\| PLB-\d{2} \| Critical \| Open \|/.test(line))
  .map((line) => {
    const [, id, severity, state, description] = line.split('|').map((value) => value.trim());
    return { id, severity, state, description };
  });

const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));

const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 9.5 current controlled-live pilot readiness evidence only',
  readinessDecision: 'DO NOT START — Mandatory Predecessors, Immutable Scope and Accountable Authorization Pending',
  inventory: {
    entryConditions: entryRows,
    separatedRoles: roleRows,
    scenarios: scenarioRows,
    metrics: metricRows.length,
    blockers: blockerRows,
    pendingScopeFields: scopeRows,
    pendingApprovals: approvalRows,
  },
  localReadinessControls: true,
  pilotReady: false,
  pilotAuthorized: false,
  pilotExecuted: false,
  resultsRecorded: false,
  continuationAuthorized: false,
  gateAccepted: false,
  exceptionCreated: false,
  deploymentAuthorized: false,
  entryLockCleared: false,
  capitalAuthorized: false,
  brokerConnectionAuthorized: false,
  brokerOrdersAuthorized: false,
  createsLiveTradingAuthority: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/controlled-live-pilot');
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'current-readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log(
  `Controlled-live pilot readiness verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} Critical blockers; DO NOT START and no pilot, capital, broker-order or live authority.`,
);
