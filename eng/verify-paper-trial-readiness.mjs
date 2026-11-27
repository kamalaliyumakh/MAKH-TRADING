import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/paper-trial');
const artifacts = [
  'docs/paper-trial/README.md',
  'docs/paper-trial/OPERATING_PROTOCOL.md',
  'docs/paper-trial/SCENARIO_MATRIX.md',
  'docs/paper-trial/METRICS_AND_DEFECTS.md',
  'docs/paper-trial/RUN_RECORD_TEMPLATE.md',
  'docs/paper-trial/PAPER_TRIAL_REPORT_TEMPLATE.md',
  'docs/paper-trial/PAPER_TRIAL_READINESS_ACCEPTANCE.md',
  'docs/paper-trial/trial-readiness-state.json',
  'outputs/risk-domain-readiness/readiness-manifest.json',
  'outputs/broker-paper-adapter-readiness/readiness-manifest.json',
  'outputs/paper-oms-readiness/readiness-manifest.json',
  'outputs/position-ledger-readiness/readiness-manifest.json',
  'outputs/reconciliation-readiness/readiness-manifest.json',
  'outputs/paper-trading-ui-readiness/readiness-manifest.json',
  'outputs/risk-console-readiness/readiness-manifest.json',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
];
const failures = [];
const sha = (content) => crypto.createHash('sha256').update(content).digest('hex');
const read = (file) => {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    failures.push(`${file} is missing.`);
    return Buffer.from('');
  }
  return fs.readFileSync(absolute);
};
const text = Object.fromEntries(artifacts.map((file) => [file, read(file).toString('utf8')]));
const json = (file) => {
  try {
    return JSON.parse(text[file]);
  } catch {
    failures.push(`${file} is invalid JSON.`);
    return {};
  }
};

const protocol = text['docs/paper-trial/OPERATING_PROTOCOL.md'];
const scenarios = text['docs/paper-trial/SCENARIO_MATRIX.md'];
const metrics = text['docs/paper-trial/METRICS_AND_DEFECTS.md'];
const runTemplate = text['docs/paper-trial/RUN_RECORD_TEMPLATE.md'];
const reportTemplate = text['docs/paper-trial/PAPER_TRIAL_REPORT_TEMPLATE.md'];
const acceptance = text['docs/paper-trial/PAPER_TRIAL_READINESS_ACCEPTANCE.md'];
const state = json('docs/paper-trial/trial-readiness-state.json');
const risk = json('outputs/risk-domain-readiness/readiness-manifest.json');
const broker = json('outputs/broker-paper-adapter-readiness/readiness-manifest.json');
const oms = json('outputs/paper-oms-readiness/readiness-manifest.json');
const positions = json('outputs/position-ledger-readiness/readiness-manifest.json');
const reconciliation = json('outputs/reconciliation-readiness/readiness-manifest.json');
const paperUi = json('outputs/paper-trading-ui-readiness/readiness-manifest.json');
const riskConsole = json('outputs/risk-console-readiness/readiness-manifest.json');
const foundation = json('outputs/engineering-foundation-gate-readiness/readiness-manifest.json');
const expectedPreconditions = Array.from(
  { length: 10 },
  (_, index) => `PC-${String(index + 1).padStart(2, '0')}`,
);
const expectedScenarios = Array.from(
  { length: 20 },
  (_, index) => `PT-${String(index + 1).padStart(2, '0')}`,
);
const expectedApprovals = [
  'Product',
  'Risk',
  'QA',
  'Security',
  'Operations',
  'Compliance',
  'Sponsor',
];
const exactIds = (actual, expected) =>
  Array.isArray(actual) &&
  actual.length === expected.length &&
  new Set(actual).size === expected.length &&
  expected.every((id) => actual.includes(id));

const checks = [
  {
    id: 'ten-preconditions',
    passed:
      (protocol.match(/^\d+\. /gm) ?? []).length === 10 &&
      exactIds(
        state.preconditions?.map((item) => item.id),
        expectedPreconditions,
      ),
    detail: 'Exactly ten protocol preconditions map to PC-01 through PC-10.',
  },
  {
    id: 'preconditions-pending-without-evidence',
    passed:
      state.preconditions?.every((item) => item.status === 'Pending' && item.evidence === null) ===
      true,
    detail: 'No precondition is represented as satisfied without authorized evidence.',
  },
  {
    id: 'twenty-not-run-scenarios',
    passed:
      (scenarios.match(/^\| PT-\d{2} \|/gm) ?? []).length === 20 &&
      exactIds(
        state.scenarios?.map((item) => item.id),
        expectedScenarios,
      ) &&
      state.scenarios?.every(
        (item) =>
          item.status === 'NotRun' && Array.isArray(item.runIds) && item.runIds.length === 0,
      ) === true,
    detail: 'Exactly PT-01 through PT-20 exist and none is represented as executed.',
  },
  {
    id: 'seven-pending-approvals',
    passed:
      exactIds(
        state.approvals?.map((item) => item.role),
        expectedApprovals,
      ) &&
      state.approvals?.every((item) => item.status === 'Pending' && item.evidence === null) ===
        true,
    detail: 'All seven accountable decisions remain Pending without evidence.',
  },
  {
    id: 'safety-stop-and-resume',
    passed:
      protocol.includes('## Immediate stop conditions') &&
      protocol.includes('Restart requires containment, root cause, corrective evidence') &&
      protocol.includes('If any precondition becomes false, the trial is stopped'),
    detail:
      'Loss of readiness or a safety event stops the trial and requires controlled resumption.',
  },
  {
    id: 'metrics-and-defect-integrity',
    passed:
      metrics.includes('Report numerator, denominator, exclusions and confidence limitation') &&
      metrics.includes('Unauthorized accepted commands') &&
      metrics.includes('Paper/live crossover') &&
      metrics.includes('D1: stop immediately') &&
      metrics.includes('Defects are never removed to improve metrics'),
    detail:
      'Metrics retain denominators and zero-tolerance safety outcomes; defect history is immutable.',
  },
  {
    id: 'run-evidence-chain',
    passed:
      runTemplate.includes('Status: **Not executed**') &&
      runTemplate.includes('Prior manifest SHA-256 / current manifest SHA-256') &&
      runTemplate.includes('media type, byte length and SHA-256 digest') &&
      runTemplate.includes('broken hash chain invalidates the run'),
    detail:
      'Each future run requires a unique, hash-chained evidence manifest and remains not executed.',
  },
  {
    id: 'report-no-results-or-certification',
    passed:
      reportTemplate.includes('Status: **No trial results recorded**') &&
      reportTemplate.includes('cannot certify paper trading or authorize live activity') &&
      reportTemplate.includes('No D1/D2 may remain open'),
    detail: 'The report has no results and cannot itself certify paper or live trading.',
  },
  {
    id: 'state-machine-fail-closed',
    passed:
      state.status === 'PreparationOnly' &&
      state.trialAuthorized === false &&
      state.trialExecuted === false &&
      state.resultsRecorded === false &&
      state.trialAccepted === false &&
      state.paperCertificationCreated === false &&
      state.liveTradingAuthorityCreated === false,
    detail:
      'Preparation, authorization, execution, results, acceptance and authority are distinct false states.',
  },
  {
    id: 'local-predecessor-controls',
    passed: [risk, broker, oms, positions, reconciliation, paperUi, riskConsole, foundation].every(
      (manifest) => manifest.localControls === 'PASS',
    ),
    detail: 'All local predecessor verifiers pass their bounded controls.',
  },
  {
    id: 'predecessors-unaccepted',
    passed:
      risk.riskDomainAccepted === false &&
      broker.brokerPaperAdapterAccepted === false &&
      oms.paperOmsAccepted === false &&
      positions.positionLedgerAccepted === false &&
      reconciliation.reconciliationAccepted === false &&
      paperUi.paperTradingUiAccepted === false &&
      riskConsole.riskConsoleAccepted === false &&
      foundation.gateAccepted === false,
    detail: 'Every accountable predecessor remains unaccepted, so the trial cannot start.',
  },
  {
    id: 'external-boundaries-disabled',
    passed:
      broker.brokerSelected === false &&
      broker.providerConnected === false &&
      broker.credentialsCreated === false &&
      paperUi.orderSubmissionEnabled === false &&
      riskConsole.containmentExecutionEnabled === false &&
      paperUi.liveTradingAuthorityCreated === false,
    detail:
      'Broker, order-submission, containment-execution and live-authority boundaries remain disabled.',
  },
  {
    id: 'acceptance-preparation-only',
    passed:
      acceptance.includes('In progress — 50% preparation only') &&
      acceptance.includes('the trial is not ready or authorized and has not run') &&
      acceptance.includes('WBS 7.9 certification') &&
      acceptance.includes('sixteen SHA-256-hashed evidence artifacts'),
    detail:
      'Acceptance remains preparation-only and explicitly denies readiness, authorization and execution.',
  },
  {
    id: 'no-fabricated-trial-evidence',
    passed:
      !fs.existsSync(path.join(root, 'outputs/paper-trial/runs')) &&
      !fs.existsSync(path.join(root, 'outputs/paper-trial/results.json')),
    detail: 'No run directory or results record exists for an unexecuted trial.',
  },
];
for (const check of checks) if (!check.passed) failures.push(`Check failed: ${check.id}`);

const blockers = [
  'WBS 7.1–7.7 and the engineering foundation remain locally controlled but accountably unaccepted.',
  'No selected/approved broker paper account, certified broker integration or licensed data feeds exist.',
  'No production-like paper environment, authorized participants, approved policy/thresholds or signed start authorization exists.',
  'No operational paper session, representative accessibility/game-day evidence, measured result or defect closure exists.',
  'No final report or Product/Risk/QA/Security/Operations/Compliance/Sponsor approval exists.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 7.8 Controlled Paper-Trading Trial',
  localControls: failures.length === 0 ? 'PASS' : 'FAIL',
  readinessDecision: 'Prepared / Trial Authorization and Execution Pending',
  trialReady: false,
  trialAuthorized: false,
  trialExecuted: false,
  resultsRecorded: false,
  trialAccepted: false,
  gateAccepted: false,
  paperCertificationCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  artifacts: artifacts.map((file) => ({ file, sha256: sha(Buffer.from(text[file])) })),
  blockers,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `Paper-trial readiness: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`,
);
