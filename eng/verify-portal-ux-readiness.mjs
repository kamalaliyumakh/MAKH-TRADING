import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/ux/portal/PORTAL_ROUTE_SPEC.md',
  'docs/ux/portal/CRITICAL_FLOWS.md',
  'docs/ux/portal/PORTAL_WIREFRAMES.md',
  'docs/ux/portal/INTERACTION_CONTENT.md',
  'docs/ux/portal/PROTOTYPE_ACCEPTANCE.md',
  'docs/uat/AUTHENTICATED_PORTAL_SMOKE_UAT.md',
  'docs/engineering/DASHBOARD_ACCEPTANCE.md',
  'outputs/discovery-gate-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));

const routes = contents.get(evidenceFiles[0]);
const flows = contents.get(evidenceFiles[1]);
const wireframes = contents.get(evidenceFiles[2]);
const interaction = contents.get(evidenceFiles[3]);
const acceptance = contents.get(evidenceFiles[4]);
const smoke = contents.get(evidenceFiles[5]);
const dashboard = contents.get(evidenceFiles[6]);
const discovery = JSON.parse(contents.get(evidenceFiles[7]));
const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`);
const inventory = (text, prefix, count, pattern) => (text.match(pattern) ?? []).length === count && ids(prefix, count).every((id) => text.includes(id));

const routeInventory = inventory(routes, 'PT', 13, /^\| PT-\d{2} \|/gm);
const flowInventory = inventory(flows, 'PF', 10, /^## PF-\d{2} /gm);
const wireframeInventory = inventory(wireframes, 'PW', 7, /^## PW-\d{2} /gm);
const acceptanceRows = acceptance.match(/^\| PA-\d{2} \|/gm) ?? [];
const consequentialActions = interaction.split('## Consequential buttons')[1]?.split('## Order review content')[0]?.match(/^- `/gm) ?? [];
const smokeRoutes = smoke.match(/^\| UAT-PORTAL-\d{2} \|/gm) ?? [];
const scenarioSteps = acceptance.split('## Scenario protocol')[1]?.split('## Acceptance hypotheses')[0]?.match(/^\d+\. /gm) ?? [];
const hypotheses = acceptance.split('## Acceptance hypotheses')[1]?.match(/^- /gm) ?? [];

const checks = [
  { id: 'thirteen-protected-routes', passed: routeInventory && routes.includes('Loading, Ready, Empty, Stale, Degraded, Unauthorized, Error and Recovering'), detail: 'PT-01 through PT-13 and fail-closed route states are defined.' },
  { id: 'ten-critical-flows', passed: flowInventory && flows.includes('Unknown, stale or mismatched state blocks opening/increasing exposure.'), detail: 'PF-01 through PF-10 preserve trading, recovery, administration and audit boundaries.' },
  { id: 'seven-responsive-wireframes', passed: wireframeInventory && wireframes.includes('## Fault-state overlays'), detail: 'PW-01 through PW-07 and fault-state overlays are defined.' },
  { id: 'interaction-and-action-language', passed: consequentialActions.length === 10 && interaction.includes('Do not submit the same intent again') && interaction.includes('Do not announce every quote tick'), detail: 'Ten consequential labels and canonical safety/recovery language are explicit.' },
  { id: 'eight-acceptance-controls', passed: acceptanceRows.length === 8 && ids('PA', 8).every((id) => acceptance.includes(`| ${id} |`)), detail: 'PA-01 through PA-08 preserve review status and accountable evidence.' },
  { id: 'scenario-and-hypothesis-protocol', passed: scenarioSteps.length === 10 && hypotheses.length === 6, detail: 'Ten validation scenarios and six measurable acceptance hypotheses are defined.' },
  { id: 'authenticated-route-corroboration', passed: smokeRoutes.length === 8 && smoke.includes('PASS — all primary authenticated portal routes render after MFA.') && smoke.includes('No paper-trading trial, controlled-live pilot or production release is authorized'), detail: 'Eight authenticated local route checks pass without implying production acceptance.' },
  { id: 'coded-dashboard-corroboration', passed: dashboard.includes('Status: In progress — 96%') && dashboard.includes('entry Locked') && dashboard.includes('All values are synthetic and read-only.'), detail: 'The coded dashboard corroborates the mode, lock and synthetic non-authority contract.' },
  { id: 'predecessor-and-human-acceptance-unavailable', passed: discovery.gateAccepted === false && discovery.readinessDecision === 'Reject/Defer' && acceptance.includes('Pending participant testing') && acceptance.includes('Pending authorized SME acceptance'), detail: 'Discovery, representative-user and Product/Risk acceptance remain unavailable.' },
  { id: 'no-publication-paper-or-live-authority', passed: acceptance.includes('Not authorized; controlled-live gate applies') && smoke.includes('not production acceptance') && discovery.publicationAuthorityCreated === false && discovery.liveTradingAuthorityCreated === false, detail: 'No publication, production, paper-trial or live-trading authority is inferred.' },
];
const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) throw new Error(`Portal UX readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);

const blockers = [
  'WBS 1.7 Discovery Gate remains Reject/Defer.',
  'Representative-user scenario execution, observations and defect disposition remain incomplete.',
  'Authorized Product and Risk SME review/sign-off remains unavailable.',
  'Manual keyboard, screen-reader, zoom/reflow and accountable accessibility acceptance remain pending.',
  'Provider-backed identity/data and broker/risk/reconciliation authority are unavailable; paper trial, production and live use remain unauthorized.',
];
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 2.7 local authenticated portal UX readiness evidence only',
  readinessDecision: 'Implementation Ready / Acceptance Pending',
  uxAccepted: false,
  representativeValidationExecuted: false,
  productRiskApprovalRecorded: false,
  accessibilityAccepted: false,
  productionAccepted: false,
  paperTrialAuthorized: false,
  publicationAuthorized: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};
const outputDirectory = path.join(root, 'outputs/portal-ux-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Portal UX prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; acceptance remains Pending and no production, paper-trial or live authority created.`);
