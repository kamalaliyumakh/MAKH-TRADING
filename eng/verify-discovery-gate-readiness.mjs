import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/discovery/CURRENT_DISCOVERY_GATE_REVIEW.md',
  'docs/discovery/CURRENT_DISCOVERY_GATE_BUDGET_REGISTER.md',
  'docs/discovery/CURRENT_DISCOVERY_GATE_DECISION_REGISTER.md',
  'outputs/integrated-plan-readiness/readiness-manifest.json',
  'outputs/scope-validation-readiness/readiness-manifest.json',
  'outputs/legal-discovery-readiness/current-readiness-manifest.json',
  'outputs/broker-discovery-readiness/current-readiness-manifest.json',
  'outputs/data-vendor-discovery-readiness/current-readiness-manifest.json',
  'outputs/hosting-discovery-readiness/current-readiness-manifest.json',
  'docs/ux/UX_RESEARCH_FINDINGS.md',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const review = contents.get(evidenceFiles[0]);
const budget = contents.get(evidenceFiles[1]);
const decision = contents.get(evidenceFiles[2]);
const integratedPlan = JSON.parse(contents.get(evidenceFiles[3]));
const scope = JSON.parse(contents.get(evidenceFiles[4]));
const legal = JSON.parse(contents.get(evidenceFiles[5]));
const broker = JSON.parse(contents.get(evidenceFiles[6]));
const vendor = JSON.parse(contents.get(evidenceFiles[7]));
const hosting = JSON.parse(contents.get(evidenceFiles[8]));
const ux = contents.get(evidenceFiles[9]);

const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`);
const exactInventory = (text, prefix, count) => {
  const rows = text.match(new RegExp(`^\\| ${prefix}-\\d{2} \\|`, 'gm')) ?? [];
  return rows.length === count && ids(prefix, count).every((id) => text.includes(`| ${id} |`));
};
const exactStateInventory = (text, prefix, count, state) =>
  exactInventory(text, prefix, count)
  && ids(prefix, count).every((id) => new RegExp(`^\\| ${id} \\|.*\\| ${state} \\|$`, 'm').test(text));

const permittedItems = review.split('## Permitted work before gate acceptance')[1]?.split('## Prohibited work before gate acceptance')[0]?.match(/^- /gm) ?? [];
const prohibitedItems = review.split('## Prohibited work before gate acceptance')[1]?.split('## Exit sequence')[0]?.match(/^- /gm) ?? [];
const exitSteps = review.split('## Exit sequence')[1]?.match(/^\d+\. /gm) ?? [];
const blockerRows = review.match(/^\| DGB-\d{2} \| Critical \| Open \|/gm) ?? [];
const scenarioRows = budget.match(/^\| S[1-4] \|/gm) ?? [];
const budgetRules = budget.split('## Calculation and evidence rules')[1]?.match(/^- /gm) ?? [];

const checks = [
  { id: 'eight-current-readiness-areas', passed: exactInventory(review, 'DGA', 8) && review.includes('do not imply approval, funding, provider eligibility'), detail: 'DGA-01 through DGA-08 separate local evidence from acceptance and authority.' },
  { id: 'ten-gate-criteria-current-state', passed: exactInventory(review, 'DG', 10) && (review.match(/\| Fail \|/g) ?? []).length === 8 && review.includes('| DG-09 |') && review.includes('| LocalPass |') && review.includes('| DG-10 |') && review.includes('| Pending |'), detail: 'DG-01 through DG-10 retain eight Fail, one LocalPass and one Pending state.' },
  { id: 'ten-critical-open-blockers', passed: blockerRows.length === 10 && exactInventory(review, 'DGB', 10), detail: 'DGB-01 through DGB-10 remain Critical and Open.' },
  { id: 'bounded-preapproval-work', passed: permittedItems.length === 4 && prohibitedItems.length === 6 && exitSteps.length === 7, detail: 'Four permitted items, six prohibitions and seven exit steps govern work before acceptance.' },
  { id: 'ten-budget-families-pending', passed: exactStateInventory(budget, 'BUD', 10, 'Pending'), detail: 'BUD-01 through BUD-10 remain explicitly Pending.' },
  { id: 'four-separated-funding-scenarios', passed: scenarioRows.length === 4 && budget.includes('| S1 |') && budget.includes('| S2 |') && budget.includes('| S3 |') && budget.includes('| S4 |') && budget.includes('Funding one scenario cannot authorize another'), detail: 'S1 through S4 remain separately governed and unfunded.' },
  { id: 'eight-budget-inputs-pending', passed: exactStateInventory(budget, 'BI', 8, 'Pending'), detail: 'BI-01 through BI-08 remain explicitly Pending.' },
  { id: 'five-budget-evidence-rules', passed: budgetRules.length === 5 && budget.includes('No monetary total is fabricated'), detail: 'Five rules prevent estimates or missing inputs from becoming an approved budget.' },
  { id: 'ten-gate-decisions-pending', passed: exactStateInventory(decision, 'GDD', 10, 'Pending'), detail: 'GDD-01 through GDD-10 remain explicitly Pending.' },
  { id: 'ten-immutable-scope-fields-pending', passed: exactStateInventory(decision, 'GIS', 10, 'Pending'), detail: 'GIS-01 through GIS-10 remain explicitly Pending.' },
  { id: 'eight-approvals-pending', passed: exactStateInventory(decision, 'AP', 8, 'Pending'), detail: 'AP-01 through AP-08 remain explicitly Pending.' },
  { id: 'plan-and-scope-unapproved', passed: integratedPlan.planApproved === false && integratedPlan.sponsorApprovalRecorded === false && scope.scopeApproved === false && scope.productOwnerApprovalRecorded === false && scope.downstreamGateAuthorityCreated === false, detail: 'Integrated-plan and Product Owner scope approvals remain unavailable.' },
  { id: 'legal-provider-hosting-predecessors-unavailable', passed: legal.qualifiedReviewExecuted === false && legal.legalConclusionRecorded === false && broker.brokerSelected === false && broker.eligibilityConfirmed === false && vendor.providerSelected === false && vendor.commercialRightsApproved === false && hosting.providerSelected === false && hosting.regionApproved === false && hosting.budgetApproved === false && hosting.recoveryTargetsProven === false && ux.includes('No representative-user interviews'), detail: 'Qualified legal, broker, data, hosting, budget/recovery and representative-user evidence remains unavailable.' },
  { id: 'current-discovery-package-contracts', passed: [legal, broker, vendor, hosting].every((manifest) => manifest.schemaVersion === 3 && manifest.checks.length === 16 && manifest.artifacts.length === 10) && broker.blockers.length === 10 && vendor.blockers.length === 10 && hosting.blockers.length === 10, detail: 'Current legal, broker, data-vendor and hosting package contracts are reconciled.' },
  { id: 'provider-and-trading-authority-disabled', passed: broker.commercialOutreachAuthorized === false && broker.capitalAuthorized === false && broker.brokerOrdersAuthorized === false && vendor.commercialOutreachAuthorized === false && vendor.subscriptionAuthorized === false && vendor.capitalAuthorized === false && vendor.brokerOrdersAuthorized === false && hosting.commercialOutreachAuthorized === false && hosting.subscriptionAuthorized === false && hosting.spendAuthorized === false && hosting.deploymentAuthorized === false && hosting.capitalAuthorized === false && hosting.brokerOrdersAuthorized === false, detail: 'Commercial engagement, spend, deployment, capital and order authority remain disabled.' },
  { id: 'reject-defer-and-no-authority', passed: review.includes('Reject / Defer — Mandatory Discovery Evidence, Funding and Accountable Approval Pending') && decision.includes('creates no gate acceptance, exception, funding, provider commitment, account, subscription, provisioning, secret, connectivity, deployment, publication, external-user, broker-funding, paper-trial, pilot or live-trading authority'), detail: 'Reject / Defer remains explicit and no downstream authority is created.' },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Discovery-gate readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = ids('DGB', 10).map((id) => {
  const match = review.match(new RegExp(`^\\| ${id} \\| Critical \\| Open \\| (.+) \\|$`, 'm'));
  return { id, severity: 'Critical', state: 'Open', description: match[1] };
});
const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));

const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 1.7 current consolidated discovery-gate evidence only',
  readinessDecision: 'Reject / Defer — Mandatory Discovery Evidence, Funding and Accountable Approval Pending',
  inventory: {
    readinessAreas: 8,
    gateCriteria: 10,
    criticalOpenBlockers: 10,
    permittedItems: 4,
    prohibitedItems: 6,
    exitSteps: 7,
    budgetFamiliesPending: 10,
    fundingScenarios: 4,
    budgetInputsPending: 8,
    gateDecisionsPending: 10,
    immutableScopeFieldsPending: 10,
    approvalsPending: 8,
  },
  gateAccepted: false,
  exceptionApproved: false,
  budgetApproved: false,
  fundingAuthorized: false,
  sponsorApprovalRecorded: false,
  productOwnerApprovalRecorded: false,
  downstreamGateAuthorityCreated: false,
  providerContactAuthorized: false,
  providerCommitmentAuthorized: false,
  accountOpeningAuthorized: false,
  subscriptionAuthorized: false,
  productionProvisioningAuthorized: false,
  secretCreationAuthorized: false,
  externalConnectivityAuthorized: false,
  deploymentAuthorized: false,
  publicationAuthorityCreated: false,
  externalUserAuthorityCreated: false,
  fundedBrokerageAuthorized: false,
  paperTrialAuthorized: false,
  pilotAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/discovery-gate-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Discovery gate remains Reject / Defer: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} Critical/Open blockers; no funding, provider commitment, production, publication, paper, pilot or live authority was created.`);
