import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/SOCIAL_SIGNAL_ADAPTER_ACCEPTANCE.md',
  'src/MAKH.Application/Evidence/SocialSignalContracts.cs',
  'src/MAKH.Application/Evidence/SocialSignalNormalizer.cs',
  'src/MAKH.Infrastructure/Evidence/SyntheticSocialAttentionAdapter.cs',
  'src/MAKH.Infrastructure/Evidence/PostgresSocialAttentionStore.cs',
  'src/MAKH.Infrastructure/Persistence/Evidence/SocialAttentionAggregateRecord.cs',
  'src/MAKH.Infrastructure/Persistence/Evidence/SocialRetentionDeletionAuditRecord.cs',
  'src/MAKH.Worker/SocialRetentionCleanupHostedService.cs',
  'src/MAKH.Worker/appsettings.json',
  'tests/MAKH.Architecture.Tests/SocialSignalAdapterTests.cs',
  'tests/MAKH.Architecture.Tests/SocialSignalPersistenceTests.cs',
  'tests/MAKH.Architecture.Tests/SocialRetentionCleanupHostedServiceTests.cs',
  'eng/verify-postgres-foundation.sh',
  'outputs/news-filings-adapter-readiness/readiness-manifest.json',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
  'outputs/scanner-certification-gate-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const contracts = contents.get(files[1]);
const normalizer = contents.get(files[2]);
const adapter = contents.get(files[3]);
const store = contents.get(files[4]);
const aggregateRecord = contents.get(files[5]);
const auditRecord = contents.get(files[6]);
const hosted = contents.get(files[7]);
const settings = JSON.parse(contents.get(files[8]));
const adapterTests = contents.get(files[9]);
const persistenceTests = contents.get(files[10]);
const hostedTests = contents.get(files[11]);
const postgres = contents.get(files[12]);
const news = JSON.parse(contents.get(files[13]));
const foundation = JSON.parse(contents.get(files[14]));
const scannerGate = JSON.parse(contents.get(files[15]));

const checks = [
  { id: 'aggregate-only-contract', passed: contracts.includes('mentionCount') && contracts.includes('distinctAuthorEstimate') && !contracts.includes('RawPost') && !contracts.includes('AuthorId'), detail: 'The contract retains aggregate counts rather than raw posts or author identities.' },
  { id: 'low-trust-no-authority', passed: contracts.includes('SocialConfidence.Low or SocialConfidence.Limited') && contracts.includes('CanVerifyCatalyst = false') && contracts.includes('CanAuthorizeTrade = false'), detail: 'Social attention is low-trust context and cannot verify or authorize.' },
  { id: 'fail-closed-classification-lineage', passed: contracts.includes('Enum.IsDefined(manipulationRisk)') && contracts.includes('cannot supersede itself') && adapterTests.includes('SignalRejectsUndefinedConfidenceAndManipulationRisk'), detail: 'Undefined classifications and self-referential lineage fail closed.' },
  { id: 'point-in-time-normalization', passed: normalizer.includes('ObservedAt > asOf') && normalizer.includes('maximumAge') && normalizer.includes('SupersedesAggregateId') && normalizer.includes('IsDeleted'), detail: 'Normalization is point-in-time, fresh, revision-aware and deletion-aware.' },
  { id: 'privacy-policy', passed: contracts.includes('minimumDistinctAuthors is < 2 or > 10_000') && contracts.includes('maximumWindow') && contracts.includes('retentionPeriod') && contracts.includes('MayRetain'), detail: 'Cohort, window and retention bounds suppress disallowed aggregates.' },
  { id: 'synthetic-provider-isolation', passed: adapter.includes('synthetic-social-attention') && adapter.includes('Adapter cannot contain a signal attributed to another provider'), detail: 'The committed adapter accepts only synthetic provider attribution.' },
  { id: 'replay-safe-persistence', passed: aggregateRecord.includes('ContentSha256') && aggregateRecord.includes('cannot be replayed with different content or retention') && persistenceTests.includes('ReplayIsIdempotentAndRejectsChangedSameVersion'), detail: 'Aggregate persistence is hashed, versioned and replay-safe.' },
  { id: 'atomic-retention-audit', passed: store.includes('FOR UPDATE SKIP LOCKED') && store.includes('INSERT INTO audit.social_retention_deletions') && store.includes("'RetentionExpired'") && auditRecord.includes('ContentSha256'), detail: 'Bounded deletion and immutable audit insertion occur atomically.' },
  { id: 'default-off-cleanup', passed: settings.Evidence?.SocialRetentionCleanup?.Enabled === false && hosted.includes('if (!options.Enabled)') && hosted.includes('Enabled social retention cleanup requires ConnectionStrings:Platform'), detail: 'Checked-in retention cleanup is disabled and enabled startup fails closed.' },
  { id: 'backlog-telemetry', passed: hosted.includes('EventId = 3103') && hosted.includes('EventId = 3104') && hosted.includes('EventId = 3105') && hostedTests.includes('OverdueBacklogEmitsStableErrorEventWithoutIdentifiers'), detail: 'Cycle failure, residual backlog and overdue breach have stable events.' },
  { id: 'database-privacy-evidence', passed: postgres.includes('audit.social_retention_deletions') && postgres.includes('SELECT,INSERT') && postgres.includes('UPDATE,DELETE,TRUNCATE') && acceptance.includes('PostgreSQL 17.10'), detail: 'Isolated database evidence proves least-privilege deletion audit without claiming hosted certification.' },
  { id: 'predecessor-and-ingestion-boundary', passed: news.newsFilingsAdapterAccepted === false && foundation.gateAccepted === false && scannerGate.gateAccepted === false && acceptance.includes('Social ingestion and checked-in cleanup remain disabled'), detail: 'Unaccepted predecessors and disabled ingestion remain explicit.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Social-signal adapter readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'A fresh repository-pinned .NET 10 run is required for the newly authored enum and lineage cases.',
  'No permitted commercial social provider or approved collection/display/retention/deletion/cross-border rights exist.',
  'A qualified DPIA/privacy review and approved aggregation, confidence and manipulation methodology remain unavailable.',
  'Approved provider mapping, durable telemetry/paging integration and hosted retention proof remain incomplete.',
  'Licensed replay, adversarial/manipulation, outage/retry, load, privacy and UI-comprehension testing remain incomplete.',
  'Product, Legal/Licensing, Privacy, Security, Data, Risk, Backend, UX and Operations approvals remain Pending.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 6.2 Social-Signal Adapter readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Aggregate-Privacy Ready / Licensed and Hosted Certification Pending',
  socialSignalAdapterAccepted: false,
  ingestionEnabled: false,
  licensedProviderConnected: false,
  dpiaApproved: false,
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

await mkdir(path.join(root, 'outputs/social-signal-adapter-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/social-signal-adapter-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Social-signal adapter: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local Aggregate-Privacy Ready / Licensed and Hosted Certification Pending.`);
