import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/hosting/CURRENT_HOSTING_DISCOVERY_SCOPE.md',
  'docs/hosting/CURRENT_HOSTING_SOURCE_REVIEW.md',
  'docs/hosting/CURRENT_HOSTING_DECISION_REGISTER.md',
  'docs/hosting/CURRENT_HOSTING_ACCEPTANCE_MATRIX.md',
  'docs/hosting/HOSTING_REQUIREMENTS.md',
  'docs/hosting/COST_AND_CAPACITY_MODEL.md',
  'outputs/legal-discovery-readiness/current-readiness-manifest.json',
  'outputs/environment-foundation-readiness/readiness-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const discovery = contents.get(evidenceFiles[0]);
const sources = contents.get(evidenceFiles[1]);
const decisions = contents.get(evidenceFiles[2]);
const acceptance = contents.get(evidenceFiles[3]);
const requirements = contents.get(evidenceFiles[4]);
const cost = contents.get(evidenceFiles[5]);
const legal = JSON.parse(contents.get(evidenceFiles[6]));
const environment = JSON.parse(contents.get(evidenceFiles[7]));

const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`);
const exactInventory = (text, prefix, count) => {
  const rows = text.match(new RegExp(`^\\| ${prefix}-\\d{2} \\|`, 'gm')) ?? [];
  return rows.length === count && ids(prefix, count).every((id) => text.includes(`| ${id} |`));
};
const exactStateInventory = (text, prefix, count, state) =>
  exactInventory(text, prefix, count)
  && ids(prefix, count).every((id) => new RegExp(`^\\| ${id} \\|.*\\| ${state} \\|$`, 'm').test(text));

const environmentRows = cost.split('## Environment profile')[1]?.split('## Monthly total-cost equation')[0]?.split('\n').filter((line) => /^\| (?:Development|Test|Staging|Paper production|Live production) \|/.test(line)) ?? [];
const capacityRows = cost.split('## Capacity inputs')[1]?.split('## Cost controls')[0]?.split('\n').filter((line) => /^\| (?:Concurrent owner sessions|Symbols monitored concurrently|Watchlist candidates retained\/day|API requests\/second|SignalR connections|PostgreSQL starting storage|Log retention|Audit retention) \|/.test(line)) ?? [];
const costControls = cost.split('## Cost controls')[1]?.split('## Quote acceptance')[0]?.match(/^- /gm) ?? [];
const selectionRules = discovery.split('## Selection rules')[1]?.split('## Current blockers')[0]?.match(/^- /gm) ?? [];
const blockerRows = discovery.match(/^\| HDB-\d{2} \| Critical \| Open \|/gm) ?? [];
const sourceRules = sources.split('## Source-control rules')[1]?.match(/^- /gm) ?? [];

const checks = [
  { id: 'sixteen-hosting-requirements', passed: exactInventory(requirements, 'HR', 16), detail: 'HR-01 through HR-16 are complete.' },
  { id: 'seven-hard-production-gates', passed: requirements.includes('HR-03, HR-04, HR-05, HR-07, HR-08, HR-11 or HR-14') && requirements.includes('does not authorize a live broker connection'), detail: 'Seven hard production gates and the no-live-authority boundary are explicit.' },
  { id: 'five-isolated-environments', passed: environmentRows.length === 5, detail: 'Development, test, staging, paper production and live production remain distinct.' },
  { id: 'capacity-and-cost-controls', passed: capacityRows.length === 8 && costControls.length === 6 && cost.includes('no prices or budget approval claimed'), detail: 'Eight capacity inputs and six cost controls preserve the unapproved quote boundary.' },
  { id: 'twelve-operating-facts-pending', passed: exactStateInventory(discovery, 'HF', 12, 'Pending'), detail: 'HF-01 through HF-12 remain explicitly Pending.' },
  { id: 'twelve-candidate-evidence-items-pending', passed: exactStateInventory(discovery, 'HE', 12, 'Pending'), detail: 'HE-01 through HE-12 remain explicitly Pending.' },
  { id: 'eight-official-source-entries', passed: exactInventory(sources, 'HSR', 8), detail: 'HSR-01 through HSR-08 record current official-source discovery inputs.' },
  { id: 'ten-decisions-pending', passed: exactStateInventory(decisions, 'HDD', 10, 'Pending'), detail: 'HDD-01 through HDD-10 remain explicitly Pending.' },
  { id: 'eighteen-hosting-tests-not-run', passed: exactStateInventory(acceptance, 'HOA', 18, 'NotRun'), detail: 'HOA-01 through HOA-18 exist and remain NotRun.' },
  { id: 'seven-selection-rules', passed: selectionRules.length === 7 && discovery.includes('High availability does not prove disaster recovery'), detail: 'Seven fail-closed selection and recovery rules are explicit.' },
  { id: 'eight-critical-open-blockers', passed: blockerRows.length === 8 && exactInventory(discovery, 'HDB', 8), detail: 'HDB-01 through HDB-08 remain Critical and Open.' },
  { id: 'four-source-control-rules', passed: sourceRules.length === 4 && sources.includes('do not establish residency'), detail: 'Source review remains discovery rather than residency, architecture or spend approval.' },
  { id: 'legal-and-environment-predecessors-unapproved', passed: legal.qualifiedReviewExecuted === false && legal.privacyApproved === false && legal.publicationAuthorityCreated === false && legal.liveTradingAuthorityCreated === false && environment.environmentProvisioned === false && environment.productionEnvironmentCreated === false && environment.recoveryTargetsProven === false && environment.environmentFoundationAccepted === false && environment.deploymentAuthorized === false && environment.paperTradingAuthorityCreated === false && environment.liveTradingAuthorityCreated === false, detail: 'Qualified legal/privacy and deployed environment predecessors remain unavailable.' },
  { id: 'no-provider-provisioning-spend-or-trading-authority', passed: discovery.includes('does not select or recommend a provider, contact a provider') && decisions.includes('no provider, region, account, provisioning or spend authorized') && decisions.includes('cannot select/contact a provider, accept terms, create an account, subscribe, provision, create secrets, enable connectivity, incur spend, deploy workloads or authorize paper/live production'), detail: 'The package creates no provider, account, provisioning, spend, deployment, paper or live authority.' },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Hosting-discovery readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = ids('HDB', 8).map((id) => {
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
  scope: 'WBS 1.5 local hosting, region and recovery discovery evidence only',
  readinessDecision: 'Prepared / Region, Managed-Service Validation, Recovery Proof and Approval Pending',
  inventory: {
    hostingRequirements: 16,
    hardProductionGates: 7,
    isolatedEnvironments: 5,
    capacityInputs: 8,
    costControls: 6,
    operatingFactsPending: 12,
    candidateEvidenceItemsPending: 12,
    officialSourceEntries: 8,
    decisionsPending: 10,
    hostingTestsNotRun: 18,
    selectionRules: 7,
    criticalOpenBlockers: 8,
  },
  hostingProviderSelected: false,
  providerContacted: false,
  regionApproved: false,
  architectureApproved: false,
  privacyResidencyApproved: false,
  budgetApproved: false,
  quoteAccepted: false,
  recoveryTestsExecuted: false,
  recoveryTargetsProven: false,
  adrAccepted: false,
  cloudAccountAuthorized: false,
  subscriptionAuthorized: false,
  provisioningAuthorized: false,
  secretCreationAuthorized: false,
  connectivityAuthorized: false,
  spendAuthorized: false,
  deploymentAuthorized: false,
  paperProductionAuthorityCreated: false,
  pilotAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/hosting-discovery-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Hosting discovery prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} Critical/Open blockers; region, managed-service validation, recovery proof and approval remain Pending and no provisioning, spend or trading authority was created.`);
