import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/REPORTING_ACCEPTANCE.md',
  'src/MAKH.Application/Reporting/ReportingService.cs',
  'apps/trading-portal/src/app/reports/reports.service.ts',
  'apps/trading-portal/src/app/reports/reports-page.ts',
  'apps/trading-portal/src/app/reports/reports-page.scss',
  'outputs/notification-readiness/readiness-manifest.json',
  'outputs/portal-provenance-gate/local-evidence-manifest.json',
  'outputs/operational-readiness/local-evidence-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));
const acceptance = contents.get(files[0]);
const backend = contents.get(files[1]);
const client = contents.get(files[2]);
const page = contents.get(files[3]);
const styles = contents.get(files[4]);
const notification = JSON.parse(contents.get(files[5]));
const portalGate = JSON.parse(contents.get(files[6]));
const operationalGate = JSON.parse(contents.get(files[7]));

const checks = [
  {
    id: 'account-date-timezone-scope',
    passed: backend.includes('item.AccountId == accountId')
      && backend.includes('LocalDate(item.ExecutedAt, tradingTimeZone) == tradingDate')
      && backend.includes('tradingTimeZone.Id'),
    detail: 'Execution and adherence facts remain account, local-date and timezone scoped.',
  },
  {
    id: 'bounded-input-work',
    passed: backend.includes('MaximumInputFactsPerCategory = 100_000')
      && backend.includes('source.Take(MaximumInputFactsPerCategory + 1)')
      && backend.includes('exceeds the {MaximumInputFactsPerCategory:N0}-fact limit'),
    detail: 'Each input category has a deterministic ceiling before report computation.',
  },
  {
    id: 'utc-generation-chronology',
    passed: backend.includes('generatedAt.Offset != TimeSpan.Zero')
      && backend.includes('Report cannot be generated before its trading date')
      && backend.includes('A report cannot contain facts observed after generation time'),
    detail: 'Generation requires UTC and cannot precede the report date or any included fact.',
  },
  {
    id: 'unique-fact-identities',
    passed: backend.includes('Execution identities must be unique within a report')
      && backend.includes('Decision identities must be unique within a report')
      && backend.includes('Each data source must have one daily quality fact'),
    detail: 'Duplicate execution, decision and daily-source identities fail closed.',
  },
  {
    id: 'deterministic-aggregation',
    passed: backend.includes('OrderBy(group => group.Key, StringComparer.Ordinal)')
      && backend.includes('group.Sum(item => item.RealizedPnl)')
      && backend.includes('AdherenceReportLine'),
    detail: 'Strategy and adherence summaries use deterministic ordering and explicit totals.',
  },
  {
    id: 'fail-closed-data-quality',
    passed: backend.includes('qualityLines.Length == 0')
      && backend.includes('item.Quality == ReportQuality.Failed')
      && backend.includes('ReportQuality.Partial'),
    detail: 'Missing, failed or partial source quality cannot appear complete.',
  },
  {
    id: 'complete-canonical-evidence',
    passed: backend.includes('SHA256.HashData')
      && backend.includes("builder.Append(field.Length.ToString")
      && backend.includes('item.ExecutedAt.ToUniversalTime()')
      && backend.includes('item.AcceptedRecords.ToString'),
    detail: 'Length-prefixed SHA-256 evidence binds complete ordered report inputs.',
  },
  {
    id: 'explicit-ui-non-authority',
    passed: client.includes("readonly dataMode: 'synthetic'")
      && client.includes('readonly isAuthoritative: false')
      && client.includes('readonly isBrokerStatement: false')
      && client.includes('readonly canSubmitOrder: false'),
    detail: 'The Angular snapshot explicitly denies authority, broker-statement and order semantics.',
  },
  {
    id: 'full-ui-evidence-digest',
    passed: /evidenceHash: '[0-9a-f]{64}'/.test(client),
    detail: 'The UI fixture carries a complete synthetic SHA-256 digest rather than a decorative truncation.',
  },
  {
    id: 'finite-visual-calculations',
    passed: page.includes('this.adherenceTotal() === 0 ? 0')
      && page.includes("values.some((value) => !Number.isFinite(value))")
      && page.includes('span === 0 ? 65')
      && page.includes('Number.isFinite(value) ?'),
    detail: 'Empty, flat, single-point and invalid series cannot create NaN or infinite chart geometry.',
  },
  {
    id: 'responsive-read-only-presentation',
    passed: styles.includes('@media') && styles.includes('overflow-x: auto')
      && acceptance.includes('responsive read-only Angular analytics workspace'),
    detail: 'The retained portal surface is responsive and presented as read-only analytics.',
  },
  {
    id: 'predecessor-and-authority-boundary',
    passed: notification.notificationAccepted === false
      && portalGate.gateAccepted === false
      && operationalGate.gateAccepted === false
      && acceptance.includes('They do not read a broker, database or provider')
      && acceptance.includes('or create live-trading authority'),
    detail: 'Adjacent gates remain unaccepted and reporting creates no external or trading authority.',
  },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Reporting readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'PostgreSQL read models, immutable versions, migrations, retention and point-in-time replay remain absent.',
  'Authoritative order, execution, position, risk, scanner, evidence and journal adapters are not integrated.',
  'Authenticated report APIs, governed filtering/drill-down and scheduled late/correction processing remain unavailable.',
  'Broker-statement reconciliation plus approved accounting, fee, timezone and correction definitions remain pending.',
  'Hosted authorization, privacy, load, accessibility, recovery and representative-user evidence is incomplete.',
  'Fresh backend execution and accountable Product, Finance, Risk, Data, Security and Operations approvals remain pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 8.2 Reporting readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Synthetic Reporting Ready / Authoritative Persistence and Accountable Acceptance Pending',
  reportingAccepted: false,
  postgresReadModelEnabled: false,
  authoritativeAdaptersEnabled: false,
  authenticatedApiEnabled: false,
  officialStatementCreated: false,
  exportAuthorized: false,
  operationalAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts: files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') })),
};
await mkdir(path.join(root, 'outputs/reporting-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/reporting-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Reporting readiness: ${checks.length} checks, ${files.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`);
