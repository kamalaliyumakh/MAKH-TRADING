import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/closure/PROJECT_COMPLETION_STATUS.md',
  'docs/closure/TRANSITION_OWNERSHIP_REGISTER.md',
  'docs/closure/RESIDUAL_BACKLOG_AND_LESSONS.md',
  'docs/closure/PROJECT_HANDOVER_AND_CLOSURE_APPROVAL.md',
  'docs/engineering/PROJECT_CLOSURE_ACCEPTANCE.md',
  'outputs/controlled-live-pilot/readiness-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const completion = contents.get(evidenceFiles[0]);
const ownership = contents.get(evidenceFiles[1]);
const backlog = contents.get(evidenceFiles[2]);
const approval = contents.get(evidenceFiles[3]);
const acceptance = contents.get(evidenceFiles[4]);
const pilot = JSON.parse(contents.get(evidenceFiles[5]));

const criterionIds = Array.from({ length: 10 }, (_, index) => `CLS-${String(index + 1).padStart(2, '0')}`);
const criterionRows = completion.match(/^\| CLS-\d{2} \|/gm) ?? [];
const ownershipRows = ownership
  .split('\n')
  .filter((line) => /^\| [^|]+ \| [^|]+ \| [^|]+ \| [^|]+ \| Pending \|$/.test(line));
const backlogRows = backlog.match(/^\| (?:Critical|High) \|/gm) ?? [];
const lessonRows = backlog.match(/^\d+\. /gm) ?? [];
const pendingApprovals = approval.match(/^\| [^|]+ \| Pending \| Pending \| Pending \| Pending \|$/gm) ?? [];

const checks = [
  {
    id: 'ten-completion-criteria',
    passed: criterionRows.length === 10 && criterionIds.every((id) => completion.includes(`| ${id} |`)),
    detail: 'The completion review contains exactly CLS-01 through CLS-10.',
  },
  {
    id: 'actual-work-package-counts',
    passed: completion.includes('6 of 70 WBS packages are Complete and 64 are In Progress') &&
      completion.includes('64 packages remain In Progress'),
    detail: 'The review preserves the current 6 Complete and 64 In Progress counts.',
  },
  {
    id: 'eleven-pending-ownership-areas',
    passed: ownershipRows.length === 11 && ownership.includes('Status: Proposed and unsigned'),
    detail: 'All eleven transition areas remain Pending and unsigned.',
  },
  {
    id: 'residual-backlog-and-lessons',
    passed: backlogRows.length === 10 && lessonRows.length === 8,
    detail: 'The transition baseline contains ten residual-backlog themes and eight lessons.',
  },
  {
    id: 'nine-pending-approvals',
    passed: pendingApprovals.length === 9 && approval.includes('Status: Unsigned — closure and handover not approved'),
    detail: 'All nine accountable handover approvals remain Pending and unsigned.',
  },
  {
    id: 'reject-defer-decision',
    passed: completion.includes('Recommendation: **Reject/Defer project closure and product acceptance.**') &&
      approval.includes('Current recommendation: **Reject/Defer closure; retain artifacts as an incomplete local baseline**'),
    detail: 'Product acceptance and project closure remain Reject/Defer.',
  },
  {
    id: 'pilot-predecessor-unavailable',
    passed: pilot.readinessDecision === 'Do Not Start' && pilot.pilotExecuted === false &&
      pilot.resultsRecorded === false && pilot.gateAccepted === false &&
      pilot.entryLockCleared === false && pilot.createsLiveTradingAuthority === false,
    detail: 'WBS 9.5 remains Do Not Start, unexecuted and without authority.',
  },
  {
    id: 'no-handover-or-trading-authority',
    passed: completion.includes('does not accept the product, close the project') &&
      completion.includes('clear entry lock or authorize paper/live trading') &&
      approval.includes('does not close any WBS package'),
    detail: 'The closure package creates no acceptance, ownership transfer, publication or trading authority.',
  },
  {
    id: 'acceptance-preparation-only',
    passed: acceptance.includes('Status: In progress — 40% transition-package maturity; closure rejected/deferred') &&
      acceptance.includes('does not close the project, accept the product, transfer operational responsibility'),
    detail: 'The acceptance record remains an incomplete transition baseline only.',
  },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Project-closure readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = [
  'Sixty-four of seventy WBS packages remain In Progress.',
  'Mandatory discovery, foundation, public, scanner, portal, paper, operations and live gates are unsigned or rejected/deferred.',
  'Product Owner and Sponsor have not accepted the product or project outcome.',
  'Qualified legal, privacy, broker, provider and data-rights decisions remain incomplete.',
  'Production integrations, deployment, operational ownership and recovery evidence remain incomplete.',
  'Independent security, accessibility, performance and operational assurance remain incomplete.',
  'Paper certification is unavailable and the controlled-live pilot did not execute.',
  'Transition owners, evidence custody, residual backlog disposition and closure signatures remain pending.',
];

const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 9.6 local project-closure readiness evidence only',
  decision: 'Reject/Defer',
  productAccepted: false,
  projectClosed: false,
  ownershipTransferred: false,
  operationalHandoverAccepted: false,
  servicePublished: false,
  entryLockCleared: false,
  paperTradingAuthorized: false,
  liveTradingAuthorized: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/project-closure');
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log(
  `Project-closure readiness prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; Reject/Defer and no acceptance, handover, closure, publication or trading authority created.`,
);
