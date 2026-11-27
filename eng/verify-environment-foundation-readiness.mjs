import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/ENVIRONMENT_FOUNDATION_ACCEPTANCE.md',
  'docs/operations/ENVIRONMENT_BASELINE.md',
  'docs/operations/OBSERVABILITY_AND_ALERTS.md',
  'docs/operations/BACKUP_RESTORE_RUNBOOK.md',
  'deploy/azure/main.bicep',
  'deploy/environments/dev.json',
  'deploy/environments/test.json',
  'deploy/environments/staging.json',
  'eng/verify-environment-foundation.mjs',
  'outputs/devsecops-foundation-readiness/current-readiness-manifest.json',
];

const contents = new Map();
for (const file of files) {
  contents.set(file, readFileSync(path.join(root, file), 'utf8'));
}

const acceptance = contents.get(files[0]);
const baseline = contents.get(files[1]);
const alerts = contents.get(files[2]);
const recovery = contents.get(files[3]);
const bicep = contents.get(files[4]);
const manifests = files.slice(5, 8).map((file) => JSON.parse(contents.get(file)));
const validator = contents.get(files[8]);
const predecessor = JSON.parse(contents.get(files[9]));
const acceptanceRows = acceptance.match(/^\| (?!Criterion)[^|]+\|[^\n]+\|$/gm) ?? [];

const checks = [
  {
    id: 'thirteen-acceptance-controls',
    passed: acceptanceRows.length === 13,
    detail: 'The acceptance matrix contains exactly thirteen environment controls.',
  },
  {
    id: 'three-isolated-environments',
    passed:
      manifests.map((item) => item.name).join(',') === 'dev,test,staging' &&
      manifests.every((item) => item.dataClass === 'synthetic-only' && item.entryLocked === true),
    detail: 'Dev, test and staging are synthetic-only and start entry-locked.',
  },
  {
    id: 'database-and-recovery-policy',
    passed: manifests.every(
      (item) =>
        item.database.version === '18' &&
        item.database.pointInTimeRestore === true &&
        item.database.rpoMinutes === 5 &&
        item.database.rtoMinutes === 60,
    ),
    detail: 'PostgreSQL 18, PITR and planning RPO/RTO controls are explicit.',
  },
  {
    id: 'least-privilege-runtime-boundary',
    passed: manifests.every(
      (item) =>
        item.database.ownerRole === 'makh_owner' &&
        item.database.migrationRole === 'makh_migrator' &&
        item.database.runtimeRole === 'makh_runtime' &&
        item.database.runtimeDdlAllowed === false,
    ),
    detail: 'Owner, migrator and runtime roles are separated and runtime DDL is denied.',
  },
  {
    id: 'identity-and-trading-locks',
    passed:
      manifests.every(
        (item) =>
          item.identity.providerConfigured === false &&
          item.identity.recoveryExerciseRequired === true &&
          item.trading.paperConnectivityAllowed === false &&
          item.trading.liveConnectivityAllowed === false &&
          item.trading.brokerCredentialsAllowed === false,
      ) &&
      manifests.slice(1).every(
        (item) =>
          item.identity.sharedKeyRingRequired === true &&
          item.identity.certificateProtectionRequired === true,
      ),
    detail: 'Provider, broker and trading connections stay disabled; shared keys are required outside dev.',
  },
  {
    id: 'private-azure-candidate',
    passed:
      bicep.includes("@allowed(['dev', 'test', 'staging'])") &&
      bicep.includes("publicNetworkAccess: 'Disabled'") &&
      bicep.includes('enableRbacAuthorization: true') &&
      bicep.includes("version: '18'") &&
      bicep.includes("'live-authorized': 'false'"),
    detail: 'The candidate topology is private, RBAC-based, lower-environment-only and live-disabled.',
  },
  {
    id: 'telemetry-and-correlation-baseline',
    passed:
      baseline.includes('OpenTelemetry 1.17') &&
      baseline.includes('OTEL_EXPORTER_OTLP_ENDPOINT') &&
      baseline.includes('X-Correlation-ID') &&
      alerts.includes('Required alerts'),
    detail: 'OpenTelemetry, bounded correlation and required alert definitions are documented.',
  },
  {
    id: 'recovery-runbook',
    passed:
      recovery.includes('Restore to a new isolated server') &&
      recovery.includes('Measure last durable transaction (RPO)') &&
      recovery.includes('service readiness time (RTO)') &&
      recovery.includes('Keep entries locked'),
    detail: 'The recovery path is isolated, measurable, reconciled and entry-locked.',
  },
  {
    id: 'executable-policy-validator',
    passed:
      validator.includes("const expected = ['dev', 'test', 'staging']") &&
      validator.includes('synthetic-only') &&
      validator.includes('runtimeDdlAllowed') &&
      validator.includes('brokerCredentialsAllowed'),
    detail: 'The existing validator enforces the environment safety contract.',
  },
  {
    id: 'hosted-proof-and-approvals-pending',
    passed:
      predecessor.devSecOpsFoundationAccepted === false &&
      acceptance.includes('Infrastructure compiler/hosted deployment evidence') &&
      acceptance.includes('DevOps, Security, Data and Operations signatures'),
    detail: 'The DevSecOps predecessor, hosted evidence and accountable approvals remain unavailable.',
  },
  {
    id: 'current-devsecops-predecessor',
    passed:
      predecessor.schemaVersion === 3 &&
      predecessor.devSecOpsFoundationAccepted === false &&
      predecessor.deploymentAuthorized === false,
    detail: 'The current schema-v3 DevSecOps predecessor remains unaccepted and deployment-disabled.',
  },
  {
    id: 'environment-contract-inventory',
    passed: manifests.length === 3 && manifests.every((item) => item.entryLocked === true),
    detail: 'Exactly three lower-environment contracts remain entry-locked.',
  },
  {
    id: 'production-boundary',
    passed:
      !manifests.some((item) => item.name === 'production') &&
      bicep.includes("@allowed(['dev', 'test', 'staging'])"),
    detail: 'No production environment is represented or permitted by the candidate template.',
  },
  {
    id: 'observability-safety-boundary',
    passed:
      baseline.includes('X-Correlation-ID') &&
      alerts.includes('Required alerts') &&
      manifests.every((item) => item.dataClass === 'synthetic-only'),
    detail: 'Correlation and alert contracts operate only against synthetic lower-environment data.',
  },
  {
    id: 'recovery-authority-boundary',
    passed:
      recovery.includes('Keep entries locked') &&
      recovery.includes('Restore to a new isolated server'),
    detail: 'Recovery remains isolated and cannot unlock entries or create trading authority.',
  },
  {
    id: 'accountable-acceptance-boundary',
    passed:
      acceptance.includes('DevOps, Security, Data and Operations signatures') &&
      acceptance.includes('WBS 3.7 remains in progress'),
    detail: 'Named accountable acceptance remains pending and separate from local evidence.',
  },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) {
  throw new Error(`Environment readiness checks failed: ${failed.map((check) => check.id).join(', ')}`);
}

const blockers = [
  { id: 'EFB-01', severity: 'Critical', status: 'Open', detail: 'WBS 3.6 DevSecOps acceptance and wider foundation predecessors remain unavailable.' },
  { id: 'EFB-02', severity: 'Critical', status: 'Open', detail: 'ADR-0005, jurisdiction, region and hosting selection remain pending.' },
  { id: 'EFB-03', severity: 'Critical', status: 'Open', detail: 'Subscription, network, capacity and cost approvals remain pending.' },
  { id: 'EFB-04', severity: 'Critical', status: 'Open', detail: 'Approved-toolchain Bicep compilation and lint evidence remain pending.' },
  { id: 'EFB-05', severity: 'Critical', status: 'Open', detail: 'Non-production what-if and isolated deployment evidence remain pending.' },
  { id: 'EFB-06', severity: 'Critical', status: 'Open', detail: 'Private connectivity and Key Vault access evidence remain pending.' },
  { id: 'EFB-07', severity: 'Critical', status: 'Open', detail: 'Deployed telemetry, alert delivery and named on-call evidence remain pending.' },
  { id: 'EFB-08', severity: 'Critical', status: 'Open', detail: 'Backup/PITR and timed recovery evidence remain pending.' },
  { id: 'EFB-09', severity: 'Critical', status: 'Open', detail: 'DevOps and Security approvals remain unavailable.' },
  { id: 'EFB-10', severity: 'Critical', status: 'Open', detail: 'Data and Operations approvals remain unavailable.' },
];
const artifacts = files.map((file) => ({
  path: file,
  sha256: createHash('sha256').update(contents.get(file)).digest('hex'),
}));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 3.7 environment foundation readiness',
  readinessDecision: 'Implementation Ready / Acceptance Pending',
  environmentFoundationAccepted: false,
  infrastructureCompiled: false,
  environmentProvisioned: false,
  recoveryTargetsProven: false,
  productionEnvironmentCreated: false,
  deploymentAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  hostedInfrastructureCertified: false,
  privateConnectivityCertified: false,
  telemetryDeliveryCertified: false,
  devOpsLeadApprovalRecorded: false,
  securityLeadApprovalRecorded: false,
  dataLeadApprovalRecorded: false,
  operationsLeadApprovalRecorded: false,
  inventory: {
    acceptanceControls: acceptanceRows.length,
    environments: manifests.length,
    checks: checks.length,
    blockers: blockers.length,
    artifacts: artifacts.length,
  },
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/environment-foundation-readiness'), { recursive: true });
await writeFile(
  path.join(root, 'outputs/environment-foundation-readiness/readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
await writeFile(
  path.join(root, 'outputs/environment-foundation-readiness/current-readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(
  `Environment readiness: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers.`,
);
