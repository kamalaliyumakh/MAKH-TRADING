import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/CURRENT_FOUNDATION_GATE_REVIEW.md',
  'docs/engineering/CURRENT_FOUNDATION_GATE_DECISION_REGISTER.md',
  'docs/engineering/CURRENT_FOUNDATION_GATE_EVIDENCE_INDEX.md',
  'outputs/architecture-ux-gate/current-readiness-manifest.json',
  'outputs/repository-foundation-readiness/current-readiness-manifest.json',
  'outputs/clean-architecture-readiness/current-readiness-manifest.json',
  'outputs/angular-foundation-readiness/current-readiness-manifest.json',
  'outputs/postgresql-foundation-readiness/current-readiness-manifest.json',
  'outputs/identity-foundation-readiness/current-readiness-manifest.json',
  'outputs/devsecops-foundation-readiness/current-readiness-manifest.json',
  'outputs/environment-foundation-readiness/current-readiness-manifest.json',
  'docs/engineering/FOUNDATION_GATE_APPROVAL.md',
];
const contents = new Map();
for (const file of files) {
  contents.set(file, readFileSync(path.join(root, file), 'utf8'));
}

const review = contents.get(files[0]);
const decisions = contents.get(files[1]);
const index = contents.get(files[2]);
const architecture = JSON.parse(contents.get(files[3]));
const foundation = JSON.parse(contents.get(files[4]));
const clean = JSON.parse(contents.get(files[5]));
const angular = JSON.parse(contents.get(files[6]));
const postgres = JSON.parse(contents.get(files[7]));
const identity = JSON.parse(contents.get(files[8]));
const devsecops = JSON.parse(contents.get(files[9]));
const environment = JSON.parse(contents.get(files[10]));
const legacyApproval = contents.get(files[11]);
const ids = (prefix, count) => Array.from({ length: count }, (_, indexValue) => `${prefix}-${String(indexValue + 1).padStart(2, '0')}`);
const hasInventory = (text, prefix, count) => ids(prefix, count).every((id) => text.includes(id));
const checks = [
  { id: 'fourteen-current-criteria', passed: hasInventory(review, 'FGC', 14) && review.includes('5 LocalPass / 6 Conditional / 1 Fail / 2 Pending'), detail: 'FGC-01–FGC-14 reconcile current local, hosted, predecessor and approval states.' },
  { id: 'ten-open-blockers', passed: hasInventory(review, 'FGB', 10) && (review.match(/^\| FGB-\d{2} \| (Critical|High) \|/gm) ?? []).length === 10, detail: 'FGB-01–FGB-10 remain explicit Critical/High blockers.' },
  { id: 'ten-exit-steps', passed: (review.match(/^\d+\. /gm) ?? []).length === 10, detail: 'The gate has a ten-step accountable exit sequence.' },
  { id: 'bounded-preparation', passed: review.includes('## Permitted preparation') && review.includes('## Authority boundary') && review.includes('entry lock'), detail: 'Only local, synthetic, entry-locked preparation is permitted.' },
  { id: 'ten-pending-decisions', passed: hasInventory(decisions, 'FGD', 10) && (decisions.match(/^\| FGD-\d{2} \| .* \| Pending \|/gm) ?? []).length === 10, detail: 'FGD-01–FGD-10 remain Pending.' },
  { id: 'eight-pending-approval-fields', passed: hasInventory(decisions, 'FGA', 8) && (decisions.match(/^\| FGA-\d{2} \| .* \| Pending \|/gm) ?? []).length === 8, detail: 'FGA-01–FGA-08 remain Pending.' },
  { id: 'twelve-evidence-items', passed: hasInventory(index, 'FGE', 12), detail: 'FGE-01–FGE-12 define the hydrated evidence package.' },
  { id: 'unavailable-evidence-fails-closed', passed: index.includes('cloud-dataless') && index.includes('not treated as current proof') && review.includes('FGB-09'), detail: 'Unavailable legacy evidence is a blocker, not proof.' },
  { id: 'architecture-predecessor-rejected', passed: String(architecture.readinessDecision).includes('Reject / Defer') && architecture.gateAccepted === false && architecture.downstreamFoundationAuthorityCreated === false, detail: 'WBS 2.8 remains rejected/deferred with no foundation authority.' },
  { id: 'repository-acceptance-pending', passed: foundation.schemaVersion === 3 && foundation.foundationAccepted === false && foundation.readinessDecision === 'Implementation Ready / Acceptance Pending', detail: 'Current WBS 3.1 evidence remains locally ready and unaccepted.' },
  { id: 'clean-architecture-acceptance-pending', passed: clean.schemaVersion === 3 && clean.cleanArchitectureAccepted === false && clean.backendLeadApprovalRecorded === false, detail: 'Current WBS 3.2 evidence remains locally ready and unaccepted.' },
  { id: 'angular-acceptance-pending', passed: angular.schemaVersion === 3 && angular.angularFoundationAccepted === false && angular.frontendLeadApprovalRecorded === false, detail: 'Current WBS 3.3 evidence remains unaccepted.' },
  { id: 'postgres-acceptance-pending', passed: postgres.schemaVersion === 3 && postgres.postgresqlFoundationAccepted === false && postgres.postgresql18Certified === false && postgres.dataEngineerApprovalRecorded === false, detail: 'Current WBS 3.4 target-version certification and approval remain pending.' },
  { id: 'identity-acceptance-pending', passed: identity.schemaVersion === 3 && identity.identityFoundationAccepted === false && identity.providerCertified === false && identity.securityLeadApprovalRecorded === false, detail: 'Current WBS 3.5 provider and lead acceptance remain pending.' },
  { id: 'hosted-controls-pending', passed: devsecops.schemaVersion === 3 && devsecops.hostedCiCertified === false && environment.schemaVersion === 3 && environment.environmentProvisioned === false && environment.recoveryTargetsProven === false, detail: 'Current WBS 3.6–3.7 hosted controls and exercises remain pending.' },
  { id: 'reject-defer-no-authority', passed: review.includes('Reject / Defer') && decisions.includes('entry locked') && legacyApproval.includes('Automation cannot sign or override this decision'), detail: 'The gate remains rejected/deferred, unsigned and authority-free.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Engineering foundation gate verification failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = ids('FGB', 10).map((id) => {
  const parts = review.split('\n').find((line) => line.startsWith(`| ${id} |`)).split('|');
  return { id, severity: parts[2].trim(), summary: parts[3].trim(), status: 'Open' };
});
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 3.8 current Engineering Foundation Gate evidence only',
  localControls: 'PASS / qualified hydrated evidence',
  readinessDecision: 'Reject / Defer — Predecessor, Hosted Certification and Accountable Engineering Approval Pending',
  gateAccepted: false,
  exceptionApproved: false,
  entryLocked: true,
  componentAcceptanceRecorded: false,
  engineeringLeadApprovalRecorded: false,
  waveC2Authorized: false,
  providerContactAuthorized: false,
  providerCommitmentAuthorized: false,
  procurementAuthorized: false,
  productionProvisioningAuthorized: false,
  secretCreationAuthorized: false,
  externalConnectivityAuthorized: false,
  deploymentAuthorized: false,
  publicLaunchAuthorized: false,
  externalUserAuthorityCreated: false,
  fundedBrokerageAuthorized: false,
  paperTrialAuthorized: false,
  pilotAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  inventory: {
    criteria: 14,
    checks: checks.length,
    blockers: blockers.length,
    decisions: 10,
    approvalFields: 8,
    artifacts: artifacts.length,
    currentComponentManifests: 7,
  },
  checks,
  blockers,
  artifacts,
};
const directory = path.join(root, 'outputs/engineering-foundation-gate-readiness');
await mkdir(directory, { recursive: true });
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(directory, 'current-readiness-manifest.json'), serialized, 'utf8');
await writeFile(path.join(directory, 'readiness-manifest.json'), serialized, 'utf8');
console.log(`Engineering Foundation Gate remains Reject / Defer: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} open blockers; entry lock remains set and no Wave C2, provider, provisioning, publication, paper, pilot or live authority was created.`);
