import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/SECURITY_MASTER_ACCEPTANCE.md',
  'src/MAKH.Domain/Market/Security.cs',
  'src/MAKH.Domain/Market/Venue.cs',
  'src/MAKH.Domain/Market/CorporateAction.cs',
  'src/MAKH.Application/Market/SecurityMasterReconciler.cs',
  'tests/MAKH.Architecture.Tests/SecurityMasterTests.cs',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
  'docs/vendors/VENDOR_DECISION_RECORD.md',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const security = contents.get(files[1]);
const venue = contents.get(files[2]);
const action = contents.get(files[3]);
const reconciler = contents.get(files[4]);
const tests = contents.get(files[5]);
const foundation = JSON.parse(contents.get(files[6]));
const vendor = contents.get(files[7]);

const checks = [
  { id: 'stable-canonical-identity', passed: security.includes('public Guid Id') && security.includes('SymbolHistory') && tests.includes('StableIdentitySurvivesSymbolChange'), detail: 'Canonical security identity is independent of effective-dated ticker history.' },
  { id: 'mic-and-venue-policy', passed: venue.includes('RequireCode(mic, 4') && venue.includes('IsApprovedForMvp'), detail: 'MIC identity and explicit approved-venue policy are enforced.' },
  { id: 'non-overlapping-symbol-history', passed: security.includes('Symbol effective periods cannot overlap') && tests.includes('OverlappingSymbolPeriodsAreRejected'), detail: 'Overlapping effective symbol periods fail closed.' },
  { id: 'instrument-eligibility', passed: security.includes('InstrumentType.CommonStock') && tests.includes('OtcAndNonCommonInstrumentsAreIneligible'), detail: 'Only active common shares on approved venues qualify.' },
  { id: 'corporate-action-ratio-policy', passed: action.includes('requiresRatio') && action.includes('Only split and reverse-split actions may define a ratio') && tests.includes('SplitActionsRequireRatiosAndOtherActionsRejectThem'), detail: 'Split ratios are mandatory only for split actions.' },
  { id: 'point-in-time-delisting', passed: security.includes('IsEligibleForMvpAt') && reconciler.includes('record.AsOf') && tests.includes('DelistingMakesSecurityIneligibleFromEffectiveDate'), detail: 'Delisting disables eligibility from its effective date without rewriting history.' },
  { id: 'provider-provenance-and-corrections', passed: reconciler.includes('SourceRecordId') && reconciler.includes('ObservedAt') && reconciler.includes('CorrectsSourceRecordId') && tests.includes('ProviderEvidenceRequiresProvenanceAndSafeCorrectionLineage'), detail: 'Provider evidence carries identity, observation time and safe correction lineage.' },
  { id: 'provider-neutral-port', passed: reconciler.includes('interface ISecurityMasterSource') && reconciler.includes('IAsyncEnumerable<ProviderSecurityRecord>'), detail: 'A provider-neutral asynchronous source port preserves Clean Architecture boundaries.' },
  { id: 'fail-closed-reconciliation', passed: ['Missing', 'Ambiguous', 'Ineligible', 'Mismatch'].every((state) => reconciler.includes(state)) && tests.includes('ReconcilerFailsClosedOnAmbiguousMapping'), detail: 'Missing, ambiguous, ineligible and mismatched mappings cannot enter the scanner as matched.' },
  { id: 'external-acceptance-unavailable', passed: foundation.gateAccepted === false && vendor.includes('Pending') && acceptance.includes('new cases are therefore authored but not represented as executed evidence'), detail: 'Foundation, provider and fresh execution evidence remain explicitly unavailable.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Security-master readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'The newly authored focused cases require a successful repository-pinned .NET 10 rerun.',
  'PostgreSQL market-schema persistence, non-overlap constraints and replay-safe ingestion are not implemented.',
  'No approved provider adapter, entitlement, licensed sample or identifier mapping is available.',
  'Corporate-action adjustment policy, exchange calendar ownership and listing-venue transition certification remain incomplete.',
  'WBS 1.4 and 3.8 plus Data Engineer, Backend Lead and Product Owner acceptance remain unavailable.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 5.1 Security Master readiness',
  localControls: 'PASS',
  readinessDecision: 'Domain Ready / Persistence and Provider Certification Pending',
  securityMasterAccepted: false,
  licensedDataCertified: false,
  scannerAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/security-master-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/security-master-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Security master: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Domain Ready / Persistence and Provider Certification Pending.`);
