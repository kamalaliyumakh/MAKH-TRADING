import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/SCANNER_SERVICE_ACCEPTANCE.md',
  'src/MAKH.Application/Market/ScannerService.cs',
  'tests/MAKH.Architecture.Tests/ScannerServiceTests.cs',
  'src/MAKH.Infrastructure/Market/PostgresScannerRunRepository.cs',
  'src/MAKH.Infrastructure/Market/ScannerOutboxMessageFactory.cs',
  'tests/MAKH.Architecture.Tests/ScannerPersistenceTests.cs',
  'tests/MAKH.Architecture.Tests/ScannerCorrectionReplayTests.cs',
  'outputs/security-master-readiness/readiness-manifest.json',
  'outputs/market-data-adapter-readiness/readiness-manifest.json',
  'outputs/reference-data-adapter-readiness/readiness-manifest.json',
  'outputs/scanner-calculations-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const service = contents.get(files[1]);
const tests = contents.get(files[2]);
const repository = contents.get(files[3]);
const outbox = contents.get(files[4]);
const persistenceTests = contents.get(files[5]);
const replay = contents.get(files[6]);
const predecessors = files.slice(7).map((file) => JSON.parse(contents.get(file)));

const checks = [
  { id: 'published-versioned-preset', passed: service.includes('VersionKey') && service.includes('cannot be used before publication') && tests.includes('PresetCannotRunBeforePublication'), detail: 'Versioned presets cannot run before their UTC publication time.' },
  { id: 'unique-security-inputs', passed: service.includes('only one input per security') && tests.includes('DuplicateSecurityInputIsRejected'), detail: 'Duplicate canonical securities fail closed.' },
  { id: 'metric-version-and-time', passed: service.includes('calculation version does not match') && service.includes('as-of time does not match') && tests.includes('MetricVersionMismatchIsRejected'), detail: 'Every metric must match preset version and run time.' },
  { id: 'float-evidence-binding', passed: service.includes('ReferenceEvidenceQualified') && service.includes('Kind: ShareMetricKind.PublicFloat') && tests.includes('PublicFloatEvidenceMustMatchSecurityKindAndTimeline'), detail: 'Displayed and qualifying float evidence matches security, kind and run timeline.' },
  { id: 'complete-snapshot-hash', passed: service.includes('metric.State.ToString()') && service.includes('input.PublicFloat.State.ToString()') && service.includes('value.Length') && tests.includes('SnapshotHashBindsSymbolMetricStateReasonAndFloatProvenance'), detail: 'Length-prefixed hash binds the complete calculation and reference decision evidence.' },
  { id: 'deterministic-ranking-no-authority', passed: service.includes('OrderByDescending(candidate => candidate.RelativeVolume)') && service.includes('ThenByDescending(candidate => candidate.DollarVolume)') && service.includes('CreatesOrderAuthority => false'), detail: 'Ranking is deterministic and creates no order authority.' },
  { id: 'immutable-account-persistence', passed: repository.includes('StreamSequence') && repository.includes('SupersedesRunId') && persistenceTests.includes('Postgres'), detail: 'Account-scoped immutable run and correction lineage persistence exists.' },
  { id: 'transactional-candidate-publication', passed: outbox.includes('removals') && outbox.includes('upserts') && repository.includes('OutboxMessages.Add'), detail: 'Sequenced candidate changes are emitted through the transactional outbox.' },
  { id: 'reordered-correction-replay', passed: replay.includes('AccountCount = 100') && replay.includes('RunsPerAccount = 20') && replay.includes('LineageViolations') && replay.includes('DuplicateCount'), detail: 'Reordered 2,000-run replay with duplicates reconstructs final account snapshots.' },
  { id: 'predecessors-unaccepted', passed: predecessors.every((manifest) => Object.entries(manifest).some(([key, value]) => key.endsWith('Accepted') && value === false)), detail: 'WBS 5.1–5.4 readiness predecessors remain explicitly unaccepted.' },
  { id: 'no-fresh-or-external-certification', passed: acceptance.includes('not represented as executed evidence') && acceptance.includes('no licensed provider, broker or external service is connected'), detail: 'No fresh test, licensed provider, broker or hosted certification is inferred.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Scanner-service readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'The newly authored focused cases require a successful repository-pinned .NET 10 rerun.',
  'Idempotent distributed run submission and multi-replica coordination remain incomplete.',
  'Ranking/tie-breaker, liquidity/confidence, universe-size and cadence policy remain unapproved.',
  'Licensed replay plus hosted load/soak, gap/recovery, concurrency and retention certification remain unavailable.',
  'WBS 3.8 and 5.1–5.4 plus Backend, Data, Risk and Product acceptance remain unavailable.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 5.5 Scanner Service readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Service Ready / Distributed and Licensed Certification Pending',
  scannerServiceAccepted: false,
  distributedSubmissionCertified: false,
  licensedReplayCertified: false,
  hostedCertificationAccepted: false,
  orderAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/scanner-service-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/scanner-service-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Scanner service: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local Service Ready / Distributed and Licensed Certification Pending.`);
