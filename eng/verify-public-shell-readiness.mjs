import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const textFiles = [
  'docs/engineering/PUBLIC_SHELL_ACCEPTANCE.md',
  'apps/web-public/src/app/app.routes.ts',
  'apps/web-public/src/app/app.routes.server.ts',
  'apps/web-public/src/app/app.ts',
  'apps/web-public/src/app/app.html',
  'apps/web-public/src/app/home-page.ts',
  'apps/web-public/src/app/app.spec.ts',
  'outputs/landing-ux-readiness/current-readiness-manifest.json',
  'outputs/engineering-foundation-gate-readiness/current-readiness-manifest.json',
  'outputs/public-lighthouse/summary.json',
];
const binaryFiles = ['apps/web-public/public/makh-trading-logo.png'];
const contents = new Map();
for (const file of textFiles) contents.set(file, readFileSync(path.join(root, file), 'utf8'));
for (const file of binaryFiles) contents.set(file, readFileSync(path.join(root, file)));

const acceptance = contents.get(textFiles[0]);
const routes = contents.get(textFiles[1]);
const serverRoutes = contents.get(textFiles[2]);
const app = contents.get(textFiles[3]);
const shell = contents.get(textFiles[4]);
const home = contents.get(textFiles[5]);
const tests = contents.get(textFiles[6]);
const landing = JSON.parse(contents.get(textFiles[7]));
const foundation = JSON.parse(contents.get(textFiles[8]));
const lighthouse = JSON.parse(contents.get(textFiles[9]));

const routePaths = [...routes.matchAll(/^    path: '([^']*)',/gm)].map((match) => match[1]);
const expectedRoutes = ['', 'platform', 'security', 'status', 'about', 'legal/risk', 'privacy', 'request-access', 'sign-in'];
const checks = [
  {
    id: 'nine-public-routes',
    passed: expectedRoutes.every((route) => routePaths.includes(route)) && routes.includes("path: '**'"),
    detail: 'All nine approved public routes and the fallback route are declared.',
  },
  {
    id: 'prerender-contract',
    passed: serverRoutes.includes("path: '**'") && serverRoutes.includes('RenderMode.Prerender'),
    detail: 'The public server route contract prerenders the shell.',
  },
  {
    id: 'semantic-shell',
    passed: shell.includes('class="skip-link"') && shell.includes('<header') && shell.includes('<main') && shell.includes('<footer'),
    detail: 'Skip navigation and semantic header, main and footer landmarks are present.',
  },
  {
    id: 'mobile-navigation-accessibility',
    passed: shell.includes('aria-controls="mobile-menu"') && shell.includes('[attr.aria-expanded]') && app.includes("event.key === 'Escape'") && app.includes("getElementById('menu-button')?.focus()"),
    detail: 'The mobile menu exposes state, closes with Escape and restores trigger focus.',
  },
  {
    id: 'persistent-risk-boundary',
    passed: shell.includes('class="risk-disclosure"') && shell.includes('No broker connection or live trading') && home.includes('100%–600% move is not a recommendation'),
    detail: 'Persistent risk language and the elevated-momentum non-recommendation boundary remain visible.',
  },
  {
    id: 'supplied-logo-integration',
    passed: shell.includes('/makh-trading-logo.png') && contents.get(binaryFiles[0]).byteLength > 0,
    detail: 'The supplied MAKH logo is present and referenced by the public shell.',
  },
  {
    id: 'focused-regression-cases',
    passed: (tests.match(/\bit\(/g) ?? []).length === 10 && acceptance.includes('26 passing test instances'),
    detail: 'The shell spec retains ten focused cases; the full public suite records 26 passing test instances across two targets.',
  },
  {
    id: 'landing-ux-predecessor-unaccepted',
    passed: String(landing.readinessDecision).startsWith('Implementation Ready /') && landing.uxAccepted === false,
    detail: 'Landing UX remains implementation-ready but unaccepted.',
  },
  {
    id: 'foundation-gate-deferred',
    passed: String(foundation.readinessDecision).includes('Reject / Defer') && foundation.gateAccepted === false && foundation.publicLaunchAuthorized === false,
    detail: 'The engineering foundation gate remains deferred and public launch remains unauthorized.',
  },
  {
    id: 'lighthouse-local-evidence',
    passed: Array.isArray(lighthouse.results) && lighthouse.results.length >= 3,
    detail: 'Local Lighthouse evidence remains available for the public routes.',
  },
  {
    id: 'no-release-authority',
    passed: acceptance.includes('does not authorize publication, paper trading or live trading'),
    detail: 'The acceptance record expressly grants no publication or trading authority.',
  },
  {
    id: 'current-predecessor-contracts',
    passed: landing.schemaVersion === 3 && foundation.schemaVersion === 3 && foundation.entryLocked === true,
    detail: 'Current schema-v3 Landing UX and Engineering Foundation evidence is consumed with the entry lock set.',
  },
  {
    id: 'anonymous-public-boundary',
    passed: !routePaths.some((route) => route.startsWith('app/') || route.startsWith('admin')),
    detail: 'The anonymous public router exposes no portal or administration route.',
  },
  {
    id: 'logo-accessibility-boundary',
    passed: shell.includes('/makh-trading-logo.png') && shell.includes('alt=""') && shell.includes('class="brand-name"'),
    detail: 'The supplied decorative mark is paired with accessible MAKH Trading text.',
  },
  {
    id: 'local-performance-is-not-release',
    passed: lighthouse.results.length >= 3 && foundation.publicLaunchAuthorized === false,
    detail: 'Local Lighthouse evidence is retained without converting it into publication authority.',
  },
  {
    id: 'acceptance-separation',
    passed: acceptance.includes('Frontend Lead') && acceptance.includes('representative') && acceptance.includes('does not authorize publication'),
    detail: 'Human accessibility, visual and Frontend Lead acceptance remains separate from local implementation evidence.',
  },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) throw new Error(`Public-shell readiness checks failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  { id: 'PSB-01', severity: 'Critical', status: 'Open', detail: 'WBS 3.8 Engineering Foundation Gate remains Reject/Defer.' },
  { id: 'PSB-02', severity: 'Critical', status: 'Open', detail: 'Frontend Lead review and authorized acceptance remain pending.' },
  { id: 'PSB-03', severity: 'Critical', status: 'Open', detail: 'Representative keyboard acceptance remains pending.' },
  { id: 'PSB-04', severity: 'Critical', status: 'Open', detail: 'Representative screen-reader acceptance remains pending.' },
  { id: 'PSB-05', severity: 'Critical', status: 'Open', detail: 'Visual-regression baseline acceptance remains pending.' },
  { id: 'PSB-06', severity: 'Critical', status: 'Open', detail: 'Repeatable standalone production-build evidence remains pending.' },
  { id: 'PSB-07', severity: 'Critical', status: 'Open', detail: 'Hosting and DNS approval remain pending.' },
  { id: 'PSB-08', severity: 'Critical', status: 'Open', detail: 'Analytics and consent approval remain pending.' },
  { id: 'PSB-09', severity: 'Critical', status: 'Open', detail: 'Production identity integration remains unavailable and unauthorized.' },
  { id: 'PSB-10', severity: 'Critical', status: 'Open', detail: 'Broker and market-data providers remain unavailable and unauthorized.' },
];
const files = [...textFiles, ...binaryFiles];
const artifacts = files.map((file) => ({
  path: file,
  sha256: createHash('sha256').update(contents.get(file)).digest('hex'),
}));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 4.1 Public Landing Shell readiness',
  localControls: 'PASS',
  readinessDecision: 'Implementation Ready / Acceptance Pending',
  shellAccepted: false,
  productionBuildRecheckPassed: false,
  testExecutionPassed: true,
  publicLaunchAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  hostingApproved: false,
  dnsApproved: false,
  accessibilityAccepted: false,
  visualBaselineAccepted: false,
  frontendLeadApprovalRecorded: false,
  deploymentAuthorized: false,
  externalUserAuthorityCreated: false,
  inventory: {
    publicRoutes: expectedRoutes.length,
    checks: checks.length,
    blockers: blockers.length,
    artifacts: artifacts.length,
  },
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/public-shell-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/public-shell-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(root, 'outputs/public-shell-readiness/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Public landing shell: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Implementation Ready / Acceptance Pending.`);
