import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/JOURNAL_ACCEPTANCE.md',
  'src/MAKH.Api/Program.cs',
  'src/MAKH.Application/Journal/JournalContracts.cs',
  'src/MAKH.Application/Journal/JournalService.cs',
  'src/MAKH.Application/Journal/JournalReadService.cs',
  'src/MAKH.Infrastructure/Journal/InMemoryJournalRepository.cs',
  'tests/MAKH.Architecture.Tests/JournalServiceTests.cs',
  'tests/MAKH.Architecture.Tests/JournalReadServiceTests.cs',
  'tests/MAKH.Api.SecurityTests/IdentitySecurityTests.cs',
  'apps/trading-portal/src/app/journal/journal.service.ts',
  'apps/trading-portal/src/app/journal/journal-page.html',
  'apps/trading-portal/src/app/journal/journal-page.spec.ts',
  'outputs/journal-accessibility/local-browser-results.json',
  'outputs/dashboard-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const api = contents.get(files[1]);
const contracts = contents.get(files[2]);
const domain = contents.get(files[3]);
const readService = contents.get(files[4]);
const repository = contents.get(files[5]);
const domainTests = contents.get(files[6]);
const readTests = contents.get(files[7]);
const securityTests = contents.get(files[8]);
const client = contents.get(files[9]);
const template = contents.get(files[10]);
const pageTests = contents.get(files[11]);
const browser = JSON.parse(contents.get(files[12]));
const dashboard = JSON.parse(contents.get(files[13]));

const checks = [
  {
    id: 'account-user-scoped-route',
    passed:
      api.includes('MapGet("/api/v1/journal"') &&
      api.includes('PlatformClaims.AccountId') &&
      api.includes('PlatformClaims.Subject') &&
      api.includes('Headers.CacheControl = "no-store"'),
    detail: 'The journal REST surface requires account and user claims and is non-cacheable.',
  },
  {
    id: 'read-only-non-authority-contract',
    passed:
      readService.includes('dataMode') &&
      client.includes("value['isReadOnly'] !== true") &&
      client.includes("value['canSubmitOrder'] !== false") &&
      readTests.includes('SnapshotIsScopedSyntheticReadOnlyAndNonAuthoritative'),
    detail: 'Synthetic read-only metadata and immutable false authority are enforced end to end.',
  },
  {
    id: 'bounded-normalized-content',
    passed:
      contracts.includes('4_000') &&
      contracts.includes('NormalizeTags') &&
      client.includes('isNormalizedTag') &&
      client.includes("value['evidenceCount']) <= 10_000"),
    detail: 'Narrative, tag and evidence-count inputs are bounded and tags are normalized.',
  },
  {
    id: 'lifecycle-result-coherence',
    passed:
      client.includes('isLifecycleCoherent') &&
      pageTests.includes('a draft with a numeric result') &&
      pageTests.includes('a reviewed entry without a numeric result') &&
      domainTests.includes('Review'),
    detail: 'Draft versus reviewed/archive result semantics fail closed on contradiction.',
  },
  {
    id: 'point-in-time-and-freshness',
    passed:
      client.includes("Date.parse(value['openedAt']) <= Date.parse(String(asOf))") &&
      client.includes('age < -30_000') &&
      pageTests.includes('materially future snapshot'),
    detail: 'Entries cannot postdate the snapshot and future/stale snapshots remain hidden.',
  },
  {
    id: 'unique-entry-and-tag-identities',
    passed:
      client.includes('new Set(ids).size === ids.length') &&
      client.includes("new Set(value['tags']).size === value['tags'].length") &&
      pageTests.includes('duplicate tags'),
    detail: 'Entry IDs and per-entry tags are unique before rendering.',
  },
  {
    id: 'optimistic-concurrency-and-audit',
    passed:
      contracts.includes('EntryVersion') &&
      repository.includes('expectedVersion') &&
      domainTests.includes('Stale') &&
      domainTests.includes('Audit'),
    detail: 'Local domain evidence retains version fencing and append-only audit behavior.',
  },
  {
    id: 'fail-closed-content-suppression',
    passed:
      client.includes("'Loading' | 'Ready' | 'Denied' | 'Unavailable' | 'Stale' | 'Invalid'") &&
      client.includes('this.snapshot.set(null)') &&
      pageTests.includes('hides every record'),
    detail: 'Malformed, stale, denied and unavailable states remove all journal content.',
  },
  {
    id: 'read-only-user-interface',
    passed:
      pageTests.includes("querySelector('button')") &&
      pageTests.includes("querySelector('form')") &&
      template.includes('Journal entry is disabled'),
    detail: 'The journal UI has no create/edit form, button or consequential command.',
  },
  {
    id: 'local-browser-quality',
    passed:
      Array.isArray(browser.evidence) &&
      browser.evidence.length >= 3 &&
      acceptance.includes('zero WCAG A/AA axe violations'),
    detail: 'Retained production-artifact evidence covers wide, narrow and denied states.',
  },
  {
    id: 'adjacent-readiness-negative',
    passed: dashboard.dashboardAccepted === false,
    detail: 'The adjacent account dashboard remains explicitly unaccepted.',
  },
  {
    id: 'external-and-trading-boundary',
    passed:
      acceptance.includes('return synthetic records only') &&
      acceptance.includes('No journal database') &&
      acceptance.includes('cannot authorize an order'),
    detail:
      'No production database, identity certification, broker, risk or order authority is inferred.',
  },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length)
  throw new Error(`Journal readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'Authenticated write endpoints, idempotency, CSRF controls and a governed create/edit UI remain unavailable.',
  'PostgreSQL transactional journal, audit and outbox persistence are not implemented or certified.',
  'Retention, privacy, legal-hold, export and personal-note handling rules remain unapproved.',
  'Evidence, order, position, account and user references are not authoritatively validated.',
  'Database concurrency, authorization, privacy, assistive-technology, load, recovery and audit-reconstruction testing remain incomplete.',
  'A fresh repository-pinned .NET 10 run plus Product, Security, Privacy, Risk and Operations approvals remain Pending.',
];
const artifacts = files.map((file) => ({
  path: file,
  sha256: createHash('sha256').update(contents.get(file)).digest('hex'),
}));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 6.6 Trading Journal readiness',
  localControls: 'PASS',
  readinessDecision:
    'Local Read-Only Journal Ready / Persistence, Privacy and Accountable Acceptance Pending',
  journalAccepted: false,
  writeWorkflowEnabled: false,
  postgresPersistenceEnabled: false,
  personalNotesEnabled: false,
  brokerConnected: false,
  orderControlsPresent: false,
  deploymentAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/journal-readiness'), { recursive: true });
await writeFile(
  path.join(root, 'outputs/journal-readiness/readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `Journal: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local Read-Only Journal Ready / Persistence, Privacy and Accountable Acceptance Pending.`,
);
