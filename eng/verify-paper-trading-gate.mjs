import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/paper-trading-gate');
const artifacts = [
  'docs/engineering/PAPER_TRADING_GATE_REVIEW.md',
  'docs/engineering/PAPER_TRADING_GATE_EVIDENCE_INDEX.md',
  'docs/engineering/PAPER_TRADING_GATE_APPROVAL.md',
  'docs/engineering/paper-trading-gate-state.json',
  'outputs/risk-domain-readiness/readiness-manifest.json',
  'outputs/broker-paper-adapter-readiness/readiness-manifest.json',
  'outputs/paper-oms-readiness/readiness-manifest.json',
  'outputs/position-ledger-readiness/readiness-manifest.json',
  'outputs/reconciliation-readiness/readiness-manifest.json',
  'outputs/paper-trading-ui-readiness/readiness-manifest.json',
  'outputs/risk-console-readiness/readiness-manifest.json',
  'outputs/paper-trial/readiness-manifest.json',
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

const review = text['docs/engineering/PAPER_TRADING_GATE_REVIEW.md'];
const evidenceIndex = text['docs/engineering/PAPER_TRADING_GATE_EVIDENCE_INDEX.md'];
const approval = text['docs/engineering/PAPER_TRADING_GATE_APPROVAL.md'];
const state = json('docs/engineering/paper-trading-gate-state.json');
const risk = json('outputs/risk-domain-readiness/readiness-manifest.json');
const broker = json('outputs/broker-paper-adapter-readiness/readiness-manifest.json');
const oms = json('outputs/paper-oms-readiness/readiness-manifest.json');
const positions = json('outputs/position-ledger-readiness/readiness-manifest.json');
const reconciliation = json('outputs/reconciliation-readiness/readiness-manifest.json');
const paperUi = json('outputs/paper-trading-ui-readiness/readiness-manifest.json');
const riskConsole = json('outputs/risk-console-readiness/readiness-manifest.json');
const trial = json('outputs/paper-trial/readiness-manifest.json');
const foundation = json('outputs/engineering-foundation-gate-readiness/readiness-manifest.json');
const criterionIds = Array.from(
  { length: 14 },
  (_, index) => `PTG-${String(index + 1).padStart(2, '0')}`,
);
const blockerIds = Array.from(
  { length: 8 },
  (_, index) => `PTGB-${String(index + 1).padStart(2, '0')}`,
);
const decisionIds = Array.from(
  { length: 8 },
  (_, index) => `PTGD-${String(index + 1).padStart(2, '0')}`,
);
const exactIds = (actual, expected) =>
  Array.isArray(actual) &&
  actual.length === expected.length &&
  new Set(actual).size === expected.length &&
  expected.every((id) => actual.includes(id));
const criterionRows = review.match(/^\| PTG-\d{2} \|/gm) ?? [];
const blockerRows = review.match(/^\| (?!Finding \|)[^|]+ \| (?:Critical|High)[^|]* \|/gm) ?? [];
const pendingDecisions = approval.match(/^\| [^|]+ \| [^|]+ \| Pending\s*\|$/gm) ?? [];
const signatureFields = approval.match(/^[A-Za-z][^\n:]*: _{10,}[ \t]*$/gm) ?? [];

const checks = [
  {
    id: 'fourteen-gate-criteria',
    passed:
      criterionRows.length === 14 &&
      criterionIds.every((id) => review.includes(`| ${id} |`)) &&
      exactIds(
        state.criteria?.map((item) => item.id),
        criterionIds,
      ),
    detail: 'Exactly PTG-01 through PTG-14 exist in both review and machine state.',
  },
  {
    id: 'criterion-outcomes-fail-closed',
    passed:
      state.criteria?.slice(0, 7).every((item) => item.status === 'LocalPass') === true &&
      state.criteria?.slice(7, 13).every((item) => item.status === 'Fail') === true &&
      state.criteria?.[13]?.status === 'Pending',
    detail:
      'Only local criteria pass; external/trial/dependency criteria fail and certification remains Pending.',
  },
  {
    id: 'eight-explicit-blockers',
    passed:
      blockerRows.length === 8 &&
      exactIds(
        state.blockers?.map((item) => item.id),
        blockerIds,
      ) &&
      state.blockers?.every(
        (item) => ['Critical', 'High'].includes(item.severity) && item.status === 'Open',
      ) === true,
    detail: 'Exactly eight Critical/High blockers remain Open.',
  },
  {
    id: 'eight-pending-decisions',
    passed:
      pendingDecisions.length === 8 &&
      exactIds(
        state.decisions?.map((item) => item.id),
        decisionIds,
      ) &&
      state.decisions?.every((item) => item.status === 'Pending' && item.evidence === null) ===
        true,
    detail: 'Exactly eight accountable decisions remain Pending without evidence.',
  },
  {
    id: 'unsigned-approval-record',
    passed:
      signatureFields.length >= 12 &&
      approval.includes('Codex cannot provide this approval.') &&
      approval.includes('A typed name without an authorized record is not acceptance'),
    detail: 'Decision, owner and signature fields remain unsigned and cannot be self-approved.',
  },
  {
    id: 'reject-defer-boundary',
    passed:
      state.decision === 'RejectDefer' &&
      review.includes('Reject certification at this time.') &&
      !review.includes('Status: Certified') &&
      !review.includes('Recommendation: Approve'),
    detail: 'The sole current decision is Reject/Defer and no certification claim exists.',
  },
  {
    id: 'trial-state-consumed',
    passed:
      trial.localControls === 'PASS' &&
      trial.trialReady === false &&
      trial.trialAuthorized === false &&
      trial.trialExecuted === false &&
      trial.resultsRecorded === false &&
      trial.trialAccepted === false &&
      trial.paperCertificationCreated === false,
    detail:
      'Current WBS 7.8 evidence records preparation controls but no ready, authorized or executed trial.',
  },
  {
    id: 'local-predecessor-controls',
    passed: [risk, broker, oms, positions, reconciliation, paperUi, riskConsole, foundation].every(
      (manifest) => manifest.localControls === 'PASS',
    ),
    detail: 'All local component and foundation readiness controls pass.',
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
    detail: 'Every accountable component/foundation predecessor remains unaccepted.',
  },
  {
    id: 'external-actions-disabled',
    passed:
      broker.brokerSelected === false &&
      broker.providerConnected === false &&
      broker.credentialsCreated === false &&
      paperUi.orderSubmissionEnabled === false &&
      riskConsole.containmentExecutionEnabled === false,
    detail:
      'Broker selection/connectivity/credentials, order submission and containment execution are disabled.',
  },
  {
    id: 'current-evidence-index',
    passed:
      evidenceIndex.includes('Preparation 50%') &&
      evidenceIndex.includes('not ready, authorized, executed or accepted') &&
      evidenceIndex.includes('paper-trading-gate-state.json'),
    detail:
      'The evidence index references current trial maturity and the authoritative gate state.',
  },
  {
    id: 'current-local-verification-snapshot',
    passed:
      review.includes('141 trading-portal tests') &&
      review.includes('unrelated existing `PaperOmsServiceTests` compile error') &&
      review.includes('retained backend baseline is 426 architecture and 66 API-security tests'),
    detail:
      'Current portal evidence and the qualified historical backend baseline are represented accurately.',
  },
  {
    id: 'no-gate-or-trading-authority',
    passed:
      state.gateAccepted === false &&
      state.paperCertificationCreated === false &&
      state.controlledLivePreparationAuthorized === false &&
      state.liveTradingAuthorityCreated === false &&
      trial.gateAccepted === false &&
      trial.liveTradingAuthorityCreated === false,
    detail:
      'Neither the gate nor trial creates certification, controlled-live preparation or live authority.',
  },
  {
    id: 'paper-only-scope-boundary',
    passed:
      approval.includes(
        'authorize only the identified paper environment, account, release and conditions',
      ) &&
      approval.includes('never authorizes live credentials, live accounts, capital deployment') &&
      review.includes('does not certify paper trading') &&
      review.includes('permit controlled-live preparation or activity'),
    detail: 'Even future approval is paper-scoped and cannot authorize controlled-live activity.',
  },
];
for (const check of checks) if (!check.passed) failures.push(`Check failed: ${check.id}`);

const blockers = blockerRows.map((row, index) => ({
  id: blockerIds[index],
  finding: row.split('|')[1].trim(),
  severity: state.blockers[index]?.severity,
  status: 'Open',
}));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 7.9 Paper-Trading Certification Gate',
  localControls: failures.length === 0 ? 'PASS' : 'FAIL',
  readinessDecision: 'Reject / Defer — Trial Execution and Accountable Certification Pending',
  certificationDecision: 'Reject/Defer',
  trialReady: false,
  trialAuthorized: false,
  trialExecuted: false,
  resultsRecorded: false,
  trialAccepted: false,
  gateAccepted: false,
  paperCertificationCreated: false,
  controlledLivePreparationAuthorized: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts: artifacts.map((file) => ({ file, sha256: sha(Buffer.from(text[file])) })),
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'local-evidence-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `Paper-trading gate: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`,
);
