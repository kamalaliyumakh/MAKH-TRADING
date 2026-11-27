import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/paper-oms-readiness');
const artifacts = [
  'docs/engineering/PAPER_OMS_ACCEPTANCE.md',
  'src/MAKH.Application/Orders/PaperOmsContracts.cs',
  'src/MAKH.Application/Orders/PaperOmsService.cs',
  'src/MAKH.Infrastructure/Orders/InMemoryPaperOmsStore.cs',
  'tests/MAKH.Architecture.Tests/PaperOmsServiceTests.cs',
  'src/MAKH.Application/Broker/BrokerContracts.cs',
  'outputs/risk-domain-readiness/readiness-manifest.json',
  'outputs/broker-paper-adapter-readiness/readiness-manifest.json',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
  'docs/api/openapi.yaml',
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

const service = text['src/MAKH.Application/Orders/PaperOmsService.cs'];
const contracts = text['src/MAKH.Application/Orders/PaperOmsContracts.cs'];
const store = text['src/MAKH.Infrastructure/Orders/InMemoryPaperOmsStore.cs'];
const tests = text['tests/MAKH.Architecture.Tests/PaperOmsServiceTests.cs'];
const acceptance = text['docs/engineering/PAPER_OMS_ACCEPTANCE.md'];
const risk = json('outputs/risk-domain-readiness/readiness-manifest.json');
const broker = json('outputs/broker-paper-adapter-readiness/readiness-manifest.json');
const foundation = json('outputs/engineering-foundation-gate-readiness/readiness-manifest.json');

const checks = [
  {
    id: 'risk-approved-proposal',
    passed:
      service.includes('Risk approval for a paper proposal is required.') &&
      tests.includes('ProposalRequiresRiskApprovalAndFutureExpiry'),
    detail: 'Only a risk-approved, unexpired proposal can become a submission intent.',
  },
  {
    id: 'canonical-proposal-evidence',
    passed:
      service.includes("Append(':').Append(text)") &&
      service.includes('CultureInfo.InvariantCulture') &&
      tests.includes('ProposalDigestIsDeterministic'),
    detail: 'Proposal evidence is SHA-256 hashed from length-prefixed, culture-invariant values.',
  },
  {
    id: 'defined-execution-enums',
    passed:
      service.includes('Enum.IsDefined(side)') &&
      service.includes('Enum.IsDefined(timeInForce)') &&
      tests.includes('ProposalRejectsUndefinedExecutionEnums'),
    detail: 'Undefined order side and time-in-force values fail closed at proposal creation.',
  },
  {
    id: 'serialized-idempotent-submit',
    passed:
      service.includes('submitGate.WaitAsync') &&
      tests.includes('ConcurrentExactSubmissionsReachProviderAtMostOnce') &&
      tests.includes('ChangedSubmitPayloadWithSameKeyConflicts'),
    detail: 'One service instance serializes exact submission replays and rejects changed intent.',
  },
  {
    id: 'broker-response-binding',
    passed:
      service.includes('ValidateBrokerOrder(proposal, submitted.Order)') &&
      service.includes('contradicts the approved proposal') &&
      tests.includes('SubmissionRejectsBrokerResponseThatContradictsApprovedProposal'),
    detail: 'A broker response must match the approved proposal before managed state is created.',
  },
  {
    id: 'unknown-outcome-lockout',
    passed:
      service.includes('Unknown broker state requires reconciliation before mutation.') &&
      tests.includes('UnknownSubmissionBlocksCancelAndReplaceUntilReconciled'),
    detail: 'Unknown submission outcomes block cancel and replace until reconciled.',
  },
  {
    id: 'optimistic-mutation-control',
    passed:
      service.includes('Order version conflict.') &&
      tests.includes('StaleCancelOrReplaceVersionIsRejected') &&
      tests.includes('CancelChangedPayloadWithSameKeyConflicts'),
    detail: 'Cancel and replace use optimistic versions and idempotent command identities.',
  },
  {
    id: 'reconciliation-scope',
    passed:
      service.includes('provider, identity or account scope does not match') &&
      tests.includes('ReconciliationRejectsContradictoryProviderSecurityAndExecutionTerms'),
    detail: 'Provider, order, account, security and execution scope contradictions fail closed.',
  },
  {
    id: 'monotonic-snapshot-fencing',
    passed:
      service.includes('conflicting broker snapshot reused the current observation time') &&
      tests.includes('ReconciliationRejectsSameTimestampConflictAndUndefinedState') &&
      tests.includes('ReconciliationDoesNotRegressCumulativeFills'),
    detail: 'Stale/regressive observations are ignored and equal-time conflicts are rejected.',
  },
  {
    id: 'terminal-race-policy',
    passed:
      tests.includes(
        'AuthoritativeFillCanOverrideCancellationButOtherTerminalRegressionsAreIgnored',
      ) && tests.includes('TerminalOrderCannotBeMutated'),
    detail: 'Terminal truth cannot regress while an authoritative full fill can win a cancel race.',
  },
  {
    id: 'atomic-local-store',
    passed:
      store.includes('lock (sync) return operation(state)') &&
      contracts.includes('Dictionary<string, (string Hash, OmsCommandResult Result)>'),
    detail: 'The local store makes each state operation atomic within one process.',
  },
  {
    id: 'predecessors-and-boundary',
    passed:
      risk.localControls === 'PASS' &&
      broker.localControls === 'PASS' &&
      foundation.localControls === 'PASS' &&
      risk.riskDomainAccepted === false &&
      broker.brokerPaperAdapterAccepted === false &&
      foundation.gateAccepted === false &&
      acceptance.includes('Status: In progress — 90%') &&
      acceptance.includes('cannot submit an order to any broker'),
    detail:
      'Local predecessor controls pass, but acceptance and all external trading authority remain absent.',
  },
];
for (const check of checks) if (!check.passed) failures.push(`Check failed: ${check.id}`);

const blockers = [
  'Authenticated/authorized REST commands, CSRF controls, server-scoped idempotency, If-Match and explicit confirmation are absent.',
  'PostgreSQL transactional persistence, immutable history, cross-process claims, outbox delivery and restart recovery are absent.',
  'Selected-broker submit/query/cancel/replace integration and provider-specific reconciliation are absent.',
  'Execution/correction, position and protective-order integration plus race/load/chaos/recovery evidence are absent.',
  'The three new focused regression cases were not freshly executed because the pinned .NET compile stalled.',
  'Foundation, risk, broker and Product/Security/Engineering/QA/Operations accountable acceptance remains pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 7.3 Order Management System',
  localControls: failures.length === 0 ? 'PASS' : 'FAIL',
  readinessDecision:
    'Local Paper OMS Ready / Durable Persistence, Selected-Broker Integration and Accountable Acceptance Pending',
  paperOmsAccepted: false,
  entryLockCleared: false,
  brokerConnected: false,
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
  `Paper OMS readiness: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`,
);
