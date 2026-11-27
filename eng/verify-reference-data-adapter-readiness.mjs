import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/REFERENCE_DATA_ADAPTER_ACCEPTANCE.md',
  'src/MAKH.Application/Market/ReferenceDataContracts.cs',
  'src/MAKH.Application/Market/ReferenceDataResolver.cs',
  'src/MAKH.Infrastructure/Market/SyntheticReferenceDataAdapter.cs',
  'tests/MAKH.Architecture.Tests/ReferenceDataAdapterTests.cs',
  'outputs/security-master-readiness/readiness-manifest.json',
  'outputs/market-data-adapter-readiness/readiness-manifest.json',
  'docs/vendors/VENDOR_DECISION_RECORD.md',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const contracts = contents.get(files[1]);
const resolver = contents.get(files[2]);
const adapter = contents.get(files[3]);
const tests = contents.get(files[4]);
const securityMaster = JSON.parse(contents.get(files[5]));
const marketData = JSON.parse(contents.get(files[6]));
const vendor = contents.get(files[7]);

const checks = [
  { id: 'provider-neutral-reference-port', passed: contracts.includes('interface IReferenceDataProvider') && contracts.includes('GetShareMetricsAsync') && contracts.includes('GetCorporateActionsAsync'), detail: 'Application owns provider-neutral share-metric and corporate-action ports.' },
  { id: 'metric-separation', passed: contracts.includes('PublicFloat') && contracts.includes('SharesOutstanding') && tests.includes('SharesOutstandingCannotSubstituteForFloat'), detail: 'Public float and shares outstanding cannot substitute for one another.' },
  { id: 'temporal-provenance', passed: contracts.includes('Observation time cannot precede') && contracts.includes('ToUniversalTime()') && tests.includes('ProvenanceRejectsFutureAsOfAndBrokenRevisionLineage'), detail: 'Observation time is UTC-normalized and cannot predate the fact as-of date.' },
  { id: 'revision-lineage', passed: contracts.includes('initial fact revision cannot supersede') && contracts.includes('later fact revision must identify') && tests.includes('LatestProviderRevisionIsSelected'), detail: 'Initial and later revision lineage is explicit and deterministic.' },
  { id: 'corporate-action-ratio-policy', passed: contracts.includes('requiresRatio') && contracts.includes('Only split and reverse-split facts may define a ratio') && tests.includes('InvalidSplitRatioIsRejected'), detail: 'Ratio semantics match controlled corporate-action types.' },
  { id: 'fail-closed-definition-consensus', passed: resolver.includes('value or definition') && tests.includes('ConflictingDefinitionsFailAsAmbiguousEvenWhenValuesAgree'), detail: 'Cross-provider definition disagreement cannot qualify a candidate.' },
  { id: 'same-provider-conflict', passed: resolver.includes('same current revision') && tests.includes('SameProviderSameRevisionConflictFailsAsAmbiguous'), detail: 'Same-provider conflicting current revisions cannot be selected arbitrarily.' },
  { id: 'identity-and-revision-collision', passed: adapter.includes('multiple securities or fact kinds') && adapter.includes('duplicate revision numbers') && tests.includes('AdapterRejectsFactIdentityAndRevisionCollisions'), detail: 'Fact identity and revision collisions fail closed.' },
  { id: 'unaccepted-predecessors', passed: securityMaster.securityMasterAccepted === false && marketData.marketDataAdapterAccepted === false && vendor.includes('Pending'), detail: 'Security master, market data and provider decisions remain explicitly unaccepted.' },
  { id: 'no-external-or-trading-authority', passed: acceptance.includes('No vendor endpoint, credential, licensed payload, external service or real issuer record is connected') && acceptance.includes('not represented as executed evidence'), detail: 'No licensed connection, fresh test claim or trading authority is inferred.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Reference-data adapter readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'The newly authored focused cases require a successful repository-pinned .NET 10 rerun.',
  'No approved provider, entitlement, credential, licensed sample or issuer/exchange reconciliation evidence is available.',
  'Controlled float/shares definitions, source precedence, accepted age and tolerated-difference policy remain unapproved.',
  'PostgreSQL revision persistence, effective constraints, retention and correction/split/symbol-change replay remain incomplete.',
  'WBS 1.4, 3.8, 5.1 and 5.2 plus Data, Backend, Risk and Product acceptance remain unavailable.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 5.3 Reference Data Adapter readiness',
  localControls: 'PASS',
  readinessDecision: 'Contract Ready / Definitions and Licensed Reconciliation Pending',
  referenceDataAdapterAccepted: false,
  definitionsApproved: false,
  licensedProviderCertified: false,
  externalConnectivityEnabled: false,
  scannerAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/reference-data-adapter-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/reference-data-adapter-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Reference data adapter: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Contract Ready / Definitions and Licensed Reconciliation Pending.`);
