import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/ux/landing/PUBLIC_ROUTE_SPEC.md',
  'docs/ux/landing/LANDING_WIREFRAMES.md',
  'docs/ux/landing/PUBLIC_COPY_DECK.md',
  'docs/ux/landing/SEO_ACCESSIBILITY.md',
  'docs/ux/landing/REVIEW_PACK.md',
  'docs/engineering/PUBLIC_SHELL_ACCEPTANCE.md',
  'outputs/discovery-gate-readiness/readiness-manifest.json',
  'outputs/legal-discovery-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));

const routes = contents.get(evidenceFiles[0]);
const wireframes = contents.get(evidenceFiles[1]);
const copy = contents.get(evidenceFiles[2]);
const seo = contents.get(evidenceFiles[3]);
const review = contents.get(evidenceFiles[4]);
const shell = contents.get(evidenceFiles[5]);
const discovery = JSON.parse(contents.get(evidenceFiles[6]));
const legal = JSON.parse(contents.get(evidenceFiles[7]));
const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`);
const exactInventory = (text, prefix, count) => {
  const pattern = new RegExp(`(?:^\\| ${prefix}-\\d{2} \\||^## (?:WF|CP)-\\d{2} )`, 'gm');
  return (text.match(pattern) ?? []).length === count && ids(prefix, count).every((id) => text.includes(id));
};

const metadataRows = seo.split('## Metadata')[1]?.split('## Content and technical SEO')[0]?.split('\n').filter((line) => /^\| `\//.test(line)) ?? [];
const reviewRows = review.match(/^\| LR-\d{2} \|/gm) ?? [];
const usabilityTasks = review.split('## Usability protocol')[1]?.split('Pass hypotheses')[0]?.match(/^\d+\. /gm) ?? [];
const legalChecklist = review.split('## Legal/privacy approval checklist')[1]?.split('## Gate decision')[0]?.match(/^- /gm) ?? [];
const completionConditions = review.split('WBS 2.6 may be marked complete only when:')[1]?.split('Until then')[0]?.match(/^\d+\. /gm) ?? [];

const checks = [
  { id: 'nine-public-routes', passed: exactInventory(routes, 'PR', 9) && routes.includes('Every route defines Loading, Ready and Error states.'), detail: 'PR-01 through PR-09 and their safe route states are defined.' },
  { id: 'nine-responsive-wireframes', passed: exactInventory(wireframes, 'WF', 9) && wireframes.includes('320, 480, 768, 1024 and 1440 CSS px'), detail: 'WF-01 through WF-09 and responsive review points are defined.' },
  { id: 'nine-copy-sections', passed: exactInventory(copy, 'CP', 9) && copy.includes('requires legal, privacy and risk review before publication'), detail: 'CP-01 through CP-09 remain provisional and risk-bounded.' },
  { id: 'nine-metadata-and-accessibility-routes', passed: metadataRows.length === 9 && seo.includes('Automated axe scans plus manual keyboard, screen-reader and zoom testing cover PR-01 through PR-09.'), detail: 'Nine route metadata rows and complete accessibility coverage are specified.' },
  { id: 'eight-review-controls', passed: reviewRows.length === 8 && ids('LR', 8).every((id) => review.includes(`| ${id} |`)), detail: 'LR-01 through LR-08 preserve review status and accountable evidence.' },
  { id: 'usability-legal-and-completion-controls', passed: usabilityTasks.length === 5 && legalChecklist.length === 8 && completionConditions.length === 5, detail: 'Five usability tasks, eight legal/privacy checks and five completion conditions are explicit.' },
  { id: 'coded-shell-corroboration', passed: shell.includes('prerenders `/`, `/platform`, `/security`, `/status`, `/about`, `/legal/risk`, `/privacy`, `/request-access` and `/sign-in`') && shell.includes('All fourteen public-application tests pass') && shell.includes('Status: In progress — 92%'), detail: 'The coded shell corroborates all nine routes and fourteen local tests without claiming publication.' },
  { id: 'predecessors-and-human-validation-unavailable', passed: discovery.gateAccepted === false && discovery.readinessDecision === 'Reject/Defer' && legal.qualifiedReviewExecuted === false && legal.publicationAuthorityCreated === false && review.includes('Pending participant testing'), detail: 'Discovery, legal and representative-user acceptance remain unavailable.' },
  { id: 'no-publication-or-trading-authority', passed: review.includes('not approved for external publication') && shell.includes('No hosting, DNS, analytics, identity provider, broker, market-data provider, user account, paper order or live order is connected or authorized.'), detail: 'No publication, provider, account, paper-order or live-order authority is inferred.' },
];
const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) throw new Error(`Landing UX readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);

const blockers = [
  'WBS 1.7 Discovery Gate remains Reject/Defer.',
  'Representative-user usability testing and disposition remain incomplete.',
  'Qualified legal/privacy/risk approval of provisional copy remains unavailable.',
  'Manual keyboard, screen-reader, zoom/reflow and accountable accessibility acceptance remain pending.',
  'Product Owner and other accountable reviewers have not signed the WBS 2.6 gate.',
];
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 2.6 local landing UX readiness evidence only',
  readinessDecision: 'Implementation Ready / Acceptance Pending',
  uxAccepted: false,
  representativeValidationExecuted: false,
  legalPrivacyCopyApproved: false,
  accessibilityAccepted: false,
  publicationAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};
const outputDirectory = path.join(root, 'outputs/landing-ux-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Landing UX prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; acceptance remains Pending and no publication or trading authority created.`);
