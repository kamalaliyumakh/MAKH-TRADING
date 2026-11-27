import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/architecture/CURRENT_ARCHITECTURE_UX_GATE_REVIEW.md',
  'docs/architecture/CURRENT_ARCHITECTURE_UX_GATE_DECISION_REGISTER.md',
  'docs/architecture/CURRENT_ARCHITECTURE_UX_GATE_EVIDENCE_INDEX.md',
  'docs/architecture/ARCHITECTURE_CONSISTENCY_MATRIX.md',
  'docs/architecture/SYSTEM_ARCHITECTURE.md',
  'docs/security/THREAT_MODEL.md',
  'docs/data/DATA_INVARIANTS.md',
  'docs/api/openapi.yaml',
  'outputs/discovery-gate-readiness/current-readiness-manifest.json',
  'outputs/landing-ux-readiness/current-readiness-manifest.json',
  'outputs/portal-ux-readiness/current-readiness-manifest.json',
  'outputs/engineering-foundation-gate-readiness/current-readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));

const review = contents.get(evidenceFiles[0]);
const decisions = contents.get(evidenceFiles[1]);
const evidenceIndex = contents.get(evidenceFiles[2]);
const matrix = contents.get(evidenceFiles[3]);
const architecture = contents.get(evidenceFiles[4]);
const threats = contents.get(evidenceFiles[5]);
const invariants = contents.get(evidenceFiles[6]);
const openapi = contents.get(evidenceFiles[7]);
const discovery = JSON.parse(contents.get(evidenceFiles[8]));
const landing = JSON.parse(contents.get(evidenceFiles[9]));
const portal = JSON.parse(contents.get(evidenceFiles[10]));
const foundationGate = JSON.parse(contents.get(evidenceFiles[11]));
const ids = (prefix, count, width = 2) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(width, '0')}`);
const hasInventory = (text, prefix, count, width = 2) => ids(prefix, count, width).every((id) => text.includes(id));
const decisionIncludes = (manifest, value) => String(manifest.readinessDecision ?? '').includes(value);
const apiPaths = openapi.match(/^  \/[^:]+:/gm) ?? [];

const checks = [
  { id: 'current-fourteen-criteria', passed: hasInventory(review, 'AGC', 14) && review.includes('6 LocalPass / 2 Conditional / 5 Fail / 1 Pending'), detail: 'AGC-01–AGC-14 reconcile current local design, predecessors, providers, hosted proof and approval.' },
  { id: 'ten-critical-high-blockers', passed: hasInventory(review, 'AGB', 10) && (review.match(/^\| AGB-\d{2} \| (Critical|High) \|/gm) ?? []).length === 10, detail: 'AGB-01–AGB-10 retain every Critical and High closure condition.' },
  { id: 'preapproval-boundaries', passed: review.includes('## Permitted preparation') && review.includes('## Prohibited inference') && review.includes('synthetic data'), detail: 'Preparation remains local, synthetic and entry-locked.' },
  { id: 'eight-step-exit-sequence', passed: (review.match(/^\d+\. /gm) ?? []).length === 8, detail: 'The package defines an eight-step accountable exit sequence.' },
  { id: 'ten-accountable-decisions', passed: hasInventory(decisions, 'ADD', 10) && (decisions.match(/^\| ADD-\d{2} \| .* \| Pending \|/gm) ?? []).length === 10, detail: 'ADD-01–ADD-10 remain Pending.' },
  { id: 'eight-approval-fields', passed: hasInventory(decisions, 'AAP', 8) && (decisions.match(/^\| AAP-\d{2} \| .* \| Pending \|/gm) ?? []).length === 8, detail: 'AAP-01–AAP-08 define the human approval record.' },
  { id: 'twelve-evidence-items', passed: hasInventory(evidenceIndex, 'AXE', 12), detail: 'AXE-01–AXE-12 identify the current evidence set.' },
  { id: 'eighteen-consistency-rules', passed: hasInventory(matrix, 'ACM', 18) && (matrix.match(/\| Aligned \|$/gm) ?? []).length === 18, detail: 'ACM-01–ACM-18 remain design-aligned.' },
  { id: 'architecture-authority-boundaries', passed: architecture.includes('Domain depends on nothing external') && architecture.includes('PostgreSQL is the only authoritative platform state store') && architecture.includes('server is authoritative'), detail: 'Dependency and authority boundaries remain explicit.' },
  { id: 'security-and-data-invariants', passed: hasInventory(threats, 'TM', 20) && hasInventory(invariants, 'DI', 18, 3), detail: 'Twenty threats and eighteen data invariants remain traceable.' },
  { id: 'api-contract-baseline', passed: openapi.startsWith('openapi: 3.1.0') && openapi.includes('version: 1.0.0-design') && apiPaths.length === 18 && openapi.includes('IdempotencyKey') && openapi.includes('AntiForgery'), detail: 'The eighteen-path OpenAPI 3.1 baseline preserves antiforgery and idempotency.' },
  { id: 'current-discovery-rejected', passed: decisionIncludes(discovery, 'Reject / Defer') && discovery.gateAccepted === false && discovery.downstreamGateAuthorityCreated === false, detail: 'Current WBS 1.7 is rejected/deferred with no downstream authority.' },
  { id: 'landing-ux-not-accepted', passed: decisionIncludes(landing, 'Acceptance Pending') && landing.uxAccepted === false && landing.representativeValidationExecuted === false && landing.accessibilityAccepted === false, detail: 'Landing UX lacks representative-user and accountable human acceptance.' },
  { id: 'portal-ux-not-accepted', passed: decisionIncludes(portal, 'Acceptance Pending') && portal.uxAccepted === false, detail: 'Portal UX lacks accountable human acceptance.' },
  { id: 'foundation-successor-rejected', passed: decisionIncludes(foundationGate, 'Reject') && foundationGate.gateAccepted === false, detail: 'The successor gate cannot supply retroactive acceptance.' },
  { id: 'reject-defer-and-no-authority', passed: review.includes('Reject / Defer') && decisions.includes('downstream authority remains false') && review.includes('creates no authority for foundation-stage promotion'), detail: 'The gate remains rejected/deferred and creates no downstream authority.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Architecture/UX gate verification failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = ids('AGB', 10).map((id) => {
  const parts = review.split('\n').find((line) => line.startsWith(`| ${id} |`)).split('|');
  return { id, severity: parts[2].trim(), summary: parts[3].trim(), status: 'Open' };
});
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 2.8 current Architecture and UX gate evidence only',
  readinessDecision: 'Reject / Defer — Predecessor Acceptance, Hosted Proof and Accountable Architecture Approval Pending',
  gateAccepted: false,
  exceptionApproved: false,
  discoveryGateAccepted: false,
  landingUxAccepted: false,
  portalUxAccepted: false,
  identityArchitectureAccepted: false,
  hostingArchitectureAccepted: false,
  providerArchitectureAccepted: false,
  hostedNonFunctionalEvidenceAccepted: false,
  solutionArchitectApprovalRecorded: false,
  downstreamFoundationAuthorityCreated: false,
  providerContactAuthorized: false,
  providerCommitmentAuthorized: false,
  procurementAuthorized: false,
  productionProvisioningAuthorized: false,
  secretCreationAuthorized: false,
  externalConnectivityAuthorized: false,
  deploymentAuthorized: false,
  publicationAuthorized: false,
  externalUserAuthorityCreated: false,
  fundedBrokerageAuthorized: false,
  paperTrialAuthorized: false,
  pilotAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  inventory: {
    criteria: 14,
    localPass: 6,
    conditional: 2,
    failed: 5,
    pending: 1,
    criticalHighBlockers: 10,
    accountableDecisions: 10,
    approvalFields: 8,
    evidenceItems: 12,
    consistencyRules: 18,
    threats: 20,
    dataInvariants: 18,
    apiPaths: 18,
    exitSteps: 8,
  },
  checks,
  blockers,
  artifacts,
};
const outputDirectory = path.join(root, 'outputs/architecture-ux-gate');
await mkdir(outputDirectory, { recursive: true });
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(outputDirectory, 'current-readiness-manifest.json'), serialized, 'utf8');
await writeFile(path.join(outputDirectory, 'readiness-manifest.json'), serialized, 'utf8');
console.log(`Architecture/UX gate remains Reject / Defer: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} open blockers; no foundation, provider, provisioning, publication, paper, pilot or live authority was created.`);
