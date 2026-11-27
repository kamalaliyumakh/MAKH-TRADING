import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/ADMINISTRATION_READINESS.md',
  'src/MAKH.Application/Administration/AdministrationContracts.cs',
  'tests/MAKH.Architecture.Tests/AdministrationServiceTests.cs',
  'outputs/notification-readiness/readiness-manifest.json',
  'outputs/reporting-readiness/readiness-manifest.json',
  'outputs/audit-export-readiness/readiness-manifest.json',
  'outputs/portal-provenance-gate/local-evidence-manifest.json',
  'outputs/operational-readiness/local-evidence-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));
const readiness = contents.get(files[0]);
const contracts = contents.get(files[1]);
const tests = contents.get(files[2]);
const notification = JSON.parse(contents.get(files[3]));
const reporting = JSON.parse(contents.get(files[4]));
const auditExport = JSON.parse(contents.get(files[5]));
const portalGate = JSON.parse(contents.get(files[6]));
const operationalGate = JSON.parse(contents.get(files[7]));

const checks = [
  {
    id: 'defined-resource-and-action',
    passed: contracts.includes('Enum.IsDefined(resource)')
      && contracts.includes('Enum.IsDefined(action)')
      && tests.includes('UndefinedResourceAndActionFailAtCommandBoundary'),
    detail: 'Undefined administrative resources and actions fail at the command boundary.',
  },
  {
    id: 'utc-bounded-elevation',
    passed: contracts.includes('elevatedAt == default || elevatedAt.Offset != TimeSpan.Zero')
      && contracts.includes('elevationExpiresAt > elevatedAt.AddHours(1)')
      && tests.includes('NonUtcElevationFailsAtContextBoundary'),
    detail: 'Elevation evidence is non-default UTC and expires within one hour.',
  },
  {
    id: 'bounded-safe-evidence',
    passed: contracts.includes('normalized.Any(char.IsControl)')
      && contracts.includes("normalized.Contains('@')")
      && contracts.includes('normalized.Contains("token"')
      && tests.includes('ControlCharactersFailAcrossContextAndCommandEvidence')
      && tests.includes('AddressMaterialFailsAcrossContextEvidence'),
    detail: 'Administrative evidence rejects excessive, control, address and credential-like material.',
  },
  {
    id: 'role-resource-authorization-evidence',
    passed: tests.includes('OperationsCannotPublishRiskPolicy')
      && tests.includes('RiskAdministratorCannotChangeProvider')
      && tests.includes('AuditorCannotMutate')
      && tests.includes('UnknownRoleDenied'),
    detail: 'Focused evidence represents deny-by-default role/resource authorization boundaries.',
  },
  {
    id: 'fresh-mfa-and-expiry-evidence',
    passed: tests.includes('StaleMfaDenied')
      && tests.includes('ExpiredElevationDenied')
      && tests.includes('ElevationOverOneHourRejected'),
    detail: 'Fresh MFA, elevation expiry and maximum duration have negative evidence.',
  },
  {
    id: 'optimistic-version-fencing-evidence',
    passed: tests.includes('VersionConflictRejected')
      && tests.includes('ChangedExpectedVersionWithSameCommandIdConflicts')
      && tests.includes('ChangedProposedVersionWithSameCommandIdConflicts'),
    detail: 'Expected and proposed versions are represented in conflict and replay fencing.',
  },
  {
    id: 'actor-bound-full-intent-replay-evidence',
    passed: tests.includes('ExactCommandReplayIsIdempotent')
      && tests.includes('ChangedCommandIdentityConflicts')
      && tests.includes('ChangedSummaryWithSameCommandIdConflicts')
      && tests.includes('DifferentActorCannotReplayPrivilegedCommand'),
    detail: 'Exact replay is idempotent while changed intent or actor identity conflicts.',
  },
  {
    id: 'content-bound-audit-evidence',
    passed: tests.includes('AuditHasBeforeAfterHashesAndReason')
      && contracts.includes('BeforeSha256')
      && contracts.includes('AfterSha256')
      && contracts.includes('CorrelationId'),
    detail: 'Audit results bind actor, reason, correlation and before/after digests.',
  },
  {
    id: 'immutable-false-authority',
    passed: contracts.includes('public bool CreatesTradingAuthority => Sequence < 0;')
      && contracts.includes('public bool ContainsCredentials => Sequence < 0;')
      && tests.includes('ResultHasNoTradingOrCredentialAuthority'),
    detail: 'Normal results expose false trading-authority and credential flags.',
  },
  {
    id: 'test-evidence-qualified',
    passed: readiness.includes('Twenty-five focused administration cases are present')
      && readiness.includes('Four new contract-boundary cases are authored but not claimed as executed')
      && readiness.includes('reliable fresh .NET compilation run is unavailable'),
    detail: 'Authored cases are distinguished from retained executed evidence.',
  },
  {
    id: 'unavailable-artifacts-declared',
    passed: readiness.includes('cloud-managed service, original acceptance and in-memory-store files were unavailable')
      && readiness.includes('explicit blockers rather than silently omitted proof'),
    detail: 'Unavailable cloud-managed artifacts are explicit blockers and are not treated as evidence.',
  },
  {
    id: 'predecessors-and-authority-negative',
    passed: notification.notificationAccepted === false
      && reporting.reportingAccepted === false
      && auditExport.auditExportAccepted === false
      && portalGate.gateAccepted === false
      && operationalGate.gateAccepted === false
      && readiness.includes('no authenticated administrative endpoint')
      && readiness.includes('live-trading authority'),
    detail: 'Predecessors remain unaccepted and the checkpoint creates no administrative or trading authority.',
  },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Administration readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'Cloud-managed administration service, in-memory store and original acceptance file require hydration, review and fresh compilation.',
  'PostgreSQL configuration, access-version, command, audit and outbox persistence with cross-process fencing remain absent.',
  'Authoritative directory, provider, market-calendar and risk-policy sources are not integrated.',
  'Authenticated impact preview, approval, publish, disable and break-glass workflows are not implemented.',
  'Diagnostics, recovery, load, authorization, privacy, accessibility and independent security exercises remain pending.',
  'Accountable Product, Security, Risk, Operations, Data and Accessibility approvals remain pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 8.4 Administration readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Administrative Contract Ready / Durable Workflow and Accountable Acceptance Pending',
  administrationAccepted: false,
  serviceReviewedThisCheckpoint: false,
  postgresPersistenceEnabled: false,
  authenticatedWorkflowEnabled: false,
  externalMutationEnabled: false,
  operationalAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts: files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') })),
};
await mkdir(path.join(root, 'outputs/administration-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/administration-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Administration readiness: ${checks.length} checks, ${files.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`);
