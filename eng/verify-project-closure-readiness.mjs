import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/closure/CURRENT_PROJECT_CLOSURE_REVIEW.md',
  'docs/closure/CURRENT_TRANSITION_DECISION_REGISTER.md',
  'docs/closure/RESIDUAL_BACKLOG_AND_LESSONS.md',
  'docs/closure/PROJECT_COMPLETION_STATUS.md',
  'outputs/controlled-live-pilot/current-readiness-manifest.json',
  'outputs/controlled-live-go-no-go/current-readiness-manifest.json',
  'outputs/operational-readiness/current-evidence-manifest.json',
  'outputs/paper-trading-gate/local-evidence-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const review = contents.get(evidenceFiles[0]);
const decisions = contents.get(evidenceFiles[1]);
const backlog = contents.get(evidenceFiles[2]);
const completion = contents.get(evidenceFiles[3]);
const pilot = JSON.parse(contents.get(evidenceFiles[4]));
const goNoGo = JSON.parse(contents.get(evidenceFiles[5]));
const operations = JSON.parse(contents.get(evidenceFiles[6]));
const paperGate = JSON.parse(contents.get(evidenceFiles[7]));

const countRows = (text, pattern) => (text.match(pattern) ?? []).length;
const criterionRows = countRows(review, /^\| CLS-\d{2} \|/gm);
const failRows = countRows(review, /^\| CLS-\d{2} \| [^|]+ \| Fail \|/gm);
const pendingRows = countRows(review, /^\| CLS-\d{2} \| [^|]+ \| Pending \|/gm);
const blockerRows = countRows(review, /^\| CLB-\d{2} \| Critical \| Open \|/gm);
const scopeRows = countRows(decisions, /^\| [^|]+ \| Pending \| [^|]+ \|$/gm);
const ownershipRows = countRows(decisions, /^\| [^|]+ \| [^|]+ \| Pending \|$/gm);
const approvalRows = countRows(decisions, /^\| [^|]+ \| [^|]+ \| Pending \| Pending \| Pending \| Pending \|$/gm);
const backlogRows = countRows(backlog, /^\| (?:Critical|High) \|/gm);
const lessonRows = countRows(backlog, /^\d+\. /gm);
const criterionIds = Array.from({ length: 10 }, (_, index) => `CLS-${String(index + 1).padStart(2, '0')}`);

const checks = [
  {
    id: 'ten-current-closure-criteria',
    passed: criterionRows === 10 && criterionIds.every((id) => review.includes(`| ${id} |`)),
    detail: 'Exactly CLS-01 through CLS-10 are present in the current closure review.',
  },
  {
    id: 'six-fail-four-pending',
    passed: failRows === 6 && pendingRows === 4 && review.includes('No criterion is accepted.'),
    detail: 'The ten closure criteria remain six Fail and four Pending; none is accepted.',
  },
  {
    id: 'actual-work-package-counts',
    passed: review.includes('Total WBS packages: 70.') && review.includes('Complete: 6.') &&
      review.includes('In Progress: 64.') && review.includes('64 of 70 packages remain In Progress'),
    detail: 'The review preserves the current 6 Complete and 64 In Progress counts.',
  },
  {
    id: 'eight-critical-open-blockers',
    passed: blockerRows === 8,
    detail: 'Exactly eight Critical/Open closure blocker groups remain.',
  },
  {
    id: 'ten-pending-transition-scope-fields',
    passed: scopeRows === 10,
    detail: 'Exactly ten immutable transition-scope fields remain Pending.',
  },
  {
    id: 'eleven-pending-ownership-areas',
    passed: ownershipRows === 11,
    detail: 'Exactly eleven transition ownership areas remain Pending.',
  },
  {
    id: 'nine-pending-closure-approvals',
    passed: approvalRows === 9,
    detail: 'Exactly nine accountable closure approvals remain Pending and unsigned.',
  },
  {
    id: 'residual-backlog-and-lessons',
    passed: backlogRows === 10 && lessonRows === 8,
    detail: 'The transition baseline contains ten residual-backlog themes and eight lessons.',
  },
  {
    id: 'pilot-predecessor-do-not-start',
    passed: pilot.readinessDecision.startsWith('DO NOT START') && pilot.pilotReady === false &&
      pilot.pilotAuthorized === false && pilot.pilotExecuted === false && pilot.resultsRecorded === false &&
      pilot.continuationAuthorized === false && pilot.createsLiveTradingAuthority === false,
    detail: 'Current WBS 9.5 remains DO NOT START, unready, unauthorized and unexecuted.',
  },
  {
    id: 'go-no-go-predecessor-rejected',
    passed: goNoGo.readinessDecision.startsWith('Reject / Defer') && goNoGo.gateAccepted === false &&
      goNoGo.pilotAuthorized === false && goNoGo.capitalAuthorized === false &&
      goNoGo.brokerOrdersAuthorized === false && goNoGo.createsLiveTradingAuthority === false,
    detail: 'Current WBS 9.4 remains Reject/Defer and creates no pilot, capital, order or live authority.',
  },
  {
    id: 'operations-predecessor-rejected',
    passed: operations.readinessDecision.startsWith('Reject / Defer') && operations.gateAccepted === false &&
      operations.entryLockCleared === false && operations.createsOperationalAuthority === false &&
      operations.createsLiveAuthority === false,
    detail: 'Current operational readiness remains rejected/deferred and creates no operational or live authority.',
  },
  {
    id: 'paper-certification-unavailable',
    passed: paperGate.readinessDecision.startsWith('Reject / Defer') && paperGate.gateAccepted === false &&
      paperGate.paperCertificationCreated === false && paperGate.liveTradingAuthorityCreated === false,
    detail: 'Paper certification remains rejected/deferred and unavailable.',
  },
  {
    id: 'reject-defer-consistent',
    passed: review.includes('Decision: **Reject / Defer') && decisions.includes('Current decision: **Reject / Defer closure**') &&
      completion.includes('Recommendation: **Reject/Defer project closure and product acceptance.**'),
    detail: 'Current and retained closure records consistently reject/defer acceptance and closure.',
  },
  {
    id: 'no-waiver-handover-closure-or-authority',
    passed: review.includes('does not accept the product, close the project, create an exception, waive scope, clear entry lock') &&
      decisions.includes('cannot accept, sign, waive, transfer, publish, close, authorize trading or attest that ownership has changed') &&
      review.includes('cannot be represented as a completed project'),
    detail: 'The package creates no waiver, acceptance, handover, closure, publication or trading authority.',
  },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Project-closure readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = review
  .split('\n')
  .filter((line) => /^\| CLB-\d{2} \| Critical \| Open \|/.test(line))
  .map((line) => {
    const [, id, severity, state, description] = line.split('|').map((value) => value.trim());
    return { id, severity, state, description };
  });

const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));

const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 9.6 current project-closure and transition readiness evidence only',
  readinessDecision: 'Reject / Defer — Product Acceptance, Transition Ownership and Mandatory Gate Closure Pending',
  inventory: {
    workPackages: 70,
    complete: 6,
    inProgress: 64,
    closureCriteria: criterionRows,
    failedCriteria: failRows,
    pendingCriteria: pendingRows,
    blockers: blockerRows,
    pendingTransitionScopeFields: scopeRows,
    pendingOwnershipAreas: ownershipRows,
    pendingApprovals: approvalRows,
    residualBacklogThemes: backlogRows,
    lessons: lessonRows,
  },
  localTransitionBaselinePrepared: true,
  productAccepted: false,
  projectClosed: false,
  exceptionCreated: false,
  scopeWaived: false,
  ownershipTransferred: false,
  operationalHandoverAccepted: false,
  servicePublished: false,
  entryLockCleared: false,
  paperTradingAuthorized: false,
  pilotAuthorized: false,
  capitalAuthorized: false,
  brokerOrdersAuthorized: false,
  liveTradingAuthorized: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/project-closure');
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'current-readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log(
  `Project-closure readiness verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} Critical blockers; Reject/Defer and no acceptance, handover, closure, publication or trading authority.`,
);
