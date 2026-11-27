import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/risk-domain-readiness');
const artifacts = [
  'docs/engineering/RISK_DOMAIN_ACCEPTANCE.md',
  'src/MAKH.Application/Risk/RiskContracts.cs',
  'src/MAKH.Application/Risk/RiskEngine.cs',
  'src/MAKH.Application/Risk/RiskPolicyCatalog.cs',
  'tests/MAKH.Architecture.Tests/RiskEngineTests.cs',
  'tests/MAKH.Architecture.Tests/RiskEnginePropertyTests.cs',
  'docs/api/openapi.yaml',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
  'outputs/scanner-certification-gate-readiness/readiness-manifest.json',
  'outputs/portal-provenance-gate/local-evidence-manifest.json',
];
const failures = [];
const sha = (content) => crypto.createHash('sha256').update(content).digest('hex');
const read = (relativeFile) => {
  const file = path.join(root, relativeFile);
  if (!fs.existsSync(file)) {
    failures.push(`${relativeFile} is missing.`);
    return Buffer.from('');
  }
  return fs.readFileSync(file);
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

const contracts = text['src/MAKH.Application/Risk/RiskContracts.cs'];
const engine = text['src/MAKH.Application/Risk/RiskEngine.cs'];
const catalog = text['src/MAKH.Application/Risk/RiskPolicyCatalog.cs'];
const tests = `${text['tests/MAKH.Architecture.Tests/RiskEngineTests.cs']}\n${text['tests/MAKH.Architecture.Tests/RiskEnginePropertyTests.cs']}`;
const acceptance = text['docs/engineering/RISK_DOMAIN_ACCEPTANCE.md'];
const foundation = json('outputs/engineering-foundation-gate-readiness/readiness-manifest.json');
const scanner = json('outputs/scanner-certification-gate-readiness/readiness-manifest.json');
const portal = json('outputs/portal-provenance-gate/local-evidence-manifest.json');

const checks = [
  {
    id: 'policy-validity',
    passed:
      contracts.includes('maximumSymbolExposure > maximumGrossExposure') &&
      contracts.includes('maximumPositionNotional > maximumSymbolExposure'),
    detail: 'Policy construction rejects incoherent positive limits.',
  },
  {
    id: 'unique-effective-policy',
    passed:
      catalog.includes('Risk policy versions must be unique.') &&
      catalog.includes('cannot overlap') &&
      catalog.includes('Exactly one effective risk policy'),
    detail: 'Policy resolution is unique, effective-dated and fail closed.',
  },
  {
    id: 'paper-only-authority',
    passed:
      contracts.includes('CanCreatePaperOrderProposal') &&
      contracts.includes('CanSubmitBrokerOrder => Denied') &&
      contracts.includes('CanAuthorizeLiveTrading => Denied'),
    detail: 'A decision can support only a paper proposal and grants no broker/live authority.',
  },
  {
    id: 'ordered-rules',
    passed: [
      'PaperMode',
      'SystemHealth',
      'AccountState',
      'StrategyAllowed',
      'MarketDataFresh',
      'ProtectiveStopValid',
      'DailyLossCapacity',
      'PerTradeRiskCapacity',
      'SymbolExposureCapacity',
      'GrossExposureCapacity',
      'BuyingPowerCapacity',
      'QuantityCapacity',
    ].every((value) => engine.includes(`RiskRuleCode.${value}`)),
    detail:
      'The deterministic evaluation covers authority, state, freshness, price, loss, exposure, buying power and quantity.',
  },
  {
    id: 'whole-share-tightest-cap',
    passed:
      engine.includes('decimal.Floor(capacity / divisor)') &&
      engine.includes('policy.MaximumOrderQuantity') &&
      engine.includes('.Concat(quantityCaps).Min()'),
    detail: 'Sizing floors whole shares and selects the tightest applicable cap.',
  },
  {
    id: 'coherent-exposure-state',
    passed:
      engine.includes('request.CurrentSymbolExposure <= request.CurrentGrossExposure') &&
      tests.includes('ImpossibleExposureStateFailsClosed'),
    detail: 'Impossible symbol-versus-gross exposure state rejects.',
  },
  {
    id: 'complete-evidence-binding',
    passed:
      [
        'request.Strategy',
        'request.RequestedQuantity',
        'request.RealizedDailyPnl',
        'request.CurrentGrossExposure',
        'request.CurrentSymbolExposure',
        'request.AvailableBuyingPower',
        'request.CorrelationId',
        'approvedNotional',
        'maximumLoss',
        'rule.Reason',
      ].every((value) => engine.includes(`Add(canonical, ${value})`)) &&
      engine.includes("Append(':').Append(text)"),
    detail:
      'Length-prefixed SHA-256 evidence binds complete request, outcome, monetary results and rules.',
  },
  {
    id: 'deterministic-property-coverage',
    passed:
      tests.includes('5_000') &&
      (tests.match(/2_000/g)?.length ?? 0) >= 2 &&
      tests.includes('RandomizedApprovedSizingNeverExceedsAnyCapacity') &&
      tests.includes('RandomizedUnknownOrDegradedAuthorityAlwaysRejects'),
    detail:
      'Deterministic generated coverage exercises sizing, degraded authority and policy timelines.',
  },
  {
    id: 'api-contract-present',
    passed:
      text['docs/api/openapi.yaml'].includes('publishRiskPolicyVersion') &&
      text['docs/api/openapi.yaml'].includes('RiskPolicyVersion'),
    detail: 'The governed risk-policy API contract remains defined.',
  },
  {
    id: 'predecessors-fail-closed',
    passed: [foundation, scanner, portal].every(
      (manifest) => manifest.localControls === 'PASS' && manifest.gateAccepted === false,
    ),
    detail:
      'Foundation, scanner and portal local controls pass while accountable gates remain unaccepted.',
  },
  {
    id: 'acceptance-boundary',
    passed:
      acceptance.includes('Status: In progress — 90%') &&
      acceptance.includes(
        'no API, database, account, provider, broker, credentials or order-submission path',
      ),
    detail:
      'The acceptance record states current maturity and preserves the no-authority boundary.',
  },
  {
    id: 'external-work-explicit',
    passed: [
      'Risk Owner-approved policy values',
      'PostgreSQL policy/decision persistence',
      'Authoritative account',
      'representative load',
      'accountable approvals',
    ].every((value) => acceptance.includes(value)),
    detail:
      'Policy, persistence, authoritative-input, operational and approval gaps remain explicit.',
  },
];
for (const check of checks) if (!check.passed) failures.push(`Check failed: ${check.id}`);

const blockers = [
  'Risk Owner-approved limits, mappings, definitions, session behavior and exception governance are absent.',
  'Authenticated evaluation/administration, fresh MFA, idempotency and immutable audit are incomplete.',
  'PostgreSQL policy/decision persistence, concurrency, outbox and protected retention are incomplete.',
  'Authoritative account, position, P&L, market, broker, reconciliation and health inputs are unavailable.',
  'Hosted database, authorization, load, recovery, chaos and audit-reconstruction evidence is unavailable.',
  'Foundation/scanner/portal acceptance and Product/Risk/Security/Data/Engineering/QA/Operations approvals are pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 7.1 Risk Domain',
  localControls: failures.length === 0 ? 'PASS' : 'FAIL',
  readinessDecision:
    'Local Risk Domain Ready / Persistence, Authoritative Inputs and Accountable Acceptance Pending',
  riskDomainAccepted: false,
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
  `Risk-domain readiness: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`,
);
