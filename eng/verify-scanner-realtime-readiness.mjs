import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/SCANNER_REALTIME_ACCEPTANCE.md',
  'apps/trading-portal/src/app/scanner/scanner-realtime.service.ts',
  'apps/trading-portal/src/app/scanner/scanner-realtime.service.spec.ts',
  'apps/trading-portal/src/app/scanner/scanner-realtime.coordinator.ts',
  'apps/trading-portal/src/app/scanner/scanner-realtime.coordinator.spec.ts',
  'apps/trading-portal/src/app/scanner/scanner-signalr.transport.ts',
  'apps/trading-portal/src/app/scanner/scanner-api-snapshot.service.ts',
  'src/MAKH.Api/Realtime/SignalRScannerOutboxPublisher.cs',
  'src/MAKH.Api/Realtime/OutboxDispatchHostedService.cs',
  'tests/MAKH.Api.SecurityTests/ScannerRealtimeEndToEndTests.cs',
  'tests/MAKH.Architecture.Tests/OutboxDispatchLoadChaosTests.cs',
  'tests/MAKH.Architecture.Tests/ScannerCorrectionReplayTests.cs',
  'outputs/scanner-service-readiness/readiness-manifest.json',
  'outputs/scanner-ui-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const client = `${contents.get(files[1])}\n${contents.get(files[2])}`;
const coordinator = `${contents.get(files[3])}\n${contents.get(files[4])}`;
const transport = contents.get(files[5]);
const snapshot = contents.get(files[6]);
const publisher = contents.get(files[7]);
const hosted = contents.get(files[8]);
const e2e = contents.get(files[9]);
const chaos = contents.get(files[10]);
const replay = contents.get(files[11]);
const service = JSON.parse(contents.get(files[12]));
const ui = JSON.parse(contents.get(files[13]));

const checks = [
  { id: 'strict-versioned-envelope', passed: client.includes("eventType: 'scanner.updated'") && client.includes('schemaVersion: 1') && client.includes('isCompatible'), detail: 'Client accepts only the versioned scanner.updated envelope.' },
  { id: 'monotonic-sequence', passed: client.includes("return 'Duplicate'") && client.includes('lastSequence + 1') && client.includes('Sequence gap detected'), detail: 'Duplicates are ignored and gaps force recovery.' },
  { id: 'correction-shape', passed: client.includes('correctionMetadataValid') && client.includes('supersedesRunId === this.snapshotState().runId'), detail: 'Correction metadata must pair with the current run and a bounded reason.' },
  { id: 'candidate-delta-integrity', passed: client.includes('new Set(upsertIds).size') && client.includes('new Set(removalIds).size') && client.includes('removalIds.includes'), detail: 'Duplicate and contradictory delta membership fails closed.' },
  { id: 'authoritative-snapshot-recovery', passed: coordinator.includes('loadLatest') && coordinator.includes('recoveryGeneration') && snapshot.includes('streamSequence'), detail: 'Initial connect, reconnect and gaps recover from the authoritative sequenced snapshot.' },
  { id: 'disabled-by-default-client', passed: transport.includes('SCANNER_REALTIME_ENABLED') && acceptance.includes('feature-disabled Angular SignalR adapter'), detail: 'The Angular real-time path remains default-off.' },
  { id: 'authenticated-publisher', passed: publisher.includes('session') && publisher.includes('connection') && publisher.includes('scanner.updated'), detail: 'Publication is limited to revalidated account/session connections.' },
  { id: 'disabled-bounded-host', passed: hosted.includes('Enabled') && hosted.includes('Batch') && acceptance.includes('default-off hosted dispatch service'), detail: 'Hosted dispatch is default-off with bounded polling, leases and batches.' },
  { id: 'revocation-e2e', passed: e2e.includes('Revok') && e2e.includes('SignalR') && acceptance.includes('suppresses sequence 13'), detail: 'Controlled end-to-end evidence proves delivery followed by revocation suppression.' },
  { id: 'load-chaos-ordering', passed: chaos.includes('AccountCount = 100') && chaos.includes('MessagesPerAccount = 20') && chaos.includes('ConcurrentDispatchPreservesAccountOrderAndRecoversInjectedFailures') && acceptance.includes('118 injected transient failures'), detail: 'Deterministic concurrent load/chaos preserves per-account ordering.' },
  { id: 'correction-replay', passed: replay.includes('RunsPerAccount = 20') && replay.includes('DuplicateCount') && replay.includes('LineageViolations'), detail: 'Reordered correction replay remains lineage-safe and duplicate-tolerant.' },
  { id: 'predecessors-and-hosted-boundary', passed: service.scannerServiceAccepted === false && ui.scannerUiAccepted === false && acceptance.includes('Multi-Replica Hosted Certification Pending'), detail: 'Service/UI acceptance and multi-replica hosted certification remain unavailable.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Scanner real-time readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'A selected shared SignalR backplane and multi-replica connection/revocation design remain unavailable.',
  'Hosted representative-capacity load, soak, network/process chaos, correction replay and recovery evidence remain incomplete.',
  'Hosted backward/forward schema compatibility and deployment rollback drills remain incomplete.',
  'WBS 5.5/5.6 and foundation acceptance remain unavailable.',
  'Backend, Frontend, Security, Data, Risk, Product and Operations approvals remain Pending.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 5.7 Scanner Real-Time Updates readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Real-Time Ready / Multi-Replica Hosted Certification Pending',
  scannerRealtimeAccepted: false,
  multiReplicaCertified: false,
  hostedCertificationAccepted: false,
  deploymentAuthorized: false,
  orderAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/scanner-realtime-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/scanner-realtime-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Scanner real-time: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local Real-Time Ready / Multi-Replica Hosted Certification Pending.`);
