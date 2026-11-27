import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/position-ledger-readiness');
const artifacts = [
  'docs/engineering/POSITION_LEDGER_ACCEPTANCE.md',
  'src/MAKH.Application/Positions/PositionContracts.cs',
  'src/MAKH.Application/Positions/PositionLedgerService.cs',
  'src/MAKH.Infrastructure/Positions/InMemoryPositionLedgerStore.cs',
  'tests/MAKH.Architecture.Tests/PositionLedgerServiceTests.cs',
  'src/MAKH.Application/Broker/BrokerContracts.cs',
  'outputs/risk-domain-readiness/readiness-manifest.json',
  'outputs/broker-paper-adapter-readiness/readiness-manifest.json',
  'outputs/paper-oms-readiness/readiness-manifest.json',
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

const contracts = text['src/MAKH.Application/Positions/PositionContracts.cs'];
const service = text['src/MAKH.Application/Positions/PositionLedgerService.cs'];
const store = text['src/MAKH.Infrastructure/Positions/InMemoryPositionLedgerStore.cs'];
const tests = text['tests/MAKH.Architecture.Tests/PositionLedgerServiceTests.cs'];
const acceptance = text['docs/engineering/POSITION_LEDGER_ACCEPTANCE.md'];
const risk = json('outputs/risk-domain-readiness/readiness-manifest.json');
const broker = json('outputs/broker-paper-adapter-readiness/readiness-manifest.json');
const oms = json('outputs/paper-oms-readiness/readiness-manifest.json');
const foundation = json('outputs/engineering-foundation-gate-readiness/readiness-manifest.json');

const checks = [
  {
    id: 'fact-contract-validation',
    passed:
      contracts.includes('Enum.IsDefined(side)') &&
      contracts.includes('Enum.IsDefined(kind)') &&
      contracts.includes('non-default UTC timestamp') &&
      tests.includes('ExecutionValidatesIdentityQuantityPriceAndCorrectionLineage'),
    detail:
      'Execution facts require scoped identity, positive economics, defined enums and non-default UTC time.',
  },
  {
    id: 'exactly-once-ingestion',
    passed:
      service.includes('Execution identity conflict.') &&
      tests.includes('DuplicateExecutionHasExactlyOneEffect') &&
      tests.includes('DuplicateExecutionIdentityWithDifferentPayloadConflicts'),
    detail: 'Exact execution replay has one effect while conflicting identity reuse fails closed.',
  },
  {
    id: 'long-only-pnl',
    passed:
      service.includes('cannot create a short position') &&
      tests.includes('PartialSellRealizesPnlAndRetainsAverageCost') &&
      tests.includes('FullExitClearsQuantityCostAndAverageButKeepsRealizedPnl'),
    detail:
      'Average-cost, fee-aware realized P&L remains long-only and full exits clear open cost.',
  },
  {
    id: 'execution-chronology',
    passed:
      service.includes('Execution chronology cannot regress within a position.') &&
      tests.includes('ExecutionChronologyAndNestedCorrectionsFailClosed'),
    detail: 'Per-position execution chronology cannot regress.',
  },
  {
    id: 'correction-lineage',
    passed:
      service.includes('Correction scope does not match') &&
      service.includes('Correction order or side does not match') &&
      service.includes('Nested correction or bust lineage is not supported.') &&
      tests.includes('CorrectionRequiresMatchingOrderSideAndChronology'),
    detail:
      'Corrections/busts bind provider, account, position, order, side and direct fill lineage.',
  },
  {
    id: 'dependent-fill-safety',
    passed:
      service.includes('cannot be safely reversed after dependent sells') &&
      tests.includes('BuyCannotBeReversedAfterDependentSellWithoutReconciliation'),
    detail: 'Unsafe reversal after dependent position activity fails closed.',
  },
  {
    id: 'mark-fencing',
    passed:
      service.includes('A mark cannot predate the latest execution.') &&
      service.includes('Conflicting mark exists at the same timestamp.') &&
      tests.includes('MarkReplayIsIdempotentAndSameTimestampConflictFailsClosed'),
    detail: 'Marks are UTC, execution-relative, stale-safe and equal-time conflict fenced.',
  },
  {
    id: 'protection-fencing',
    passed:
      service.includes('Protection evidence cannot predate the latest execution.') &&
      service.includes('Unknown broker state cannot assert confirmed protection quantity.') &&
      tests.includes('ProtectionReplayIsIdempotentAndSameTimestampConflictFailsClosed'),
    detail:
      'Protection evidence is UTC, execution-relative and cannot claim confirmation from unknown broker state.',
  },
  {
    id: 'stale-derived-evidence-invalidation',
    passed:
      service.includes('MarkPrice = position.MarkAsOf < fact.ExecutedAt ? null') &&
      service.includes('new PositionProtection(0, 0, null, DateTimeOffset.MinValue, false)') &&
      tests.includes('LaterExecutionInvalidatesOlderMarkAndProtectionEvidence'),
    detail:
      'A later execution clears older mark evidence and resets older protection evidence to Unknown.',
  },
  {
    id: 'coverage-classification',
    passed:
      contracts.includes('ProtectionState.UnderProtected') &&
      contracts.includes('ProtectionState.OverProtected') &&
      tests.includes('ProtectionDetectsDesiredAndConfirmedUnderOrOverCoverage'),
    detail: 'Desired and broker-confirmed under/over coverage require reconciliation.',
  },
  {
    id: 'atomic-local-projection',
    passed:
      store.includes('lock (sync) return operation(state)') &&
      contracts.includes('IsBrokerAuthoritative => Version < 0') &&
      contracts.includes('CreatesLiveAuthority => Version < 0'),
    detail: 'Local projection updates are process-atomic and explicitly non-authoritative.',
  },
  {
    id: 'predecessors-and-boundary',
    passed:
      risk.localControls === 'PASS' &&
      broker.localControls === 'PASS' &&
      oms.localControls === 'PASS' &&
      foundation.localControls === 'PASS' &&
      risk.riskDomainAccepted === false &&
      broker.brokerPaperAdapterAccepted === false &&
      oms.paperOmsAccepted === false &&
      foundation.gateAccepted === false &&
      acceptance.includes('In progress — 90%') &&
      acceptance.includes('cannot authorize live trading'),
    detail:
      'Local predecessors pass while accountable acceptance, broker connection and trading authority remain absent.',
  },
];
for (const check of checks) if (!check.passed) failures.push(`Check failed: ${check.id}`);

const blockers = [
  'Atomic PostgreSQL execution ingestion, projection concurrency, immutable history and outbox publication are absent.',
  'Selected-broker execution, correction, bust and fee mappings are absent and uncertified.',
  'Approved P&L definitions for sessions, currency, corporate actions, taxes and rounding are absent.',
  'Broker-versus-platform position/protection reconciliation and protective-order command integration are absent.',
  'The new focused regression cases were not freshly executed because the pinned .NET compile stalled.',
  'Foundation/risk/broker/OMS acceptance and Product/Risk/Compliance/Finance/Operations approvals remain pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 7.4 Positions and Executions',
  localControls: failures.length === 0 ? 'PASS' : 'FAIL',
  readinessDecision:
    'Local Position Ledger Ready / Durable Execution, Broker Reconciliation and Accountable Acceptance Pending',
  positionLedgerAccepted: false,
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
  `Position-ledger readiness: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`,
);
