import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/governance/INTEGRATED_DELIVERY_PLAN.md',
  'docs/governance/ENVIRONMENT_AND_PROMOTION_PLAN.md',
  'docs/governance/STATUS_REPORT_TEMPLATE.md',
  'docs/governance/INTEGRATED_PLAN_APPROVAL.md',
  'outputs/charter-readiness/readiness-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));

const plan = contents.get(evidenceFiles[0]);
const environments = contents.get(evidenceFiles[1]);
const report = contents.get(evidenceFiles[2]);
const approval = contents.get(evidenceFiles[3]);
const charter = JSON.parse(contents.get(evidenceFiles[4]));
const waveRows = plan.match(/^\| C[0-7] \|/gm) ?? [];
const environmentRows = plan.split('\n').filter((line) => /^\| (?:Local development|Shared test|Staging|Paper production|Live production) \|/.test(line));
const cadenceRows = plan.split('\n').filter((line) => /^\| (?:Continuous|Daily when active|Weekly|Fortnightly|Monthly|Gate-specific|Incident) \|/.test(line));
const promotionItems = environments.match(/^\d+\. /gm) ?? [];
const pendingApprovalItems = approval.match(/^\| [^|]+ \| Pending \|$/gm) ?? [];

const checks = [
  { id: 'eight-delivery-waves', passed: waveRows.length === 8 && Array.from({ length: 8 }, (_, index) => `| C${index} |`).every((id) => plan.includes(id)), detail: 'The integrated plan contains exactly delivery waves C0 through C7.' },
  { id: 'five-segregated-environments', passed: environmentRows.length === 5 && plan.includes('Production data is not copied into lower environments.'), detail: 'Five environments and the production-data isolation rule are present.' },
  { id: 'seven-reporting-cadences', passed: cadenceRows.length === 7, detail: 'The plan defines exactly seven reporting cadences.' },
  { id: 'seven-promotion-controls', passed: promotionItems.length === 7 && environments.includes('Live configuration is absent by default.'), detail: 'The environment plan contains seven promotion checks and a default-off live boundary.' },
  { id: 'status-and-safety-reporting', passed: ['Not Started', 'In Progress', 'Complete', 'Blocked'].every((status) => plan.includes(`| ${status} |`)) && report.includes('## Safety and authorization statement') && report.includes('## Decisions required'), detail: 'Status definitions, safety reporting and decision escalation are present.' },
  { id: 'six-approval-items-pending', passed: pendingApprovalItems.length === 6 && approval.includes('Status: Awaiting WBS 0.1 completion and Sponsor approval'), detail: 'All six integrated-plan approval items remain Pending.' },
  { id: 'charter-predecessor-unavailable', passed: charter.charterApproved === false && charter.sponsorConfirmed === false && charter.productOwnerConfirmed === false && charter.downstreamGateAuthorityCreated === false, detail: 'WBS 0.1 remains unapproved and creates no downstream gate authority.' },
  { id: 'no-inferred-plan-authority', passed: approval.includes('does not constitute Sponsor approval') && approval.includes('authorize environment provisioning, procurement, publication or live configuration'), detail: 'The package creates no Sponsor, provisioning, procurement, publication or live-configuration authority.' },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) throw new Error(`Integrated-plan readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);

const blockers = [
  'WBS 0.1 charter approval remains unavailable.',
  'Sponsor approval and Product Owner consultation are not recorded.',
  'Staffing, budget, capacity, jurisdiction and vendor assumptions remain unresolved.',
  'All six integrated-plan approval checklist items remain Pending.',
  'No environment provisioning, procurement, publication or live-configuration authority exists.',
];
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 0.2 local integrated-plan readiness evidence only',
  readinessDecision: 'Prepared / Approval Pending',
  planApproved: false,
  charterPredecessorAccepted: false,
  sponsorApprovalRecorded: false,
  environmentProvisioningAuthorized: false,
  procurementAuthorized: false,
  publicationAuthorized: false,
  liveConfigurationAuthorized: false,
  liveTradingAuthorized: false,
  checks,
  blockers,
  artifacts,
};
const outputDirectory = path.join(root, 'outputs/integrated-plan-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Integrated-plan readiness prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; approval remains Pending and no provisioning, procurement, publication, live configuration or live authority created.`);
