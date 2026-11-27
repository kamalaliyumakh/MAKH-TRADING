import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/engineering/CONTROLLED_LIVE_GO_NO_GO_CURRENT_REVIEW.md',
  'docs/engineering/CONTROLLED_LIVE_GO_NO_GO_CURRENT_DECISION_REGISTER.md',
  'docs/engineering/CONTROLLED_LIVE_GO_NO_GO_ACCEPTANCE.md',
  'outputs/paper-trading-gate/local-evidence-manifest.json',
  'outputs/operational-readiness/current-evidence-manifest.json',
  'outputs/independent-security/current-readiness-manifest.json',
  'outputs/compliance-evidence/current-readiness-manifest.json',
  'outputs/controlled-live-configuration/current-readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
const review = contents.get(evidenceFiles[0]);
const decisions = contents.get(evidenceFiles[1]);
const acceptance = contents.get(evidenceFiles[2]);
const paper = JSON.parse(contents.get(evidenceFiles[3]));
const operations = JSON.parse(contents.get(evidenceFiles[4]));
const security = JSON.parse(contents.get(evidenceFiles[5]));
const compliance = JSON.parse(contents.get(evidenceFiles[6]));
const configuration = JSON.parse(contents.get(evidenceFiles[7]));
const ids = (prefix, count) => Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(2, '0')}`);
const decision = 'Reject / Defer — Mandatory Predecessors and Accountable Approval Pending';
const checks = [
  ['twelve-decision-criteria', ids('GNG', 12).every((id) => review.includes(`| ${id} |`)) && (review.match(/^\| GNG-\d{2} \|/gm) ?? []).length === 12, 'Exactly GNG-01 through GNG-12 are evaluated.'],
  ['criterion-outcomes-fail-closed', (review.match(/^\| GNG-\d{2} \|[^\n]+\| Fail \|/gm) ?? []).length === 11 && review.includes('| GNG-12 |') && review.includes('| Pending |'), 'Eleven criteria fail and accountable approval remains Pending.'],
  ['eight-critical-blockers', ids('GNGB', 8).every((id) => review.includes(`| ${id} |`)) && (review.match(/^\| GNGB-\d{2} \|[^\n]+\| Critical \| Open \|/gm) ?? []).length === 8, 'Exactly eight Critical blocker groups remain Open.'],
  ['nine-pending-approvals', (decisions.match(/^\| (?:Sponsor|Product Owner|Risk Owner|Security Lead|Legal\/Compliance|Operations Owner|Engineering Lead|Data Owner|QA Lead) \| Pending \| Pending \| Pending \| Pending \|$/gm) ?? []).length === 9, 'All nine accountable approvals remain Pending.'],
  ['decision-scope-unbound', (decisions.match(/^\| [^|]+ \| Pending \|$/gm) ?? []).length === 7, 'Release, environment, participants, limits, window, stop authority and evidence digest are unbound.'],
  ['reject-defer-consistent', review.includes(`Decision: \`${decision}\``) && decisions.includes(`Decision: \`${decision}\``), 'Review and decision register consistently enforce Reject/Defer.'],
  ['paper-certification-rejected', paper.gateAccepted === false && paper.paperCertificationCreated === false && paper.controlledLivePreparationAuthorized === false && paper.liveTradingAuthorityCreated === false, 'Paper certification and controlled-live preparation remain unavailable.'],
  ['operations-rejected', operations.gateAccepted === false && operations.entryLockCleared === false && operations.createsOperationalAuthority === false, 'Operational readiness remains rejected/deferred.'],
  ['security-unexecuted', security.assessmentExecuted === false && security.securityAccepted === false && security.entryLockCleared === false, 'Independent security remains unexecuted and unaccepted.'],
  ['compliance-unapproved', compliance.qualifiedReviewExecuted === false && compliance.approvalSigned === false && compliance.gateAccepted === false, 'Qualified compliance review and approval remain absent.'],
  ['configuration-disabled', configuration.configurationApplied === false && configuration.environmentCreated === false && configuration.entryLockCleared === false && configuration.pilotCapitalAuthorized === false, 'Controlled-live configuration remains disabled and entry-locked.'],
  ['no-waiver-of-hard-controls', review.includes('A condition cannot waive segregation, authorization, centralized hard limits, entry lock, idempotency, reconciliation, audit, Critical/High security remediation or qualified legal authority.'), 'Mandatory hard controls cannot be waived.'],
  ['immutable-future-decision-scope', review.includes('release/configuration digest, environment, account, participants, capital and risk ceilings, start/end time, stop authority and expiry/review triggers'), 'Any future approval must bind immutable pilot scope.'],
  ['no-pilot-capital-order-authority', review.includes('creates no exception, entry-lock clearance, deployment, pilot, capital, broker-order or live-trading authority.') && acceptance.includes('No go decision, exception, entry-lock clearance, live activation, pilot launch, capital deployment or order authority exists.'), 'The package creates no go decision or trading authority.'],
].map(([id, passed, detail]) => ({ id, passed, detail }));
const failed = checks.filter(({ passed }) => !passed);
if (failed.length) throw new Error(`Controlled-live go/no-go verification failed: ${failed.map(({ id }) => id).join(', ')}`);

const blockers = ids('GNGB', 8).map((id) => {
  const line = review.split('\n').find((value) => value.startsWith(`| ${id} |`));
  return { id, finding: line.split('|')[2].trim(), severity: 'Critical', status: 'Open' };
});
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 9.4 current hydrated controlled-live go/no-go evidence',
  readinessDecision: decision,
  localReviewControls: 'PASS',
  gateAccepted: false,
  entryLockCleared: false,
  exceptionCreated: false,
  deploymentAuthorized: false,
  pilotAuthorized: false,
  capitalAuthorized: false,
  brokerOrdersAuthorized: false,
  createsLiveTradingAuthority: false,
  inventory: { decisionCriteria: 12, criticalBlockers: 8, pendingApprovals: 9, pendingScopeFields: 7 },
  checks,
  blockers,
  artifacts,
};
await mkdir(path.join(root, 'outputs/controlled-live-go-no-go'), { recursive: true });
await writeFile(path.join(root, 'outputs/controlled-live-go-no-go/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Controlled-live go/no-go verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} Critical blockers; Reject/Defer and no pilot, capital, order or live authority.`);
