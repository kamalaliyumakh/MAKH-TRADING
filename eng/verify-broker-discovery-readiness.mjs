import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/broker/CURRENT_BROKER_DISCOVERY_SCOPE.md',
  'docs/broker/CURRENT_BROKER_SOURCE_REVIEW.md',
  'docs/broker/CURRENT_BROKER_DECISION_REGISTER.md',
  'docs/broker/CURRENT_BROKER_ADAPTER_TEST_MATRIX.md',
  'docs/broker/BROKER_REQUIREMENTS.md',
  'docs/broker/BROKER_DUE_DILIGENCE.md',
  'outputs/legal-discovery-readiness/current-readiness-manifest.json',
  'outputs/paper-trading-gate/local-evidence-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const discovery = contents.get(evidenceFiles[0]);
const sources = contents.get(evidenceFiles[1]);
const decisions = contents.get(evidenceFiles[2]);
const adapter = contents.get(evidenceFiles[3]);
const requirements = contents.get(evidenceFiles[4]);
const diligence = contents.get(evidenceFiles[5]);
const legal = JSON.parse(contents.get(evidenceFiles[6]));
const paperGate = JSON.parse(contents.get(evidenceFiles[7]));

const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`);
const exactInventory = (text, prefix, count) => {
  const rows = text.match(new RegExp(`^\\| ${prefix}-\\d{2} \\|`, 'gm')) ?? [];
  return rows.length === count && ids(prefix, count).every((id) => text.includes(`| ${id} |`));
};
const exactStateInventory = (text, prefix, count, state) =>
  exactInventory(text, prefix, count)
  && ids(prefix, count).every((id) => new RegExp(`^\\| ${id} \\|.*\\| ${state} \\|$`, 'm').test(text));

const safetyBullets = requirements.split('## Safety and operational requirements')[1]?.match(/^- /gm) ?? [];
const proofSteps = diligence.split('## Required proof sequence')[1]?.match(/^\d+\. /gm) ?? [];
const blockerRows = discovery.match(/^\| BRB-\d{2} \| Critical \| Open \|/gm) ?? [];

const checks = [
  { id: 'twelve-mandatory-broker-gates', passed: exactInventory(requirements, 'BR', 12), detail: 'BR-01 through BR-12 are complete.' },
  { id: 'ten-order-capabilities', passed: exactInventory(requirements, 'BC', 10), detail: 'BC-01 through BC-10 are complete.' },
  { id: 'eight-safety-requirements', passed: safetyBullets.length === 8, detail: 'Eight fail-closed broker safety rules are explicit.' },
  { id: 'ten-operating-facts-pending', passed: exactStateInventory(discovery, 'BF', 10, 'Pending'), detail: 'BF-01 through BF-10 remain explicitly Pending.' },
  { id: 'ten-candidate-evidence-items-pending', passed: exactStateInventory(discovery, 'BE', 10, 'Pending'), detail: 'BE-01 through BE-10 remain explicitly Pending.' },
  { id: 'seven-official-source-entries', passed: exactInventory(sources, 'BSR', 7), detail: 'BSR-01 through BSR-07 record current official-source discovery inputs.' },
  { id: 'ten-decisions-pending', passed: exactStateInventory(decisions, 'BDD', 10, 'Pending'), detail: 'BDD-01 through BDD-10 remain explicitly Pending.' },
  { id: 'eighteen-adapter-tests-not-run', passed: exactStateInventory(adapter, 'BAT', 18, 'NotRun'), detail: 'BAT-01 through BAT-18 exist and remain NotRun.' },
  { id: 'twenty-due-diligence-items', passed: exactInventory(diligence, 'BD', 20), detail: 'BD-01 through BD-20 are complete.' },
  { id: 'eight-proof-steps', passed: proofSteps.length === 8 && diligence.includes('no paper result automatically enables live'), detail: 'Eight proof steps preserve a separate live authorization.' },
  { id: 'seven-critical-open-blockers', passed: blockerRows.length === 7 && exactInventory(discovery, 'BRB', 7), detail: 'BRB-01 through BRB-07 remain Critical and Open.' },
  { id: 'legal-predecessor-unapproved', passed: legal.qualifiedReviewExecuted === false && legal.legalConclusionRecorded === false && legal.brokerAuthorityCreated === false && legal.paperTradingAuthorityCreated === false && legal.pilotAuthorityCreated === false && legal.liveTradingAuthorityCreated === false, detail: 'Qualified legal review and downstream trading authority remain unavailable.' },
  { id: 'paper-gate-rejects-authority', passed: paperGate.readinessDecision.startsWith('Reject / Defer') && paperGate.gateAccepted === false && paperGate.paperCertificationCreated === false && paperGate.controlledLivePreparationAuthorized === false && paperGate.liveTradingAuthorityCreated === false, detail: 'The paper-trading gate remains Reject / Defer with no certification or live authority.' },
  { id: 'no-provider-or-trading-authority', passed: discovery.includes('does not select or recommend a broker, contact a provider') && discovery.includes('open or fund an account, create credentials') && decisions.includes('no broker selected, contacted or authorized') && decisions.includes('cannot select/contact a broker, accept terms, open/fund an account, create credentials, purchase services or authorize paper/live trading'), detail: 'The discovery package creates no provider selection, outreach, account, credential, paper, pilot or live authority.' },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Broker-discovery readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = ids('BRB', 7).map((id) => {
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
  scope: 'WBS 1.3 local broker eligibility and integration discovery evidence only',
  readinessDecision: 'Prepared / Regulated-Operator Eligibility, Contract and Certification Pending',
  inventory: {
    mandatoryBrokerGates: 12,
    orderCapabilities: 10,
    safetyRequirements: 8,
    operatingFactsPending: 10,
    candidateEvidenceItemsPending: 10,
    officialSourceEntries: 7,
    decisionsPending: 10,
    adapterTestsNotRun: 18,
    dueDiligenceItems: 20,
    proofSteps: 8,
    criticalOpenBlockers: 7,
  },
  brokerSelected: false,
  providerContacted: false,
  eligibilityConfirmed: false,
  contractApproved: false,
  paperTestsExecuted: false,
  paperCertificationAccepted: false,
  accountOpeningAuthorized: false,
  accountFundingAuthorized: false,
  credentialCreationAuthorized: false,
  commercialOutreachAuthorized: false,
  paperTradingAuthorityCreated: false,
  pilotAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/broker-discovery-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Broker discovery prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} Critical/Open blockers; regulated-operator eligibility, contract and certification remain Pending and no broker or trading authority was created.`);
