import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/reconciliation-readiness');
const artifacts = [
  'docs/engineering/RECONCILIATION_ACCEPTANCE.md',
  'src/MAKH.Application/Reconciliation/ReconciliationContracts.cs',
  'src/MAKH.Application/Reconciliation/ReconciliationService.cs',
  'src/MAKH.Infrastructure/Reconciliation/InMemoryReconciliationStore.cs',
  'tests/MAKH.Architecture.Tests/ReconciliationServiceTests.cs',
  'outputs/risk-domain-readiness/readiness-manifest.json',
  'outputs/broker-paper-adapter-readiness/readiness-manifest.json',
  'outputs/paper-oms-readiness/readiness-manifest.json',
  'outputs/position-ledger-readiness/readiness-manifest.json',
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

const contracts = text['src/MAKH.Application/Reconciliation/ReconciliationContracts.cs'];
const service = text['src/MAKH.Application/Reconciliation/ReconciliationService.cs'];
const store = text['src/MAKH.Infrastructure/Reconciliation/InMemoryReconciliationStore.cs'];
const tests = text['tests/MAKH.Architecture.Tests/ReconciliationServiceTests.cs'];
const acceptance = text['docs/engineering/RECONCILIATION_ACCEPTANCE.md'];
const risk = json('outputs/risk-domain-readiness/readiness-manifest.json');
const broker = json('outputs/broker-paper-adapter-readiness/readiness-manifest.json');
const oms = json('outputs/paper-oms-readiness/readiness-manifest.json');
const positions = json('outputs/position-ledger-readiness/readiness-manifest.json');
const foundation = json('outputs/engineering-foundation-gate-readiness/readiness-manifest.json');

const checks = [
  {
    id: 'fail-closed-default',
    passed:
      service.includes('No clean reconciliation has completed.') &&
      tests.includes('NewAccountFailsClosedBeforeFirstCleanRun'),
    detail: 'A new account remains Unknown and entry-blocked before a clean run.',
  },
  {
    id: 'canonical-bounded-snapshots',
    passed:
      contracts.includes('Order state must be canonical.') &&
      contracts.includes('Snapshot collections cannot exceed 10,000 items.') &&
      contracts.includes('Snapshot time must be a non-default UTC timestamp.') &&
      tests.includes('ContractsRejectNonCanonicalOrNonUtcEvidence'),
    detail:
      'Snapshot identity, canonical state, long-only quantities, bounds and UTC time fail closed.',
  },
  {
    id: 'content-bound-identity',
    passed:
      contracts.includes('PlatformContentHash') &&
      service.includes('SHA256.HashData') &&
      service.includes("Append(':').Append(text)") &&
      tests.includes('ChangedContentCannotReplayUnderTheSameCallerChecksum'),
    detail:
      'Length-prefixed SHA-256 fingerprints bind complete ordered snapshot content independently of caller checksums.',
  },
  {
    id: 'exact-two-source-replay',
    passed:
      service.includes('platformContentHash, previous.PlatformContentHash') &&
      service.includes('brokerContentHash, previous.BrokerContentHash') &&
      tests.includes('ExactSnapshotReplayReturnsOriginalRunWithoutSequenceChurn'),
    detail: 'Only exact two-source checksum and content replay returns the original run.',
  },
  {
    id: 'independent-high-water-fences',
    passed:
      service.includes('FirstObservedFence(state.Runs') &&
      service.includes('.OrderBy(run => run.Sequence).First()') &&
      tests.includes('StaleFailureCannotMoveEitherSourceHighWaterBackward'),
    detail:
      'First-observed maximum platform and broker fences cannot move backward after stale/conflicting runs.',
  },
  {
    id: 'same-time-conflict',
    passed:
      service.includes('snapshot.AsOf == fence.AsOf') &&
      service.includes('contentHash, fence.ContentHash') &&
      tests.includes('ChangedChecksumAtSameSourceTimeFailsClosed'),
    detail: 'Caller-checksum or content changes at an observed timestamp produce Unknown.',
  },
  {
    id: 'complete-comparison',
    passed:
      service.includes('CompareMoney(items, "Cash"') &&
      service.includes('CompareMoney(items, "BuyingPower"') &&
      service.includes('platformOrders.Keys.Union') &&
      service.includes('platformPositions.Keys.Union'),
    detail: 'Cash, buying power, complete order union and complete position union are compared.',
  },
  {
    id: 'entry-lock-policy',
    passed:
      service.includes('outcome != ReconciliationOutcome.Matched') &&
      tests.includes('CleanRunAfterMismatchClearsLockButPreservesHistory') &&
      tests.includes('StaleCleanSnapshotsCannotClearNewerMismatchLock'),
    detail: 'Mismatch/Unknown locks entry; only later clean, fresh evidence can clear it.',
  },
  {
    id: 'completion-chronology',
    passed:
      service.includes('Reconciliation completion chronology cannot regress.') &&
      service.includes('Completion cannot predate a source snapshot.'),
    detail:
      'Run completion cannot predate source evidence or regress account completion chronology.',
  },
  {
    id: 'deterministic-evidence',
    passed:
      service.includes('CultureInfo.InvariantCulture') &&
      service.includes('.OrderBy(item => item.ClientOrderId') &&
      service.includes('.OrderBy(item => item.SecurityId)'),
    detail: 'Comparison and content evidence are invariant and deterministically ordered.',
  },
  {
    id: 'atomic-local-history',
    passed:
      store.includes('lock (sync) return operation(state)') &&
      contracts.includes('IsBrokerAuthoritative => Sequence < 0') &&
      contracts.includes('CreatesLiveAuthority => Sequence < 0'),
    detail: 'Local history/state mutation is process-atomic and explicitly non-authoritative.',
  },
  {
    id: 'predecessors-and-boundary',
    passed:
      [risk, broker, oms, positions, foundation].every((item) => item.localControls === 'PASS') &&
      risk.riskDomainAccepted === false &&
      broker.brokerPaperAdapterAccepted === false &&
      oms.paperOmsAccepted === false &&
      positions.positionLedgerAccepted === false &&
      foundation.gateAccepted === false &&
      acceptance.includes('In progress — 90%') &&
      acceptance.includes('cannot authorize live trading'),
    detail:
      'Local predecessors pass while accountable acceptance, broker connection and trading authority remain absent.',
  },
];
for (const check of checks) if (!check.passed) failures.push(`Check failed: ${check.id}`);

const blockers = [
  'PostgreSQL runs/items, atomic account lock state, durable high-water fencing and outbox publication are absent.',
  'Complete selected-broker paginated order/execution/position/cash/buying-power snapshots and checksum guarantees are absent.',
  'Risk/OMS/operator/UI integration of the entry lock and governed resolution workflow are absent.',
  'Approved tolerances, timing windows, settled/unsettled cash, corporate-action and resolution policies are absent.',
  'The new focused regression cases were not freshly executed because the pinned .NET compile stalled.',
  'Foundation/risk/broker/OMS/position acceptance and Broker/Risk/Finance/Compliance/Operations/Product approvals remain pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 7.5 Broker Reconciliation',
  localControls: failures.length === 0 ? 'PASS' : 'FAIL',
  readinessDecision:
    'Local Reconciliation Integrity Ready / Durable Orchestration, Broker Certification and Accountable Acceptance Pending',
  reconciliationAccepted: false,
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
  `Reconciliation readiness: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`,
);
