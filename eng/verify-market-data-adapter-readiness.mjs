import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/MARKET_DATA_ADAPTER_ACCEPTANCE.md',
  'src/MAKH.Application/Market/MarketDataContracts.cs',
  'src/MAKH.Application/Market/MarketDataNormalizer.cs',
  'src/MAKH.Infrastructure/Market/SyntheticMarketDataAdapter.cs',
  'tests/MAKH.Architecture.Tests/MarketDataAdapterTests.cs',
  'outputs/security-master-readiness/readiness-manifest.json',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
  'docs/vendors/VENDOR_DECISION_RECORD.md',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const contracts = contents.get(files[1]);
const normalizer = contents.get(files[2]);
const adapter = contents.get(files[3]);
const tests = contents.get(files[4]);
const securityMaster = JSON.parse(contents.get(files[5]));
const foundation = JSON.parse(contents.get(files[6]));
const vendor = contents.get(files[7]);

const checks = [
  { id: 'provider-neutral-stream-port', passed: contracts.includes('interface IMarketDataProvider') && contracts.includes('IAsyncEnumerable<NormalizedMarketEvent>'), detail: 'The application owns a provider-neutral asynchronous market-event port.' },
  { id: 'complete-event-kinds', passed: ['Quote', 'Trade', 'Bar', 'MarketStatus'].every((kind) => contracts.includes(kind)), detail: 'Quote, trade, bar and market-status facts are modeled.' },
  { id: 'provenance-and-time-order', passed: contracts.includes('ThrowIfNegativeOrZero(sequence)') && contracts.includes('Receipt time cannot precede event time') && contracts.includes('ToUniversalTime()'), detail: 'Positive sequence, causal time ordering and UTC normalization are enforced.' },
  { id: 'correction-lineage', passed: contracts.includes('cannot correct itself') && adapter.includes('earlier emitted event') && tests.includes('AdapterRejectsOrphanCorrectionAndSequenceCollision'), detail: 'Corrections cannot self-reference or target unseen requested-stream evidence.' },
  { id: 'quote-quality-fail-closed', passed: contracts.includes('Quote prices and quality classification are inconsistent') && normalizer.includes('Evaluation time cannot precede') && tests.includes('QuoteQualityMustMatchPriceShape'), detail: 'Price shape, freshness and evaluation chronology fail closed.' },
  { id: 'trade-and-bar-safety', passed: contracts.includes('ContributesToMetrics') && contracts.includes('OHLC values are inconsistent') && contracts.includes('ArgumentOutOfRangeException.ThrowIfLessThan(version, 1)'), detail: 'Cancelled/ineligible trades and malformed/versionless bars are rejected from downstream truth.' },
  { id: 'market-state-gate', passed: contracts.includes('AllowsNewExposure') && contracts.includes('MarketTradingState.Open') && tests.includes('OnlyOpenMarketAllowsNewExposure'), detail: 'Only an explicit open state permits new-exposure readiness.' },
  { id: 'synthetic-replay-integrity', passed: adapter.includes('sequenceOwners') && adapter.includes('seen.Add') && adapter.includes('another provider') && tests.includes('SyntheticAdapterOrdersFiltersAndDeduplicates'), detail: 'Synthetic replay filters scope, orders/deduplicates evidence and rejects provider/sequence conflicts.' },
  { id: 'unaccepted-predecessors', passed: securityMaster.securityMasterAccepted === false && foundation.gateAccepted === false && vendor.includes('Pending'), detail: 'Security master, foundation and provider decisions remain explicitly unaccepted.' },
  { id: 'no-external-or-trading-authority', passed: acceptance.includes('No vendor endpoint, credential, licensed payload or external service is connected') && acceptance.includes('not represented as executed evidence'), detail: 'No licensed connection, fresh test claim or trading authority is inferred.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Market-data adapter readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'The newly authored focused cases require a successful repository-pinned .NET 10 rerun.',
  'No approved provider, entitlement, credential or licensed representative sample is available.',
  'Provider conditions, LULD, exchange calendars, reconnect/backoff, rate-limit and recovery mappings remain uncertified.',
  'PostgreSQL/outbox persistence, checkpoints, gap reconciliation, load/soak, telemetry and recovery evidence remain incomplete.',
  'WBS 1.4, 3.8 and 5.1 plus Data, Backend, Risk and Product acceptance remain unavailable.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 5.2 Market Data Adapter readiness',
  localControls: 'PASS',
  readinessDecision: 'Contract Ready / Licensed Integration Pending',
  marketDataAdapterAccepted: false,
  licensedProviderCertified: false,
  externalConnectivityEnabled: false,
  scannerAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/market-data-adapter-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/market-data-adapter-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Market data adapter: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Contract Ready / Licensed Integration Pending.`);
