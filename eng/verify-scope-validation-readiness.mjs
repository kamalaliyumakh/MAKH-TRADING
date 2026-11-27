import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/discovery/SCOPE_BASELINE.md',
  'docs/discovery/REQUIREMENTS_TRACEABILITY.md',
  'docs/discovery/SCOPE_APPROVAL.md',
  'docs/discovery/README.md',
  'outputs/integrated-plan-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const scope = contents.get(evidenceFiles[0]);
const traceability = contents.get(evidenceFiles[1]);
const approval = contents.get(evidenceFiles[2]);
const readme = contents.get(evidenceFiles[3]);
const predecessor = JSON.parse(contents.get(evidenceFiles[4]));

const scopeSections = scope.match(/^## \d+\. /gm) ?? [];
const roleRows = scope.split('## 3. MVP users and permissions')[1]?.split('## 4. Functional scope')[0]?.split('\n').filter((line) => /^\| (?:Trader\/account owner|Risk administrator|Operations administrator|Auditor\/compliance reviewer|Developer support|Public visitor) \|/.test(line)) ?? [];
const functionalHeadings = scope.match(/^### (?:Public application|Authenticated portal|Platform services)$/gm) ?? [];
const strategyRows = scope.split('## 5. Trading strategy baseline')[1]?.split('## 6. Risk and execution baseline')[0]?.split('\n').filter((line) => /^\| (?:Universe|Price|Relative volume|Public float|Intraday gain|Catalyst|Liquidity|Exit plan) \|/.test(line)) ?? [];
const riskBullets = scope.split('## 6. Risk and execution baseline')[1]?.split('## 7. Non-functional scope')[0]?.match(/^- /gm) ?? [];
const nonFunctionalBullets = scope.split('## 7. Non-functional scope')[1]?.split('## 8. Out of scope for MVP')[0]?.match(/^- /gm) ?? [];
const outOfScopeBullets = scope.split('## 8. Out of scope for MVP')[1]?.split('## 9. Release boundaries')[0]?.match(/^- /gm) ?? [];
const releaseBoundaries = scope.split('## 9. Release boundaries')[1]?.split('## 10. Scope-change triggers')[0]?.match(/^\d+\. /gm) ?? [];
const traceabilityRows = traceability.match(/^\| RT-\d{2} \|/gm) ?? [];
const checklistRows = approval.split('## Review checklist')[1]?.split('## Approval')[0]?.split('\n').filter((line) => /^\| [^|-][^|]+ \| Pending \|$/.test(line)) ?? [];
const blankApprovalFields = approval.split('## Approval')[1]?.split('## Local readiness verification')[0]?.split('\n').filter((line) => /_{10,}/.test(line)) ?? [];
const sequential = (prefix, count, width) => Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(width, '0')}`);

const checks = [
  { id: 'ten-scope-sections', passed: scopeSections.length === 10, detail: 'The scope baseline contains exactly ten numbered control sections.' },
  { id: 'six-permission-bounded-roles', passed: roleRows.length === 6, detail: 'Six MVP/public roles have explicit outcomes and permission boundaries.' },
  { id: 'three-functional-surfaces', passed: functionalHeadings.length === 3, detail: 'Public, authenticated portal and platform-service scope are separately defined.' },
  { id: 'eight-strategy-criteria', passed: strategyRows.length === 8, detail: 'Eight strategy criteria preserve the approved low-priced momentum and catalyst boundaries.' },
  { id: 'risk-and-quality-boundaries', passed: riskBullets.length === 7 && nonFunctionalBullets.length === 5, detail: 'Seven execution-risk controls and five non-functional controls are explicit.' },
  { id: 'eight-out-of-scope-items', passed: outOfScopeBullets.length === 8, detail: 'Eight MVP exclusions prevent unauthorized expansion.' },
  { id: 'six-release-boundaries', passed: releaseBoundaries.length === 6 && scope.includes('Passing a prior stage does not automatically authorize the next stage.'), detail: 'Six staged release boundaries prohibit inferred progression or live authority.' },
  { id: 'eighteen-traceability-items', passed: traceabilityRows.length === 18 && sequential('RT-', 18, 2).every((id) => traceability.includes(`| ${id} |`)), detail: 'The baseline contains exactly RT-01 through RT-18.' },
  { id: 'approval-record-pending', passed: checklistRows.length === 8 && blankApprovalFields.length === 4 && approval.includes('Decision: Approve / Approve with recorded changes / Reject') && approval.includes('Status: Awaiting authorized Product Owner signature'), detail: 'Eight decisions and five approval fields remain explicitly unsigned.' },
  { id: 'predecessor-and-authority-boundary', passed: predecessor.planApproved === false && predecessor.sponsorApprovalRecorded === false && predecessor.environmentProvisioningAuthorized === false && predecessor.publicationAuthorized === false && predecessor.liveTradingAuthorized === false && readme.includes('WBS 1.1 remains in progress'), detail: 'WBS 0.2 remains unavailable and no downstream, publication or trading authority is inferred.' },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Scope-validation readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = [
  'WBS 0.2 integrated-plan approval remains unavailable.',
  'The authorized Product Owner identity and authority are not recorded.',
  'All eight scope-review decisions remain Pending.',
  'The approval decision, signature, date and change/decision references remain unsigned.',
  'Legal, broker, vendor, hosting and controlled-live conclusions remain governed by separate discovery and release gates.',
];
const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 1.1 local scope-validation readiness evidence only',
  readinessDecision: 'Prepared / Product Owner Approval Pending',
  scopeApproved: false,
  integratedPlanPredecessorAccepted: false,
  productOwnerApprovalRecorded: false,
  downstreamGateAuthorityCreated: false,
  publicationAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};
const outputDirectory = path.join(root, 'outputs/scope-validation-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Scope validation prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; Product Owner approval remains Pending and no downstream authority created.`);
