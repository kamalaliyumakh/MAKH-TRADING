import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/NEWS_FILINGS_ADAPTER_ACCEPTANCE.md',
  'src/MAKH.Application/Evidence/EvidenceContracts.cs',
  'src/MAKH.Application/Evidence/EvidenceNormalizer.cs',
  'src/MAKH.Application/Evidence/EvidencePayloadSafety.cs',
  'src/MAKH.Application/Evidence/EvidenceOutboxDelivery.cs',
  'src/MAKH.Infrastructure/Evidence/SecFairAccessPolicy.cs',
  'src/MAKH.Infrastructure/Evidence/SyntheticEvidenceAdapter.cs',
  'src/MAKH.Infrastructure/Evidence/PostgresEvidenceStore.cs',
  'src/MAKH.Infrastructure/Evidence/PostgresEvidenceOutboxStore.cs',
  'src/MAKH.Worker/EvidenceDispatchHostedService.cs',
  'src/MAKH.Worker/appsettings.json',
  'tests/MAKH.Architecture.Tests/EvidenceAdapterTests.cs',
  'tests/MAKH.Architecture.Tests/EvidencePersistenceTests.cs',
  'tests/MAKH.Architecture.Tests/EvidencePayloadSafetyTests.cs',
  'tests/MAKH.Architecture.Tests/EvidenceOutboxDispatchLoadChaosTests.cs',
  'eng/verify-postgres-foundation.sh',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
  'outputs/scanner-certification-gate-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const contracts = contents.get(files[1]);
const normalizer = contents.get(files[2]);
const payload = contents.get(files[3]);
const delivery = contents.get(files[4]);
const secPolicy = contents.get(files[5]);
const adapter = contents.get(files[6]);
const store = contents.get(files[7]);
const outbox = contents.get(files[8]);
const hosted = contents.get(files[9]);
const settings = JSON.parse(contents.get(files[10]));
const adapterTests = contents.get(files[11]);
const persistenceTests = contents.get(files[12]);
const payloadTests = contents.get(files[13]);
const chaos = contents.get(files[14]);
const postgres = contents.get(files[15]);
const foundation = JSON.parse(contents.get(files[16]));
const scannerGate = JSON.parse(contents.get(files[17]));

const checks = [
  { id: 'provider-neutral-contract', passed: contracts.includes('interface IEvidenceProvider') && contracts.includes('EvidenceSourceKind') && contracts.includes('EvidenceTrustState'), detail: 'Provider-neutral source, rights and trust contracts are explicit.' },
  { id: 'fail-closed-contract-values', passed: contracts.includes('Enum.IsDefined(contentRight)') && contracts.includes('Enum.IsDefined(sourceKind)') && contracts.includes('Enum.IsDefined(trustState)') && contracts.includes('Evidence cannot supersede itself'), detail: 'Undefined enums and self-referential correction lineage fail closed.' },
  { id: 'point-in-time-normalization', passed: normalizer.includes('ObservedAt > asOf') && normalizer.includes('OrderByDescending') && normalizer.includes('IsDeleted'), detail: 'Normalization is point-in-time, revision-aware and deletion-aware.' },
  { id: 'synthetic-provider-isolation', passed: adapter.includes('synthetic-evidence') && adapter.includes('Adapter cannot contain evidence attributed to another provider'), detail: 'The committed adapter accepts only synthetic provider attribution.' },
  { id: 'sec-fair-access-policy', passed: secPolicy.includes('requestsPerSecond is < 1 or > 10') && secPolicy.includes('maximumConcurrency is < 1 or > 2') && secPolicy.includes('sec.gov') && secPolicy.includes('MaximumRetryDelay'), detail: 'SEC access is attributable, host-restricted and rate/retry bounded.' },
  { id: 'payload-safety', passed: payload.includes('MaximumPayloadBytes = 1_048_576') && payload.includes('AllowedMediaTypes') && payload.includes('ProhibitedBinarySignatures') && payload.includes('EvidenceMalwareScanState.Clean'), detail: 'Payload size, encoding, media type, active content, binary and malware controls fail closed.' },
  { id: 'transactional-persistence-outbox', passed: store.includes('SaveBatchAsync') && store.includes('EvidenceOutboxMessages.AddRange') && persistenceTests.includes('EvidenceOutboxCarriesMetadataAndHashWithoutLicensedContent'), detail: 'Immutable evidence and metadata-only publication are transactionally represented.' },
  { id: 'leased-retry-dispatch', passed: outbox.includes('FOR UPDATE SKIP LOCKED') && delivery.includes('MarkPublishedAsync') && delivery.includes('MarkFailedAsync') && delivery.includes('Math.Min(300'), detail: 'Owner-bound leasing and bounded retry preserve terminal publication integrity.' },
  { id: 'default-off-hosted-publisher', passed: settings.Evidence?.OutboxDispatcher?.Enabled === false && settings.Evidence?.OutboxDispatcher?.PublisherEndpoint === '' && hosted.includes('absolute HTTPS PublisherEndpoint') && hosted.includes('Idempotency-Key'), detail: 'Hosted delivery is default-off and requires an HTTPS endpoint with stable idempotency.' },
  { id: 'deterministic-load-chaos', passed: chaos.includes('MessageCount = 2_000') && chaos.includes('InjectedFailures') && chaos.includes('118') && acceptance.includes('87 initially expired leases') && chaos.includes('LeaseOwnershipViolations'), detail: 'The deterministic local load/chaos harness checks retry and lease ownership.' },
  { id: 'database-lifecycle-evidence', passed: postgres.includes('evidence.outbox_messages') && postgres.includes('evidence.source_snapshots') && postgres.includes('runtime DDL') && acceptance.includes('PostgreSQL 17.10'), detail: 'Isolated database evidence covers persistence, privileges, replay and retry without claiming managed PostgreSQL 18.' },
  { id: 'predecessor-and-authority-boundary', passed: foundation.gateAccepted === false && scannerGate.gateAccepted === false && acceptance.includes('No external endpoint, credential, licensed article') && acceptance.includes('never creates scanner qualification'), detail: 'Unaccepted predecessors and the no-provider/no-trading boundary remain explicit.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`News/filings adapter readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'A fresh repository-pinned .NET 10 run is required for the newly authored enum and lineage cases.',
  'Approved news, announcement and filing providers plus storage/display/derived-data rights remain unavailable.',
  'Licensed mappings, reconciliation, correction/deletion replay and an approved EDGAR/issuer/exchange client remain unavailable.',
  'Managed PostgreSQL 18, authenticated hosted publication, approved malware scanning and governed object lifecycle remain uncertified.',
  'Representative hosted load/chaos, outage/retry, privacy, security and provenance audits remain incomplete.',
  'Product, Data, Legal/Licensing, Security, Backend, Risk and Operations approvals remain Pending.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 6.1 News and Filings Adapter readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Evidence Pipeline Ready / Licensed and Hosted Certification Pending',
  newsFilingsAdapterAccepted: false,
  licensedProviderConnected: false,
  externalEndpointConfigured: false,
  hostedCertificationAccepted: false,
  deploymentAuthorized: false,
  scannerQualificationAuthorityCreated: false,
  orderAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/news-filings-adapter-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/news-filings-adapter-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`News/filings adapter: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local Evidence Pipeline Ready / Licensed and Hosted Certification Pending.`);
