import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/architecture/ARCHITECTURE_GATE_REVIEW.md',
  'docs/architecture/ARCHITECTURE_CONSISTENCY_MATRIX.md',
  'docs/architecture/ARCHITECTURE_GATE_APPROVAL.md',
  'docs/architecture/SYSTEM_ARCHITECTURE.md',
  'docs/security/THREAT_MODEL.md',
  'docs/data/DATA_INVARIANTS.md',
  'docs/api/openapi.yaml',
  'outputs/discovery-gate-readiness/readiness-manifest.json',
  'outputs/landing-ux-readiness/readiness-manifest.json',
  'outputs/portal-ux-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));

const review = contents.get(evidenceFiles[0]);
const matrix = contents.get(evidenceFiles[1]);
const approval = contents.get(evidenceFiles[2]);
const architecture = contents.get(evidenceFiles[3]);
const threats = contents.get(evidenceFiles[4]);
const invariants = contents.get(evidenceFiles[5]);
const openapi = contents.get(evidenceFiles[6]);
const discovery = JSON.parse(contents.get(evidenceFiles[7]));
const landing = JSON.parse(contents.get(evidenceFiles[8]));
const portal = JSON.parse(contents.get(evidenceFiles[9]));
const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`);
const exactInventory = (text, prefix, count, pattern) => (text.match(pattern) ?? []).length === count && ids(prefix, count).every((id) => text.includes(id));

const pendingDecisions = approval.match(/^\| .* \| Pending \|$/gm) ?? [];
const apiPaths = openapi.match(/^  \/[^:]+:/gm) ?? [];
const checks = [
  { id: 'fourteen-gate-criteria', passed: exactInventory(review, 'AG', 14, /^\| AG-\d{2} \|/gm), detail: 'AG-01 through AG-14 cover architecture, security, data/API, hosting, UX, providers and governance.' },
  { id: 'eight-risk-findings', passed: exactInventory(review, 'AF', 8, /^\| AF-\d{2} /gm), detail: 'AF-01 through AF-08 preserve identity, hosting, provider, privacy, UX, performance and governance risks.' },
  { id: 'eighteen-consistency-rules', passed: exactInventory(matrix, 'ACM', 18, /^\| ACM-\d{2} \|/gm) && (matrix.match(/\| Aligned \|$/gm) ?? []).length === 18, detail: 'ACM-01 through ACM-18 remain aligned across architecture, security, data/API and UX.' },
  { id: 'architecture-and-clean-boundaries', passed: architecture.includes('Domain depends on nothing external') && architecture.includes('PostgreSQL is the only authoritative platform state store') && architecture.includes('server is authoritative'), detail: 'System and Clean Architecture authority/dependency boundaries are explicit.' },
  { id: 'security-and-data-invariants', passed: exactInventory(threats, 'TM', 20, /^\| TM-\d{2} \|/gm) && (invariants.match(/^\| DI-\d{3} \|/gm) ?? []).length === 18 && Array.from({ length: 18 }, (_, index) => `DI-${String(index + 1).padStart(3, '0')}`).every((id) => invariants.includes(id)), detail: 'Twenty threats and eighteen data invariants provide cross-cutting safety traceability.' },
  { id: 'api-contract-baseline', passed: openapi.startsWith('openapi: 3.1.0') && openapi.includes('version: 1.0.0-design') && apiPaths.length === 18 && openapi.includes('IdempotencyKey') && openapi.includes('AntiForgery'), detail: 'The OpenAPI 3.1 design baseline exposes eighteen paths with antiforgery and idempotency controls.' },
  { id: 'ten-approval-decisions-pending', passed: pendingDecisions.length === 10 && approval.includes('Status: Awaiting prerequisites and authorized Solution Architect decision') && approval.includes('Codex cannot provide this acceptance'), detail: 'All ten accountable decisions and the Solution Architect signature remain pending.' },
  { id: 'discovery-predecessor-rejected', passed: discovery.readinessDecision === 'Reject/Defer' && discovery.gateAccepted === false && discovery.downstreamGateAuthorityCreated === false, detail: 'WBS 1.7 remains rejected/deferred and creates no downstream authority.' },
  { id: 'ux-predecessors-not-accepted', passed: landing.readinessDecision === 'Implementation Ready / Acceptance Pending' && landing.uxAccepted === false && portal.readinessDecision === 'Implementation Ready / Acceptance Pending' && portal.uxAccepted === false, detail: 'Landing and portal evidence is implementation-ready but lacks human acceptance.' },
  { id: 'reject-defer-and-no-authority', passed: review.includes('Do not sign the architecture gate yet') && review.includes('does not approve production services, provider contracts, real data, public publication, paper operational readiness or live trading') && approval.includes('does not authorize production provisioning, public launch, real-data use, provider purchase, paper certification or live trading'), detail: 'The gate remains Reject/Defer and creates no production, provider, publication, paper or live authority.' },
];
const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) throw new Error(`Architecture/UX gate verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);

const blockers = [
  'WBS 1.7 Discovery Gate remains Reject/Defer and grants no downstream authority.',
  'WBS 2.6 and 2.7 representative-user, Product/Risk, legal/privacy and accountable accessibility acceptance remain unavailable.',
  'Identity, hosting, broker and data-provider selections, contracts, rights and validation remain incomplete.',
  'Retention decisions and hosted performance/recovery evidence remain provisional or unavailable.',
  'All ten approval decisions and the authorized Solution Architect gate record remain unsigned.',
];
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 2.8 local Architecture and UX gate readiness evidence only',
  readinessDecision: 'Reject/Defer',
  gateAccepted: false,
  discoveryGateAccepted: false,
  landingUxAccepted: false,
  portalUxAccepted: false,
  solutionArchitectApprovalRecorded: false,
  downstreamFoundationAuthorityCreated: false,
  productionProvisioningAuthorized: false,
  providerCommitmentAuthorized: false,
  publicationAuthorized: false,
  paperCertificationAuthorized: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};
const outputDirectory = path.join(root, 'outputs/architecture-ux-gate');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Architecture/UX gate prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; decision remains Reject/Defer and no downstream or trading authority created.`);
