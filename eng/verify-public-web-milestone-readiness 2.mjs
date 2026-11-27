import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/PUBLIC_WEB_MILESTONE_REVIEW.md',
  'docs/engineering/PUBLIC_WEB_MILESTONE_APPROVAL.md',
  'eng/verify-public-milestone.mjs',
  'outputs/public-web-milestone/local-evidence-manifest.json',
  'outputs/public-shell-readiness/readiness-manifest.json',
  'outputs/public-content-readiness/readiness-manifest.json',
  'outputs/public-legal-privacy-readiness/readiness-manifest.json',
  'outputs/public-access-request-readiness/readiness-manifest.json',
  'outputs/public-quality-readiness/readiness-manifest.json',
  'docs/engineering/FOUNDATION_GATE_REVIEW.md',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const review = contents.get(files[0]);
const approval = contents.get(files[1]);
const verifier = contents.get(files[2]);
const localManifest = JSON.parse(contents.get(files[3]));
const predecessors = files.slice(4, 9).map((file) => JSON.parse(contents.get(file)));
const foundation = contents.get(files[9]);
const criteria = review.match(/\| PWG-\d{2} /g) ?? [];
const pendingDecisions = approval.match(/\| Pending\s+\|/g) ?? [];

const checks = [
  { id: 'twelve-criterion-review', passed: criteria.length === 12, detail: 'The review contains the complete PWG-01 through PWG-12 decision matrix.' },
  { id: 'current-predecessor-progress', passed: review.includes('WBS 4.1/4.2 at 95%') && review.includes('WBS 4.3 at 90%') && review.includes('WBS 4.4 at 90%') && review.includes('WBS 4.5 at 97%'), detail: 'The milestone review reflects current public-work-package readiness.' },
  { id: 'six-release-blockers', passed: localManifest.blockers?.length === 6 && review.includes('## Release blockers'), detail: 'Six explicit release-blocker categories remain registered.' },
  { id: 'unsigned-accountable-decisions', passed: pendingDecisions.length === 8 && approval.includes('Decision: Approve / Approve with conditions / Reject'), detail: 'Eight accountable decisions remain Pending and the approval record is unsigned.' },
  { id: 'recursive-local-evidence', passed: localManifest.verification?.hashedPrerenderedRoutes === 9 && localManifest.verification?.hashedBrowserArtifacts > 0 && localManifest.verification?.hashedAcceptanceRecords === 5, detail: 'The local manifest hashes nine routes, browser artifacts and five acceptance records.' },
  { id: 'local-quality-boundaries', passed: localManifest.localEvidenceChecksPassed === true && localManifest.verification?.actualZoomAccepted === false && localManifest.verification?.hostedExecutionAccepted === false, detail: 'Local quality checks pass while actual zoom and hosted execution remain unaccepted.' },
  { id: 'predecessor-readiness-decisions', passed: predecessors.every((manifest) => typeof manifest.readinessDecision === 'string' && manifest.checks?.every((check) => check.passed)), detail: 'Every WBS 4.1–4.5 readiness manifest has a passing local control set and explicit decision.' },
  { id: 'predecessors-not-authorized', passed: predecessors.every((manifest) => Object.entries(manifest).some(([key, value]) => key.endsWith('Accepted') && value === false) || manifest.publicLaunchAuthorized === false), detail: 'No public predecessor manifest grants accountable acceptance or launch authority.' },
  { id: 'foundation-gate-rejected', passed: foundation.includes('Reject') && foundation.includes('Defer'), detail: 'The engineering-foundation predecessor remains Reject/Defer.' },
  { id: 'deterministic-milestone-verifier', passed: verifier.includes('releaseAuthorized: false') && verifier.includes('expectedPrerenderedRoutes') && verifier.includes('acceptanceFiles'), detail: 'The recursive milestone verifier hard-codes no release authority and inventories routes and acceptance records.' },
  { id: 'no-publication-or-trading-authority', passed: review.includes('does not authorize a public deployment') && approval.includes('would not authorize broker connectivity, paper trading, live credentials or live trading'), detail: 'The records explicitly deny publication, broker, paper and live-trading authority.' },
  { id: 'reject-defer-decision', passed: review.includes('Reject / Defer — External Acceptance Pending') && localManifest.releaseAuthorized === false, detail: 'The only current milestone decision is Reject/Defer pending external acceptance.' },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Public-web milestone readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'WBS 3.8 and WBS 4.1–4.5 lack authorized accountable acceptance.',
  'Qualified legal/privacy approval and final entity, jurisdiction, contact and retention facts remain unavailable.',
  'Assistive-technology, representative-user, actual 400% zoom and hosted quality evidence remain incomplete.',
  'Approved origin, hosting, DNS, TLS/WAF/security headers, monitoring and recovery evidence remain unavailable.',
  'Production identity and durable access-request storage, abuse controls and notifications remain disabled.',
  'Product, Legal/Privacy, Security, Accessibility, Frontend and Operations signatures remain Pending.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 4.6 Public Web Milestone Gate readiness',
  localControls: 'PASS',
  readinessDecision: 'Reject / Defer — External Acceptance Pending',
  milestoneAccepted: false,
  publicLaunchAuthorized: false,
  personalDataCaptureAuthorized: false,
  analyticsAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/public-web-milestone-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/public-web-milestone-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Public web milestone: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Reject / Defer — External Acceptance Pending.`);
