import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/broker-paper-adapter-readiness');
const artifacts = [
  'docs/engineering/BROKER_PAPER_ADAPTER_ACCEPTANCE.md',
  'src/MAKH.Application/Broker/BrokerContracts.cs',
  'src/MAKH.Infrastructure/Broker/SyntheticPaperBrokerAdapter.cs',
  'tests/MAKH.Architecture.Tests/SyntheticPaperBrokerAdapterTests.cs',
  'docs/broker/BROKER_REQUIREMENTS.md',
  'docs/broker/BROKER_ADAPTER_ACCEPTANCE.md',
  'docs/api/openapi.yaml',
  'outputs/broker-discovery-readiness/readiness-manifest.json',
  'outputs/risk-domain-readiness/readiness-manifest.json',
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

const contracts = text['src/MAKH.Application/Broker/BrokerContracts.cs'];
const adapter = text['src/MAKH.Infrastructure/Broker/SyntheticPaperBrokerAdapter.cs'];
const tests = text['tests/MAKH.Architecture.Tests/SyntheticPaperBrokerAdapterTests.cs'];
const acceptance = text['docs/engineering/BROKER_PAPER_ADAPTER_ACCEPTANCE.md'];
const discovery = json('outputs/broker-discovery-readiness/readiness-manifest.json');
const risk = json('outputs/risk-domain-readiness/readiness-manifest.json');
const foundation = json('outputs/engineering-foundation-gate-readiness/readiness-manifest.json');

const checks = [
  {
    id: 'paper-only-account',
    passed:
      contracts.includes('CanSubmitLiveOrders => Denied') &&
      adapter.includes('requires a PAPER account identity') &&
      tests.includes('PaperAdapterRejectsLiveAccountIdentity'),
    detail: 'The adapter accepts only PAPER identities and creates no live authority.',
  },
  {
    id: 'defined-contract-enums',
    passed:
      contracts.includes('Enum.IsDefined(environment)') &&
      contracts.includes('Enum.IsDefined(side)') &&
      contracts.includes('Enum.IsDefined(timeInForce)') &&
      tests.includes('ContractsRejectUndefinedEnumsAndMismatchedProviderIdentity'),
    detail: 'Undefined environment, side and time-in-force values fail closed.',
  },
  {
    id: 'canonical-provider-scope',
    passed: adapter.includes('canonical provider identity') && tests.includes('another-provider'),
    detail: 'Synthetic account identity must match the adapter provider.',
  },
  {
    id: 'risk-prerequisite',
    passed:
      adapter.includes('A paper-proposal risk approval is required.') &&
      tests.includes('SubmitRequiresRiskApprovedPaperProposal'),
    detail: 'No provider-side submission occurs without paper-proposal risk approval.',
  },
  {
    id: 'stable-idempotency',
    passed:
      contracts.includes("Append(':').Append(text)") &&
      contracts.includes('CultureInfo.InvariantCulture') &&
      adapter.includes('different payload') &&
      tests.includes('PayloadIdentityIsCultureInvariantAndLengthPrefixed'),
    detail:
      'Length-prefixed culture-invariant payload identity supports exact replay and changed-intent rejection.',
  },
  {
    id: 'unknown-submission-recovery',
    passed:
      adapter.includes('TimeoutAfterPossibleSubmission') &&
      adapter.includes('query and reconcile before retry') &&
      tests.includes('TimeoutAfterPossibleSubmissionBecomesUnknownAndQueryable'),
    detail: 'Possible-submit timeout remains Unknown and queryable rather than retryable.',
  },
  {
    id: 'mapping-shape-validation',
    passed:
      adapter.includes('Provider state is required.') &&
      adapter.includes('ThrowIfNegativeOrZero(quantity)') &&
      adapter.includes('filledQuantity > quantity') &&
      tests.includes('ProviderMappingRejectsMalformedStateAndFillShape'),
    detail: 'Malformed provider state and fill shape are rejected before normalization.',
  },
  {
    id: 'monotonic-snapshot-fencing',
    passed:
      adapter.includes('conflicting provider snapshot reused the current observation time') &&
      tests.includes('SameTimestampSnapshotRequiresExactReplay') &&
      tests.includes('OutOfOrderSnapshotDoesNotRegressCanonicalState'),
    detail: 'Stale updates are ignored and equal-time conflicts fail closed.',
  },
  {
    id: 'terminal-fill-authority',
    passed:
      adapter.includes('next == CanonicalOrderState.Filled') &&
      tests.includes('TerminalFillCannotBeOverwrittenByCancellation') &&
      tests.includes('AuthoritativeFullFillAfterCancelWinsTheRace'),
    detail: 'Authoritative full fill wins cancel races while terminal truth cannot regress.',
  },
  {
    id: 'cancel-fails-closed',
    passed:
      adapter.includes(
        'CanonicalOrderState.Unknown or CanonicalOrderState.Filled or CanonicalOrderState.Rejected',
      ) && tests.includes('unknownAdapter.ProviderCancelCount'),
    detail: 'Unknown, filled and rejected orders cannot create cancellation side effects.',
  },
  {
    id: 'predecessors-unaccepted',
    passed:
      Array.isArray(discovery.checks) &&
      discovery.checks.every((check) => check.passed === true) &&
      discovery.brokerSelected === false &&
      discovery.paperCertificationAccepted === false &&
      risk.localControls === 'PASS' &&
      foundation.localControls === 'PASS' &&
      discovery.readinessDecision?.includes('Pending') &&
      risk.riskDomainAccepted === false &&
      foundation.gateAccepted === false,
    detail:
      'Discovery, risk and foundation local controls pass while accountable acceptance remains unavailable.',
  },
  {
    id: 'acceptance-boundary',
    passed:
      acceptance.includes('Status: In progress — 90%') &&
      acceptance.includes('entirely synthetic and in memory') &&
      acceptance.includes('cannot submit an order to any broker'),
    detail:
      'The acceptance record states current maturity and preserves the synthetic no-broker boundary.',
  },
];
for (const check of checks) if (!check.passed) failures.push(`Check failed: ${check.id}`);

const blockers = [
  'Eligible broker, jurisdiction/account confirmation, API-use terms and paper-environment approval are absent.',
  'Authenticated provider mappings, capabilities, rate limits, sessions and error taxonomy are unimplemented.',
  'Server-side credentials, account discovery, buying power, orders, executions, positions and approved replace semantics are absent.',
  'PostgreSQL intent/call/snapshot/execution/idempotency/audit/outbox persistence is absent.',
  'BAT-01–18 provider certification, restart/recovery and paper/live-swap evidence is unexecuted.',
  'Discovery/foundation acceptance and Product/Broker/Legal/Risk/Security/Engineering/QA/Operations approvals are pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 7.2 Broker Paper Adapter',
  localControls: failures.length === 0 ? 'PASS' : 'FAIL',
  readinessDecision:
    'Local Synthetic Broker Adapter Ready / Selected-Provider Certification and Accountable Acceptance Pending',
  brokerPaperAdapterAccepted: false,
  brokerSelected: false,
  credentialsCreated: false,
  providerConnected: false,
  paperTradingAuthorityCreated: false,
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
  `Broker paper-adapter readiness: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`,
);
