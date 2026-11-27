import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/RECOVERY_READINESS.md',
  'docs/operations/RECOVERY_EXERCISE_RECORD.md',
  'src/MAKH.Application/Recovery/RecoveryExerciseEvaluator.cs',
  'outputs/observability-readiness/readiness-manifest.json',
  'outputs/administration-readiness/readiness-manifest.json',
  'outputs/notification-readiness/readiness-manifest.json',
  'outputs/reporting-readiness/readiness-manifest.json',
  'outputs/operational-readiness/local-evidence-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));
const readiness = contents.get(files[0]);
const record = contents.get(files[1]);
const evaluator = contents.get(files[2]);
const observability = JSON.parse(contents.get(files[3]));
const administration = JSON.parse(contents.get(files[4]));
const notification = JSON.parse(contents.get(files[5]));
const reporting = JSON.parse(contents.get(files[6]));
const operational = JSON.parse(contents.get(files[7]));

const checks = [
  {
    id: 'defined-type-and-positive-targets',
    passed: evaluator.includes('Enum.IsDefined(evidence.Type)')
      && evaluator.includes('ThrowIfLessThanOrEqual(targetRpo, TimeSpan.Zero)')
      && evaluator.includes('ThrowIfLessThanOrEqual(targetRto, TimeSpan.Zero)'),
    detail: 'Undefined exercise types and non-positive recovery targets fail before evaluation.',
  },
  {
    id: 'utc-and-positive-duration',
    passed: evaluator.includes('RequireUtc(evidence.StartedAt')
      && evaluator.includes('RequireUtc(evidence.CompletedAt')
      && evaluator.includes('evidence.CompletedAt <= evidence.StartedAt'),
    detail: 'Exercise chronology requires non-default UTC and positive elapsed duration.',
  },
  {
    id: 'restore-evidence-shape',
    passed: evaluator.includes('restoreExercise')
      && evaluator.includes('Recovery-point evidence is only valid for restore exercises')
      && evaluator.includes('Recovery-point evidence is incomplete'),
    detail: 'Restore exercises require complete recovery-point evidence and non-restore exercises reject it.',
  },
  {
    id: 'entry-lock-isolation-and-source-preservation',
    passed: evaluator.includes('Entry lock was not proven')
      && evaluator.includes('Restore target was not isolated')
      && evaluator.includes('Source preservation was not proven'),
    detail: 'Authorized evidence fails closed without entry lock, isolation and source preservation.',
  },
  {
    id: 'integrity-authorization-and-telemetry',
    passed: evaluator.includes('checksum was not verified')
      && evaluator.includes('Migration history and schema invariants were not verified')
      && evaluator.includes('Authorization controls were not verified')
      && evaluator.includes('Telemetry and alerting were not verified'),
    detail: 'Checksum, schema, authorization and observability evidence are mandatory.',
  },
  {
    id: 'reconciliation-rpo-rto',
    passed: evaluator.includes('reconciliation did not match')
      && evaluator.includes('Measured RTO exceeded the target')
      && evaluator.includes('Measured RPO exceeded the target')
      && evaluator.includes('Last durable transaction is after the requested recovery point'),
    detail: 'Reconciliation and recovery objectives are measured and fail closed.',
  },
  {
    id: 'authorization-gates-execution',
    passed: evaluator.includes('if (!executionAuthorized)')
      && evaluator.includes('RecoveryExerciseOutcome.NotExecuted')
      && evaluator.includes('Exercise execution was not authorized')
      && readiness.includes('cannot be promoted as recovery proof'),
    detail: 'Absent execution authority deterministically produces NotExecuted evidence.',
  },
  {
    id: 'collision-safe-complete-digest',
    passed: evaluator.includes("target.Append(value.Length.ToString(CultureInfo.InvariantCulture)).Append(':').Append(value)")
      && evaluator.includes('targetRpo.Ticks.ToString')
      && evaluator.includes('targetRto.Ticks.ToString')
      && evaluator.includes('executionAuthorized.ToString')
      && evaluator.includes('SHA256.HashData'),
    detail: 'Length-prefixed SHA-256 evidence binds exercise facts, targets and authorization.',
  },
  {
    id: 'record-requires-decision-parameters',
    passed: record.includes('Approved RPO target and policy version')
      && record.includes('Approved RTO target and policy version')
      && record.includes('Execution authorization decision')
      && record.includes('Evaluation evidence digest'),
    detail: 'The exercise record captures the policy and authorization inputs that affect evaluation.',
  },
  {
    id: 'test-evidence-qualified',
    passed: readiness.includes('No new focused cases are claimed')
      && readiness.includes('22 focused evaluator cases, 455 architecture tests and 66 API-security tests')
      && readiness.includes('none freshly executed at this checkpoint'),
    detail: 'Historical executed evidence is explicitly separated from the current static checkpoint.',
  },
  {
    id: 'unavailable-artifacts-declared',
    passed: readiness.includes('Cloud-managed contracts, focused tests, backup/restore runbook and original acceptance files were unavailable')
      && readiness.includes('explicit blockers rather than proof'),
    detail: 'Unavailable recovery artifacts are blockers and are not silently treated as evidence.',
  },
  {
    id: 'predecessors-and-authority-negative',
    passed: observability.observabilityAccepted === false
      && administration.administrationAccepted === false
      && notification.notificationAccepted === false
      && reporting.reportingAccepted === false
      && operational.gateAccepted === false
      && readiness.includes('runs no restore or incident drill')
      && readiness.includes('creates no operational, paper-trading or live-trading authority'),
    detail: 'Predecessors remain unaccepted and no recovery execution or authority is inferred.',
  },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Recovery readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'Cloud-managed recovery contracts, focused tests, backup/restore runbook and original acceptance file require hydration, review and fresh compilation.',
  'An approved isolated target and immutable execution authorization/change record are absent.',
  'PostgreSQL restore/PITR, dependency-failure and incident-response exercises have not run.',
  'Content-addressed logs, manifests, reconciliation proof and measured RPO/RTO evidence do not exist.',
  'Defect remediation, independent retest and repeatability evidence remain pending.',
  'Data, Security, Risk, Operations, Product and Sponsor approvals remain pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 8.6 Recovery Exercise readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Evaluation Integrity Ready / Authorized Recovery Exercise and Accountable Acceptance Pending',
  recoveryAccepted: false,
  exerciseAuthorized: false,
  exerciseExecuted: false,
  rpoMeasured: false,
  rtoMeasured: false,
  entryLockCleared: false,
  operationalAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts: files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') })),
};
await mkdir(path.join(root, 'outputs/recovery-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/recovery-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Recovery readiness: ${checks.length} checks, ${files.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`);
