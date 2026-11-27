import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/OBSERVABILITY_ACCEPTANCE.md',
  'docs/operations/OBSERVABILITY_AND_ALERTS.md',
  'src/MAKH.Application/Observability/ObservabilityService.cs',
  'tests/MAKH.Architecture.Tests/ObservabilityServiceTests.cs',
  'outputs/notification-readiness/readiness-manifest.json',
  'outputs/reporting-readiness/readiness-manifest.json',
  'outputs/administration-readiness/readiness-manifest.json',
  'outputs/operational-readiness/local-evidence-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));
const acceptance = contents.get(files[0]);
const baseline = contents.get(files[1]);
const service = contents.get(files[2]);
const tests = contents.get(files[3]);
const notification = JSON.parse(contents.get(files[4]));
const reporting = JSON.parse(contents.get(files[5]));
const administration = JSON.parse(contents.get(files[6]));
const operational = JSON.parse(contents.get(files[7]));

const checks = [
  {
    id: 'slo-window-and-count-integrity',
    passed: service.includes('measurement.TotalEvents < 0')
      && service.includes('measurement.WindowStart == default')
      && service.includes('measurement.WindowStart.Offset != TimeSpan.Zero')
      && service.includes('measurement.WindowEnd - measurement.WindowStart > objective.Window')
      && tests.includes('NonUtcMeasurementAndSignalTimesFailClosed'),
    detail: 'SLO measurements enforce coherent counts and non-default UTC bounded windows.',
  },
  {
    id: 'deterministic-error-budget-states',
    passed: service.includes('ServiceLevelState.Unknown')
      && service.includes('ServiceLevelState.Breached')
      && service.includes('ServiceLevelState.AtRisk')
      && service.includes('ServiceLevelState.Healthy')
      && tests.includes('ExactTargetIsAtRiskAfterBudgetConsumption'),
    detail: 'Achievement and error-budget states are deterministic, including empty evidence.',
  },
  {
    id: 'explicit-route-allowlist',
    passed: service.includes('["api.unavailable"]')
      && service.includes('["broker.unknown"]')
      && service.includes('["risk.failure"]')
      && service.includes('["telemetry.gap"]')
      && service.includes('Unknown signal is not routable and fails closed'),
    detail: 'Only eight explicitly owned signal routes can create alerts.',
  },
  {
    id: 'field-bound-deduplication-key',
    passed: service.includes('$"{environment.Length}:{environment}{service.Length}:{service}{code.Length}:{code}"')
      && service.includes('SHA256.HashData')
      && tests.includes('LengthPrefixedDeduplicationSeparatesFieldBoundaries'),
    detail: 'Length-prefixed canonical fields prevent delimiter-boundary ambiguity.',
  },
  {
    id: 'monotonic-signal-evidence',
    passed: service.includes('signal.ObservedAt < existing.LastObservedAt')
      && service.includes('signal.ObservedAt == existing.LastObservedAt')
      && tests.includes('StaleSignalCannotReplaceNewerEvidence')
      && tests.includes('SameTimeConflictingSignalFailsClosed'),
    detail: 'Stale and conflicting equal-time incident evidence fails closed.',
  },
  {
    id: 'exact-signal-replay',
    passed: service.includes('return existing;')
      && tests.includes('ExactSignalReplayIsIdempotent')
      && tests.includes('Assert.Single(service.Audit())'),
    detail: 'Exact signal replay cannot inflate occurrences or audit history.',
  },
  {
    id: 'immutable-acknowledgement-replay',
    passed: service.includes('Acknowledgement time must be non-default UTC')
      && service.includes('Acknowledgement evidence is immutable after acceptance')
      && tests.includes('ExactAcknowledgementReplayIsIdempotentAndChangedEvidenceConflicts'),
    detail: 'Acknowledgement is UTC, chronological, idempotent on exact replay and immutable on changed intent.',
  },
  {
    id: 'later-evidence-reopens-alert',
    passed: service.includes('State = OperationalAlertState.Open')
      && service.includes('AcknowledgedAt = null')
      && service.includes('AcknowledgementReason = null')
      && tests.includes('NewEvidenceReopensAcknowledgedAlertAndClearsStaleAcknowledgement'),
    detail: 'Later incident evidence reopens the alert and clears obsolete acknowledgement fields.',
  },
  {
    id: 'sensitive-and-control-evidence-defense',
    passed: service.includes("normalized.Contains('@')")
      && service.includes('normalized.Any(char.IsControl)')
      && service.includes('normalized.Contains("token"')
      && tests.includes('AcknowledgementRequiresUtcAndRejectsControlOrAddressMaterial'),
    detail: 'Acknowledgement evidence rejects address, credential-like and control-character material.',
  },
  {
    id: 'audit-correlation-and-false-authority',
    passed: tests.includes('AlertHasCorrelationTraceAndFalseAuthority')
      && acceptance.includes('Correlation and trace references')
      && acceptance.includes('alerts create no trading authority'),
    detail: 'Alert evidence retains correlation/trace references and cannot create trading authority.',
  },
  {
    id: 'test-evidence-qualified',
    passed: acceptance.includes('26 focused')
      && acceptance.includes('Five new integrity cases are authored but are not claimed as freshly executed')
      && acceptance.includes('retained baseline remains 21 focused cases, 450 architecture tests and 66 API-security tests'),
    detail: 'Authored cases and retained executed evidence are explicitly distinguished.',
  },
  {
    id: 'predecessor-and-operational-authority-negative',
    passed: notification.notificationAccepted === false
      && reporting.reportingAccepted === false
      && administration.administrationAccepted === false
      && operational.gateAccepted === false
      && acceptance.includes('sends no page')
      && baseline.includes('Paging routes and thresholds remain provisional'),
    detail: 'Predecessors remain unaccepted and no production paging, monitoring or trading authority exists.',
  },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Observability readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'Cloud-managed observability contracts and infrastructure-store files require hydration, review and fresh compilation.',
  'Approved telemetry backend, durable alert storage, production dashboards and deployed collectors remain absent.',
  'Measured load/soak baselines and accountable thresholds for every SLI are pending.',
  'Named on-call rotations, paging channels, escalation targets and acknowledgement objectives are not approved.',
  'Executable linked runbooks and telemetry/broker/feed/reconciliation/risk incident drills remain pending.',
  'DevOps, Security, Operations and Product Owner approvals remain pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 8.5 Observability readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Alert Integrity Ready / Deployed Telemetry, Incident Exercise and Accountable Acceptance Pending',
  observabilityAccepted: false,
  contractsReviewedThisCheckpoint: false,
  infrastructureStoreReviewedThisCheckpoint: false,
  durableAlertStorageEnabled: false,
  externalPagingEnabled: false,
  productionMonitoringProven: false,
  operationalAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts: files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') })),
};
await mkdir(path.join(root, 'outputs/observability-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/observability-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Observability readiness: ${checks.length} checks, ${files.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`);
