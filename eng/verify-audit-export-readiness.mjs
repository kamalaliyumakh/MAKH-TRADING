import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/AUDIT_EXPORT_ACCEPTANCE.md',
  'src/MAKH.Application/Exports/AuditExportContracts.cs',
  'src/MAKH.Application/Exports/AuditExportService.cs',
  'tests/MAKH.Architecture.Tests/AuditExportServiceTests.cs',
  'outputs/notification-readiness/readiness-manifest.json',
  'outputs/reporting-readiness/readiness-manifest.json',
  'outputs/portal-provenance-gate/local-evidence-manifest.json',
  'outputs/operational-readiness/local-evidence-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));
const acceptance = contents.get(files[0]);
const contracts = contents.get(files[1]);
const service = contents.get(files[2]);
const tests = contents.get(files[3]);
const notification = JSON.parse(contents.get(files[4]));
const reporting = JSON.parse(contents.get(files[5]));
const portalGate = JSON.parse(contents.get(files[6]));
const operationalGate = JSON.parse(contents.get(files[7]));

const checks = [
  {
    id: 'account-actor-role-authorization',
    passed: service.includes('authorization.CanExport(request.ActorUserId, request.AccountId, request.ActorRole)')
      && tests.includes('RejectsUnauthorizedActor')
      && contracts.includes('ActorRole'),
    detail: 'Export generation is bound to account, actor and screened role authorization.',
  },
  {
    id: 'utc-validity-window',
    passed: contracts.includes('requestedAt.Offset != TimeSpan.Zero')
      && contracts.includes('expiresAt.Offset != TimeSpan.Zero')
      && service.includes('generatedAt.Offset != TimeSpan.Zero')
      && tests.includes('RejectsNonUtcTimes'),
    detail: 'Request, expiry, occurrence and generation evidence requires non-default UTC.',
  },
  {
    id: 'bounded-source-and-formats',
    passed: service.includes('MaximumInputRows = 100_000')
      && service.includes('MaximumStructuredExportRows = 50_000')
      && service.includes('MaximumPdfRows = 500')
      && tests.includes('RejectsPdfBeyondBoundedRecordLimit'),
    detail: 'Input enumeration and format-specific record counts are deterministically bounded.',
  },
  {
    id: 'content-size-boundary',
    passed: service.includes('MaximumContentBytes = 25 * 1024 * 1024')
      && service.includes('Export content exceeds the 25 MiB in-memory safety limit'),
    detail: 'Generated in-memory content cannot exceed 25 MiB.',
  },
  {
    id: 'scope-identity-and-chronology',
    passed: service.includes('row.AccountId == request.AccountId')
      && service.includes('Evidence event identities must be unique within an export')
      && service.includes('row.OccurredAt > generatedAt')
      && tests.includes('RejectsFutureEvidence'),
    detail: 'Rows are account-scoped, unique, ordered and cannot postdate generation.',
  },
  {
    id: 'sensitive-and-control-character-defense',
    passed: contracts.includes('normalized.Contains("token"')
      && contracts.includes('normalized.Contains("secret"')
      && contracts.includes('normalized.Any(char.IsControl)')
      && tests.includes('RejectsControlCharactersAcrossExportedTextFields'),
    detail: 'Addresses, credential-like material, excessive values and record-forging controls fail closed.',
  },
  {
    id: 'csv-formula-injection-defense',
    passed: service.includes('"=+-@".Contains(value[0]')
      && service.includes('safe.Replace("\\\"", "\\\"\\\""')
      && tests.includes('CsvHasHeaderAndEscapesFormulaInjection'),
    detail: 'CSV formula prefixes and quote delimiters are neutralized.',
  },
  {
    id: 'minimal-json-and-labeled-pdf',
    passed: tests.includes('JsonUsesCamelCaseAndOmitsAccountIdentity')
      && service.includes('Synthetic export - not a broker statement')
      && tests.includes('PdfHasValidEnvelopeAndSafetyLabel'),
    detail: 'JSON minimizes scope data and PDF output carries an explicit non-statement label.',
  },
  {
    id: 'content-bound-manifest',
    passed: service.includes('SHA256.HashData(content)')
      && service.includes('request.ActorRole')
      && tests.includes('ManifestChecksumMatchesContent')
      && tests.includes('ManifestBindsActorRole'),
    detail: 'The manifest binds content digest, actor role, scope, format, count and validity evidence.',
  },
  {
    id: 'format-and-authority-boundary',
    passed: contracts.includes('!Enum.IsDefined(format)')
      && service.includes('CreatesTradingAuthority: false')
      && tests.includes('ManifestCarriesFalseAuthorityAndNoCredentials'),
    detail: 'Undefined formats fail early and exports cannot contain credentials or create trading authority.',
  },
  {
    id: 'test-evidence-qualified',
    passed: acceptance.includes('25 focused')
      && acceptance.includes('four new focused cases are authored but not claimed as executed')
      && acceptance.includes('442 architecture tests and 66 API-security tests'),
    detail: 'Authored cases and retained executed evidence are explicitly distinguished.',
  },
  {
    id: 'predecessor-and-publication-negative',
    passed: notification.notificationAccepted === false
      && reporting.reportingAccepted === false
      && portalGate.gateAccepted === false
      && operationalGate.gateAccepted === false
      && acceptance.includes('No file is published or uploaded')
      && acceptance.includes('no export grants trading or broker authority'),
    detail: 'Predecessors remain unaccepted and no external download, broker or trading authority exists.',
  },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Audit-export readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'PostgreSQL job, manifest, immutable authorization-event and audit persistence remain absent.',
  'Encrypted object storage, one-time signed download, revocation, lifecycle deletion and legal hold are not integrated.',
  'Authenticated rate-limited APIs and an accessible Angular job/download workflow remain unavailable.',
  'Production PDF pagination, fonts, branding, accessibility and document-integrity validation remain incomplete.',
  'Malware/content scanning, large-export streaming, load, failure and recovery exercises are pending.',
  'Fresh .NET execution and accountable Privacy, Security, Legal/Records, Product and Operations approvals remain pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 8.3 Audit Export readiness',
  localControls: 'PASS',
  readinessDecision: 'Local In-Memory Export Integrity Ready / Durable Secure Delivery and Accountable Acceptance Pending',
  auditExportAccepted: false,
  postgresPersistenceEnabled: false,
  objectStorageEnabled: false,
  signedDownloadEnabled: false,
  externalPublicationEnabled: false,
  officialStatementCreated: false,
  brokerAuthorityCreated: false,
  operationalAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts: files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') })),
};
await mkdir(path.join(root, 'outputs/audit-export-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/audit-export-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Audit-export readiness: ${checks.length} checks, ${files.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`);
