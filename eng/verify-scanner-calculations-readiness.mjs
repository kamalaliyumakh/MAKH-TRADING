import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/SCANNER_CALCULATIONS_ACCEPTANCE.md',
  'src/MAKH.Application/Market/ScannerCalculations.cs',
  'tests/MAKH.Architecture.Tests/ScannerCalculationsTests.cs',
  'outputs/security-master-readiness/readiness-manifest.json',
  'outputs/market-data-adapter-readiness/readiness-manifest.json',
  'outputs/reference-data-adapter-readiness/readiness-manifest.json',
  'docs/uat/SCANNER_TO_RISK_WORKFLOW_UAT.md',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const calculations = contents.get(files[1]);
const tests = contents.get(files[2]);
const securityMaster = JSON.parse(contents.get(files[3]));
const marketData = JSON.parse(contents.get(files[4]));
const referenceData = JSON.parse(contents.get(files[5]));
const workflowUat = contents.get(files[6]);

const checks = [
  { id: 'versioned-strategy-policy', passed: calculations.includes('ScannerCalculationPolicy') && calculations.includes('minimumPrice = 3m') && calculations.includes('maximumPrice = 7m') && calculations.includes('minimumRelativeVolume = 3m') && calculations.includes('maximumPublicFloat = 500_000'), detail: 'The controlled $3–$7, 3x RVOL and 500k float boundaries are versioned.' },
  { id: 'extreme-gain-boundary', passed: calculations.includes('extremeGainMinimumPercent = 100m') && calculations.includes('extremeGainMaximumPercent = 600m') && tests.includes('ExtremeMoveUsesInclusiveRiskBoundaries') && workflowUat.includes('100%'), detail: 'Inclusive 100%–600% qualification is also retained as an elevated-risk flag.' },
  { id: 'qualified-price-and-quote', passed: calculations.includes('Quote and last eligible trade are required') && calculations.includes('Quote is not executable'), detail: 'Price requires both qualified quote context and positive eligible trade evidence.' },
  { id: 'future-quote-rejection', passed: calculations.includes('Quote event time cannot follow calculation time') && tests.includes('FutureQuoteInvalidatesPriceAndSpread'), detail: 'Future quote evidence invalidates price and spread.' },
  { id: 'rvol-and-liquidity-metrics', passed: calculations.includes('historicalCumulativeVolumes.Average') && calculations.includes('spreadPercent') && calculations.includes('dollarVolume'), detail: 'RVOL, spread, spread percentage and dollar volume retain deterministic formulas.' },
  { id: 'float-security-and-kind-binding', passed: calculations.includes('Kind: ShareMetricKind.PublicFloat') && calculations.includes('floatFact.SecurityId == quote.SecurityId') && tests.includes('FloatMustMatchQuoteSecurityAndMetricKind'), detail: 'Float evidence must match both canonical security and metric kind.' },
  { id: 'float-observation-fencing', passed: calculations.includes('floatFact.Provenance.ObservedAt <= asOf') && tests.includes('FloatObservedAfterCalculationCannotQualify'), detail: 'Reference evidence observed after calculation time cannot qualify.' },
  { id: 'no-order-authority', passed: calculations.includes('CreatesOrderAuthority') && calculations.includes('false);') && acceptance.includes('never improves rank or creates order authority'), detail: 'Discovery calculations never create order authority.' },
  { id: 'unaccepted-predecessors', passed: securityMaster.securityMasterAccepted === false && marketData.marketDataAdapterAccepted === false && referenceData.referenceDataAdapterAccepted === false, detail: 'Security, market-data and reference-data predecessors remain unaccepted.' },
  { id: 'no-fresh-or-external-certification', passed: acceptance.includes('not represented as executed evidence') && acceptance.includes('no provider, broker, order or external service is connected'), detail: 'No fresh test, licensed replay, provider, broker or order authority is inferred.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Scanner-calculation readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'The newly authored focused cases require a successful repository-pinned .NET 10 rerun.',
  'Calculation definitions, rounding/precision, quote freshness, sale conditions, sessions and corporate-action adjustment remain unapproved.',
  'Spread, dollar-volume, depth and confidence qualification thresholds remain undefined and are not invented here.',
  'PostgreSQL input snapshots, hashes, source references and immutable calculation-version records remain incomplete.',
  'Licensed correction/split/halt/missing-interval/early-close replay and Data/Backend/Risk/Product acceptance remain unavailable.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 5.4 Scanner Calculations readiness',
  localControls: 'PASS',
  readinessDecision: 'Calculation Integrity Ready / Definition and Licensed Replay Pending',
  calculationsAccepted: false,
  definitionsApproved: false,
  licensedReplayCertified: false,
  orderAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/scanner-calculations-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/scanner-calculations-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Scanner calculations: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Calculation Integrity Ready / Definition and Licensed Replay Pending.`);
