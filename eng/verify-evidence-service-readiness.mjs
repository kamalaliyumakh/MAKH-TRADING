import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/EVIDENCE_SERVICE_ACCEPTANCE.md',
  'src/MAKH.Application/Evidence/EvidenceService.cs',
  'src/MAKH.Application/Evidence/EvidenceContracts.cs',
  'src/MAKH.Application/Evidence/SocialSignalContracts.cs',
  'src/MAKH.Application/Evidence/EvidenceNormalizer.cs',
  'src/MAKH.Application/Evidence/SocialSignalNormalizer.cs',
  'src/MAKH.Infrastructure/Evidence/PostgresEvidenceSnapshotStore.cs',
  'src/MAKH.Infrastructure/Persistence/Evidence/EvidenceSnapshotRecord.cs',
  'tests/MAKH.Architecture.Tests/EvidenceServiceTests.cs',
  'tests/MAKH.Architecture.Tests/EvidencePersistenceTests.cs',
  'eng/verify-postgres-foundation.sh',
  'outputs/news-filings-adapter-readiness/readiness-manifest.json',
  'outputs/social-signal-adapter-readiness/readiness-manifest.json',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
  'outputs/scanner-certification-gate-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const service = contents.get(files[1]);
const evidenceContracts = contents.get(files[2]);
const socialContracts = contents.get(files[3]);
const evidenceNormalizer = contents.get(files[4]);
const socialNormalizer = contents.get(files[5]);
const store = contents.get(files[6]);
const record = contents.get(files[7]);
const serviceTests = contents.get(files[8]);
const persistenceTests = contents.get(files[9]);
const postgres = contents.get(files[10]);
const news = JSON.parse(contents.get(files[11]));
const social = JSON.parse(contents.get(files[12]));
const foundation = JSON.parse(contents.get(files[13]));
const scannerGate = JSON.parse(contents.get(files[14]));

const checks = [
  { id: 'effective-entity-matching', passed: service.includes('IsEffectiveAt') && service.includes('ExactVenueSymbol') && service.includes('Entity match is ambiguous and must fail closed'), detail: 'Entity matching is effective-dated, exact and fail closed on ambiguity.' },
  { id: 'canonical-alias-inputs', passed: service.includes('Venue MIC must contain exactly four ASCII letters or digits') && service.includes('Required(symbol, nameof(symbol), 32)') && serviceTests.includes('AliasRejectsUnsafeOrOversizedSymbols'), detail: 'Venue and symbol aliases are canonical, bounded and control-free.' },
  { id: 'point-in-time-inputs', passed: evidenceNormalizer.includes('ObservedAt > asOf') && socialNormalizer.includes('ObservedAt > asOf') && socialNormalizer.includes('maximumAge'), detail: 'Document and social inputs obey point-in-time and freshness boundaries.' },
  { id: 'trust-and-authority-separation', passed: service.includes('EvidenceTrustClass.Primary') && service.includes('EvidenceTrustClass.LowTrust') && service.includes('false), canonicalContent') && socialContracts.includes('CanVerifyCatalyst = false'), detail: 'Trust class never creates catalyst verification or trading authority.' },
  { id: 'collision-safe-deduplication', passed: service.includes('EvidenceCollisionGuard.EnsureNoCollision') && service.includes('Distinct(StringComparer.Ordinal)') && serviceTests.includes('CollisionGuardRejectsSameFingerprintForDifferentCanonicalContent'), detail: 'Cross-provider deduplication counts distinct providers and detects fingerprint collisions.' },
  { id: 'deterministic-manifest', passed: service.includes('SnapshotSchemaVersion') && service.includes('ComputeManifestHash') && serviceTests.includes('ReorderedInputsProduceTheSameSnapshotHash'), detail: 'Versioned snapshot manifests are stable across replay order.' },
  { id: 'bounded-snapshot-work', passed: service.includes('MaximumSnapshotItems = 10_000') && service.includes('candidates.Length > MaximumSnapshotItems') && serviceTests.includes('SnapshotRejectsInputAboveMaximumSize'), detail: 'Snapshot aggregation fails closed above 10,000 inputs.' },
  { id: 'atomic-conflict-safe-persistence', passed: store.includes('ON CONFLICT (as_of) DO NOTHING') && store.includes('winning manifest') && store.includes('different manifest'), detail: 'Concurrent same-time persistence converges or rejects conflicting evidence.' },
  { id: 'immutable-persistence-shape', passed: record.includes('ManifestSha256') && record.includes('ItemsJson') && persistenceTests.includes('EfModelMapsReplaySafeCombinedSnapshots'), detail: 'PostgreSQL stores the exact ordered immutable snapshot and canonical manifest.' },
  { id: 'database-concurrency-evidence', passed: postgres.includes('combined_snapshots') && postgres.includes('snapshot-worker-') && postgres.includes('concurrent_snapshot_count') && acceptance.includes('eight simultaneous same-time snapshot writers'), detail: 'Isolated PostgreSQL evidence covers concurrent convergence without claiming hosted certification.' },
  { id: 'predecessor-readiness-negative', passed: news.newsFilingsAdapterAccepted === false && social.socialSignalAdapterAccepted === false && foundation.gateAccepted === false && scannerGate.gateAccepted === false, detail: 'News, social, foundation and scanner predecessors remain explicitly unaccepted.' },
  { id: 'external-and-trading-boundary', passed: acceptance.includes('All inputs remain synthetic') && acceptance.includes('no provider, protected archive, external content, credential, API endpoint, or broker is connected') && acceptance.includes('does not qualify a scanner candidate'), detail: 'No external integration or downstream trading authority is inferred.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Evidence-service readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'A fresh repository-pinned .NET 10 run is required for the newly authored alias and snapshot-bound cases.',
  'Provider-specific entity mappings, symbol/corporate-action behavior, trust policy and catalyst rules remain unapproved.',
  'Licensed evidence sources, protected-object references, access/audit controls and complete evidence-item associations remain incomplete.',
  'Outbox, deletion/tombstone propagation and licensed-content transaction boundaries remain uncertified.',
  'Licensed replay, correction, hosted load/recovery, retention/deletion and UI-comprehension testing remain incomplete.',
  'Data, Product, Risk, Legal/Licensing, Privacy, Security, Backend, QA, UX and Operations approvals remain Pending.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 6.3 Evidence Service readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Evidence Aggregation Ready / Licensed and Hosted Certification Pending',
  evidenceServiceAccepted: false,
  licensedSourcesConnected: false,
  protectedArchiveConnected: false,
  hostedCertificationAccepted: false,
  deploymentAuthorized: false,
  catalystVerificationAuthorityCreated: false,
  scannerQualificationAuthorityCreated: false,
  orderAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/evidence-service-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/evidence-service-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Evidence service: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local Evidence Aggregation Ready / Licensed and Hosted Certification Pending.`);
