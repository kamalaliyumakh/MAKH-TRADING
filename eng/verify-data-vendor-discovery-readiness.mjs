import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/vendors/CURRENT_DATA_VENDOR_DISCOVERY_SCOPE.md',
  'docs/vendors/CURRENT_DATA_VENDOR_SOURCE_REVIEW.md',
  'docs/vendors/CURRENT_DATA_VENDOR_DECISION_REGISTER.md',
  'docs/vendors/CURRENT_DATA_VENDOR_QUALITY_TEST_MATRIX.md',
  'docs/vendors/DATA_VENDOR_REQUIREMENTS.md',
  'docs/vendors/VENDOR_DUE_DILIGENCE.md',
  'outputs/legal-discovery-readiness/current-readiness-manifest.json',
  'outputs/market-data-adapter-readiness/readiness-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const discovery = contents.get(evidenceFiles[0]);
const sources = contents.get(evidenceFiles[1]);
const decisions = contents.get(evidenceFiles[2]);
const quality = contents.get(evidenceFiles[3]);
const requirements = contents.get(evidenceFiles[4]);
const diligence = contents.get(evidenceFiles[5]);
const legal = JSON.parse(contents.get(evidenceFiles[6]));
const adapter = JSON.parse(contents.get(evidenceFiles[7]));

const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`);
const exactInventory = (text, prefix, count) => {
  const rows = text.match(new RegExp(`^\\| ${prefix}-\\d{2} \\|`, 'gm')) ?? [];
  return rows.length === count && ids(prefix, count).every((id) => text.includes(`| ${id} |`));
};
const exactStateInventory = (text, prefix, count, state) =>
  exactInventory(text, prefix, count)
  && ids(prefix, count).every((id) => new RegExp(`^\\| ${id} \\|.*\\| ${state} \\|$`, 'm').test(text));

const rightsBullets = discovery.split('## Rights model')[1]?.split('## Current blockers')[0]?.match(/^- /gm) ?? [];
const blockerRows = discovery.match(/^\| DVB-\d{2} \| Critical \| Open \|/gm) ?? [];
const sourceRules = sources.split('## Source-control rules')[1]?.match(/^- /gm) ?? [];

const checks = [
  { id: 'fourteen-mandatory-data-requirements', passed: exactInventory(requirements, 'DVR', 14), detail: 'DVR-01 through DVR-14 are complete.' },
  { id: 'eight-controlled-metric-definitions', passed: exactInventory(requirements, 'DVM', 8), detail: 'DVM-01 through DVM-08 are complete.' },
  { id: 'twenty-due-diligence-items', passed: exactInventory(diligence, 'VDD', 20), detail: 'VDD-01 through VDD-20 are complete.' },
  { id: 'twelve-operating-facts-pending', passed: exactStateInventory(discovery, 'DF', 12, 'Pending'), detail: 'DF-01 through DF-12 remain explicitly Pending.' },
  { id: 'twelve-candidate-evidence-items-pending', passed: exactStateInventory(discovery, 'DVE', 12, 'Pending'), detail: 'DVE-01 through DVE-12 remain explicitly Pending.' },
  { id: 'eight-primary-source-entries', passed: exactInventory(sources, 'DSR', 8), detail: 'DSR-01 through DSR-08 record current primary-source discovery inputs.' },
  { id: 'ten-decisions-pending', passed: exactStateInventory(decisions, 'DDD', 10, 'Pending'), detail: 'DDD-01 through DDD-10 remain explicitly Pending.' },
  { id: 'eighteen-quality-tests-not-run', passed: exactStateInventory(quality, 'PQA', 18, 'NotRun'), detail: 'PQA-01 through PQA-18 exist and remain NotRun.' },
  { id: 'six-rights-rules', passed: rightsBullets.length === 6 && discovery.includes('A right to view data does not imply non-display'), detail: 'Six fail-closed rights rules distinguish display from automated, derived, storage and redistribution use.' },
  { id: 'eight-critical-open-blockers', passed: blockerRows.length === 8 && exactInventory(discovery, 'DVB', 8), detail: 'DVB-01 through DVB-08 remain Critical and Open.' },
  { id: 'four-source-control-rules', passed: sourceRules.length === 4 && sources.includes('do not grant rights'), detail: 'Source review remains bounded discovery rather than a rights grant.' },
  { id: 'legal-predecessor-unapproved', passed: legal.qualifiedReviewExecuted === false && legal.legalConclusionRecorded === false && legal.providerAuthorityCreated === false && legal.publicationAuthorityCreated === false && legal.paperTradingAuthorityCreated === false && legal.pilotAuthorityCreated === false && legal.liveTradingAuthorityCreated === false, detail: 'Qualified legal review and downstream provider/publication/trading authority remain unavailable.' },
  { id: 'adapter-predecessor-unaccepted', passed: adapter.readinessDecision.includes('Licensed Integration Pending') && adapter.externalConnectivityEnabled === false && adapter.licensedProviderCertified === false && adapter.marketDataAdapterAccepted === false && adapter.scannerAuthorityCreated === false && adapter.paperTradingAuthorityCreated === false && adapter.liveTradingAuthorityCreated === false, detail: 'The market-data adapter remains disconnected and uncertified.' },
  { id: 'no-provider-or-production-authority', passed: discovery.includes('does not select or recommend a provider, contact a provider') && decisions.includes('no provider selected, contacted, purchased or authorized') && decisions.includes('cannot select/contact a provider, accept terms, purchase a service, create credentials, enable entitlements, ingest or publish external data, or authorize production/paper/live trading'), detail: 'The package creates no selection, contact, purchase, credential, entitlement, ingestion, publication or trading authority.' },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Data-vendor discovery readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = ids('DVB', 8).map((id) => {
  const match = discovery.match(new RegExp(`^\\| ${id} \\| Critical \\| Open \\| (.+) \\|$`, 'm'));
  return { id, severity: 'Critical', state: 'Open', description: match[1] };
});
const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));

const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 1.4 local data-vendor rights and certification discovery evidence only',
  readinessDecision: 'Prepared / Upstream Rights, Entitlements and Certification Pending',
  inventory: {
    mandatoryDataRequirements: 14,
    controlledMetricDefinitions: 8,
    dueDiligenceItems: 20,
    operatingFactsPending: 12,
    candidateEvidenceItemsPending: 12,
    primarySourceEntries: 8,
    decisionsPending: 10,
    qualityTestsNotRun: 18,
    rightsRules: 6,
    criticalOpenBlockers: 8,
  },
  providerSelected: false,
  providerContacted: false,
  commercialRightsApproved: false,
  upstreamRightsApproved: false,
  entitlementScheduleApproved: false,
  qualityTestsExecuted: false,
  providerCertificationAccepted: false,
  subscriptionAuthorized: false,
  paymentAuthorized: false,
  credentialCreationAuthorized: false,
  trialAuthorized: false,
  externalConnectivityEnabled: false,
  productionEntitlementAuthorized: false,
  externalIngestionAuthorized: false,
  publicationAuthorityCreated: false,
  scannerAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  pilotAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/data-vendor-discovery-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Data-vendor discovery prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} Critical/Open blockers; upstream rights, entitlements and certification remain Pending and no provider or production authority was created.`);
