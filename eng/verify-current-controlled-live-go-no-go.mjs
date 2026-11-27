import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/engineering/CURRENT_CONTROLLED_LIVE_GO_NO_GO_GATE_REVIEW.md',
  'docs/engineering/CURRENT_CONTROLLED_LIVE_GO_NO_GO_GATE_DECISION_REGISTER.md',
  'docs/engineering/CURRENT_CONTROLLED_LIVE_GO_NO_GO_GATE_EVIDENCE_INDEX.md',
  'outputs/paper-trading-gate/current-readiness-manifest.json',
  'outputs/operational-readiness/current-readiness-manifest.json',
  'outputs/independent-security/current-readiness-manifest.json',
  'outputs/compliance-evidence/current-readiness-manifest.json',
  'outputs/controlled-live-configuration/current-readiness-manifest.json',
  'docs/engineering/CONTROLLED_LIVE_GO_NO_GO_CURRENT_REVIEW.md',
  'docs/engineering/CONTROLLED_LIVE_GO_NO_GO_CURRENT_DECISION_REGISTER.md',
];
const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));

const review = contents.get(evidenceFiles[0]);
const decisions = contents.get(evidenceFiles[1]);
const index = contents.get(evidenceFiles[2]);
const paper = JSON.parse(contents.get(evidenceFiles[3]));
const operations = JSON.parse(contents.get(evidenceFiles[4]));
const security = JSON.parse(contents.get(evidenceFiles[5]));
const compliance = JSON.parse(contents.get(evidenceFiles[6]));
const configuration = JSON.parse(contents.get(evidenceFiles[7]));
const priorReview = contents.get(evidenceFiles[8]);
const priorDecisions = contents.get(evidenceFiles[9]);
const ids = (prefix, count) => Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`);
const decision = 'Reject / Defer — Mandatory Predecessors, Immutable Scope and Accountable Authorization Pending';
const checks = [
  ['criteria-inventory', ids('GNC', 15).every((id) => review.includes(`| ${id} |`)) && (review.match(/^\| GNC-\d{2} \|/gm) ?? []).length === 15, 'Exactly GNC-01 through GNC-15 are evaluated.'],
  ['criteria-outcomes', (review.match(/^\| GNC-\d{2} \|[^\n]+\| Fail \|/gm) ?? []).length === 14 && review.includes('| GNC-15 |') && review.includes('Summary: **0 LocalPass / 0 Conditional / 14 Fail / 1 Pending**'), 'Fourteen criteria Fail, one remains Pending and no criterion passes.'],
  ['critical-blockers', ids('GNB', 10).every((id) => review.includes(`| ${id} | Critical |`)) && (review.match(/^\| GNB-\d{2} \| Critical \|/gm) ?? []).length === 10, 'Exactly ten Critical blockers remain open.'],
  ['exit-and-boundary', (review.match(/^\d+\. /gm) ?? []).length === 14 && review.includes('creates no exception, deployment, environment, account, credential, provider/broker connection, entry-lock clearance, pilot authorization, capital allocation, broker order, continuation or live-trading authority.'), 'Fourteen exit steps are defined and no authority is created.'],
  ['decision-register', ids('GND', 10).every((id) => decisions.includes(`| ${id} |`)) && (decisions.match(/^\| GND-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 10, 'All ten accountable decisions remain Pending.'],
  ['scope-and-approvals', ids('GNS', 8).every((id) => decisions.includes(`| ${id} |`)) && ids('GNA', 9).every((id) => decisions.includes(`| ${id} |`)) && (decisions.match(/^\| GNS-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 8 && (decisions.match(/^\| GNA-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 9, 'Eight immutable scope fields and nine approvals remain Pending.'],
  ['evidence-index', ids('GNE', 10).every((id) => index.includes(`| ${id} |`)) && (index.match(/^\| GNE-\d{2} \|/gm) ?? []).length === 10, 'The evidence index contains exactly ten governed entries.'],
  ['paper-rejected', paper.gateAccepted === false && paper.paperCertificationCreated === false && paper.controlledLivePreparationAuthorized === false && paper.liveTradingAuthorityCreated === false, 'Current paper certification is rejected/deferred and creates no authority.'],
  ['operations-rejected', operations.gateAccepted === false && operations.entryLockCleared === false, 'Current operational readiness is rejected/deferred and entry-locked.'],
  ['security-unexecuted', security.assessmentExecuted === false && security.securityAccepted === false && security.entryLockCleared === false, 'Independent security remains unexecuted and unaccepted.'],
  ['compliance-unapproved', compliance.qualifiedReviewExecuted === false && compliance.approvalSigned === false && compliance.gateAccepted === false, 'Qualified compliance review and accountable approval remain absent.'],
  ['configuration-disabled', configuration.configurationApplied === false && configuration.environmentCreated === false && configuration.entryLockCleared === false && configuration.pilotCapitalAuthorized === false, 'Controlled-live configuration remains disabled and entry-locked.'],
  ['prior-review-retained', (priorReview.match(/^\| GNG-\d{2} \|[^\n]+\| Fail \|/gm) ?? []).length === 11 && priorReview.includes('| GNG-12 |') && priorReview.includes('| Pending |') && priorDecisions.includes('Pending'), 'Prior negative gate evidence remains traceable.'],
  ['immutable-limits-absent', review.includes('Capital and hard risk limits remain null/unapproved.') && review.includes('Immutable release/environment/account/participant/time/limit scope is unbound.'), 'Immutable pilot scope and non-null hard limits are absent.'],
  ['reject-defer-consistent', review.includes(`Decision: **${decision}**`) && decisions.includes('Status: Reject / Defer mandatory'), 'The review and decision register consistently require Reject/Defer.'],
  ['non-waivable-fail-closed', review.includes('Conditions cannot waive segregation, authorization, centralized hard limits, entry lock, idempotency, reconciliation, audit, Critical/High remediation or qualified legal authority.') && review.includes('Stale, missing, conflicting or unverified evidence fails closed.'), 'Mandatory controls remain non-waivable and evidence failures fail closed.'],
].map(([id, passed, detail]) => ({ id, passed, detail }));

const failed = checks.filter(({ passed }) => !passed);
if (failed.length) throw new Error(`Current controlled-live go/no-go verification failed: ${failed.map(({ id }) => id).join(', ')}`);

const blockers = ids('GNB', 10).map((id) => {
  const line = review.split('\n').find((value) => value.startsWith(`| ${id} |`));
  return { id, severity: 'Critical', status: 'Open', finding: line.split('|')[3].trim() };
});
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 9.4 current controlled-live go/no-go evidence',
  readinessDecision: decision,
  localReviewControls: 'PASS',
  gateAccepted: false,
  exceptionApproved: false,
  deploymentAuthorized: false,
  environmentAuthorized: false,
  accountAuthorized: false,
  credentialCreationAuthorized: false,
  providerBrokerConnectionAuthorized: false,
  entryLockCleared: false,
  pilotAuthorized: false,
  capitalAuthorized: false,
  brokerOrdersAuthorized: false,
  continuationAuthorized: false,
  liveTradingAuthorityCreated: false,
  inventory: { decisionCriteria: 15, failedCriteria: 14, pendingCriteria: 1, criticalBlockers: 10, pendingDecisions: 10, pendingScopeFields: 8, pendingApprovals: 9, exitSteps: 14 },
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/controlled-live-go-no-go'), { recursive: true });
await writeFile(path.join(root, 'outputs/controlled-live-go-no-go/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Current controlled-live go/no-go verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} Critical blockers; Reject/Defer and no deployment, pilot, capital, order or live authority.`);
