import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/closure/CURRENT_PROJECT_CLOSURE_GATE_REVIEW.md',
  'docs/closure/CURRENT_PROJECT_CLOSURE_GATE_DECISION_REGISTER.md',
  'docs/closure/RESIDUAL_BACKLOG_AND_LESSONS.md',
  'docs/closure/PROJECT_COMPLETION_STATUS.md',
  'outputs/controlled-live-pilot/current-readiness-manifest.json',
  'outputs/controlled-live-go-no-go/current-readiness-manifest.json',
  'outputs/operational-readiness/current-readiness-manifest.json',
  'outputs/paper-trading-gate/current-readiness-manifest.json',
  'docs/closure/CURRENT_PROJECT_CLOSURE_REVIEW.md',
  'docs/closure/CURRENT_TRANSITION_DECISION_REGISTER.md',
];
const contents = new Map();
for (const file of evidenceFiles) contents.set(file, await readFile(path.join(root, file), 'utf8'));
const review = contents.get(evidenceFiles[0]);
const decisions = contents.get(evidenceFiles[1]);
const backlog = contents.get(evidenceFiles[2]);
const completion = contents.get(evidenceFiles[3]);
const pilot = JSON.parse(contents.get(evidenceFiles[4]));
const gate = JSON.parse(contents.get(evidenceFiles[5]));
const operations = JSON.parse(contents.get(evidenceFiles[6]));
const paper = JSON.parse(contents.get(evidenceFiles[7]));
const priorReview = contents.get(evidenceFiles[8]);
const priorDecisions = contents.get(evidenceFiles[9]);
const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`);
const decision = 'Reject / Defer — Product Acceptance, Transition Ownership, Evidence Custody and Mandatory Gate Closure Pending';
const checks = [
  ['criteria-inventory', ids('CLC', 15).every((id) => review.includes(`| ${id} |`)) && (review.match(/^\| CLC-\d{2} \|/gm) ?? []).length === 15, 'Exactly CLC-01 through CLC-15 are evaluated.'],
  ['criteria-results', (review.match(/^\| CLC-\d{2} \|[^\n]+\| Fail \|/gm) ?? []).length === 9 && (review.match(/^\| CLC-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 6 && review.includes('Summary: **0 LocalPass / 0 Conditional / 9 Fail / 6 Pending**'), 'Nine criteria Fail and six remain Pending; none passes.'],
  ['package-counts', review.includes('70 total / 6 Complete / 64 In Progress') && review.includes('90.8633%'), 'The gate uses current package counts and weighted progress.'],
  ['critical-blockers', ids('CLB', 10).every((id) => review.includes(`| ${id} | Critical | Open |`)) && (review.match(/^\| CLB-\d{2} \| Critical \| Open \|/gm) ?? []).length === 10, 'Exactly ten Critical/Open blockers remain.'],
  ['decisions-pending', ids('CLD', 10).every((id) => decisions.includes(`| ${id} |`)) && (decisions.match(/^\| CLD-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 10, 'All ten closure decisions remain Pending.'],
  ['scope-pending', ids('CLS', 10).every((id) => decisions.includes(`| ${id} |`)) && (decisions.match(/^\| CLS-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 10, 'All ten immutable transition fields remain Pending.'],
  ['ownership-pending', ids('CLO', 11).every((id) => decisions.includes(`| ${id} |`)) && (decisions.match(/^\| CLO-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 11, 'All eleven ownership areas remain Pending.'],
  ['approvals-pending', ids('CLA', 9).every((id) => decisions.includes(`| ${id} |`)) && (decisions.match(/^\| CLA-\d{2} \|[^\n]+\| Pending \|/gm) ?? []).length === 9, 'All nine accountable approvals remain Pending.'],
  ['backlog-lessons', (backlog.match(/^\| (?:Critical|High) \|/gm) ?? []).length === 10 && (backlog.match(/^\d+\. /gm) ?? []).length === 8, 'Ten residual-backlog themes and eight lessons are retained.'],
  ['pilot-do-not-start', pilot.readinessDecision.startsWith('DO NOT START') && pilot.pilotReady === false && pilot.pilotAuthorized === false && pilot.pilotExecuted === false && pilot.resultsRecorded === false && pilot.continuationAuthorized === false && pilot.liveTradingAuthorityCreated === false, 'Current WBS 9.5 remains unready, unauthorized and unexecuted.'],
  ['go-no-go-rejected', gate.readinessDecision.startsWith('Reject / Defer') && gate.gateAccepted === false && gate.entryLockCleared === false && gate.pilotAuthorized === false && gate.capitalAuthorized === false && gate.brokerOrdersAuthorized === false, 'Current WBS 9.4 remains rejected and entry-locked.'],
  ['operations-paper-rejected', operations.gateAccepted === false && operations.entryLockCleared === false && paper.gateAccepted === false && paper.paperCertificationCreated === false, 'Operational readiness and paper certification remain rejected/deferred.'],
  ['prior-negative-records', priorReview.includes('six Fail and four Pending') && priorDecisions.includes('Reject / Defer closure') && completion.includes('Reject/Defer project closure and product acceptance'), 'Prior negative closure records remain traceable.'],
  ['non-waivable', review.includes('Exceptions cannot waive mandatory gates') && review.includes('Missing, stale, conflicting, unverified or revoked evidence preserves Reject/Defer.'), 'Closure controls remain non-waivable and fail closed.'],
  ['exit-sequence', (review.match(/^\d+\. /gm) ?? []).length === 14, 'Fourteen closure exit steps are defined.'],
  ['authority-boundary', review.includes('creates no product acceptance, exception, scope waiver, project closure, ownership/liability transfer, operational handover, publication, archive deletion, entry-lock clearance, paper authorization, pilot authorization, capital allocation, broker order or live-trading authority.'), 'The gate creates no acceptance, transfer, closure or trading authority.'],
].map(([id, passed, detail]) => ({ id, passed, detail }));
const failed = checks.filter(({ passed }) => !passed);
if (failed.length) throw new Error(`Current project closure gate verification failed: ${failed.map(({ id }) => id).join(', ')}`);
const blockers = ids('CLB', 10).map((id) => { const line = review.split('\n').find((value) => value.startsWith(`| ${id} |`)); return { id, severity: 'Critical', status: 'Open', finding: line.split('|')[4].trim() }; });
const artifacts = evidenceFiles.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 3, generatedAt: new Date().toISOString(), scope: 'WBS 9.6 current project closure gate evidence', readinessDecision: decision,
  localTransitionBaselinePrepared: true, productAccepted: false, projectClosed: false, exceptionApproved: false, scopeWaived: false, ownershipTransferred: false, liabilityTransferred: false, operationalHandoverAccepted: false, servicePublished: false, archiveDeletionAuthorized: false, entryLockCleared: false, paperTradingAuthorized: false, pilotAuthorized: false, capitalAuthorized: false, brokerOrdersAuthorized: false, liveTradingAuthorized: false,
  inventory: { workPackages: 70, complete: 6, inProgress: 64, criteria: 15, failedCriteria: 9, pendingCriteria: 6, criticalBlockers: 10, pendingDecisions: 10, pendingTransitionScopeFields: 10, pendingOwnershipAreas: 11, pendingApprovals: 9, residualBacklogThemes: 10, lessons: 8, exitSteps: 14 },
  checks, blockers, artifacts,
};
await mkdir(path.join(root, 'outputs/project-closure'), { recursive: true });
await writeFile(path.join(root, 'outputs/project-closure/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Current project closure gate verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} Critical blockers; Reject/Defer and no acceptance, transfer, closure, publication or trading authority.`);
