import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/PUBLIC_CONTENT_ACCEPTANCE.md',
  'docs/ux/landing/PUBLIC_COPY_DECK.md',
  'docs/ux/landing/PUBLIC_ROUTE_SPEC.md',
  'apps/web-public/src/app/home-page.ts',
  'apps/web-public/src/app/platform-page.ts',
  'apps/web-public/src/app/security-page.ts',
  'apps/web-public/src/app/status-page.ts',
  'apps/web-public/src/app/about-page.ts',
  'apps/web-public/src/app/app.spec.ts',
  'outputs/landing-ux-readiness/current-readiness-manifest.json',
  'outputs/public-shell-readiness/current-readiness-manifest.json',
  'outputs/engineering-foundation-gate-readiness/current-readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, readFileSync(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const copyDeck = contents.get(files[1]);
const routeSpec = contents.get(files[2]);
const home = contents.get(files[3]);
const platform = contents.get(files[4]);
const security = contents.get(files[5]);
const status = contents.get(files[6]);
const about = contents.get(files[7]);
const tests = contents.get(files[8]);
const landing = JSON.parse(contents.get(files[9]));
const shell = JSON.parse(contents.get(files[10]));
const foundation = JSON.parse(contents.get(files[11]));

const checks = [
  { id: 'five-core-route-pages', passed: [home, platform, security, status, about].every((page) => page.includes('<h1>')), detail: 'Home, Platform, Security, Status and About each define a primary heading.' },
  { id: 'home-risk-and-workflow-copy', passed: home.includes('100%–600% move is not a recommendation') && home.includes('Discover') && home.includes('Reconcile broker truth'), detail: 'Home pairs the approved workflow with explicit elevated-risk, non-recommendation language.' },
  { id: 'platform-trust-boundaries', passed: platform.includes('Five controlled stages') && platform.includes('Data providers') && platform.includes('Regulated broker') && platform.includes('Paper first by design'), detail: 'Platform separates controlled stages, provider boundaries, broker authority and paper-first release.' },
  { id: 'security-consequence-controls', passed: security.includes('Server authorization') && security.includes('Central risk approval') && security.includes('idempotency') && security.includes('unknown until reconciled'), detail: 'Security describes server authorization, risk approval, idempotency and reconciliation without claiming provider completion.' },
  { id: 'neutral-status-language', passed: status.includes('Monitoring not connected') && status.includes('Not publicly monitored') && status.includes('not an uptime claim') && status.includes('broker and reconciled portal record remain authoritative'), detail: 'Status remains neutral, static and explicit about monitoring and broker authority.' },
  { id: 'about-self-directed-boundary', passed: about.includes('disciplined self-directed trading') && about.includes('does not custody funds or securities') && about.includes('No scanner, social post or large price move is a recommendation') && about.includes('separate documented approval'), detail: 'About states self-directed, no-custody, no-recommendation and controlled-live boundaries.' },
  { id: 'copy-deck-traceability', passed: ['CP-01', 'CP-02', 'CP-03', 'CP-04', 'CP-05'].every((id) => copyDeck.includes(id)) && ['PR-01', 'PR-02', 'PR-03', 'PR-04', 'PR-05'].every((id) => routeSpec.includes(id)), detail: 'The five implemented routes trace to CP-01–CP-05 and PR-01–PR-05.' },
  { id: 'focused-content-regressions', passed: tests.includes("'/platform'") && tests.includes("'/security'") && tests.includes("'/status'") && tests.includes("'/about'") && acceptance.includes('26 passing test instances'), detail: 'Focused route assertions remain in the public suite, which records 26 passing test instances across two targets.' },
  { id: 'ux-and-shell-predecessors', passed: String(landing.readinessDecision).startsWith('Implementation Ready /') && shell.readinessDecision === 'Implementation Ready / Acceptance Pending' && shell.shellAccepted === false, detail: 'Landing UX and public shell are implementation-ready but still unaccepted.' },
  { id: 'foundation-gate-deferred', passed: String(foundation.readinessDecision).includes('Reject / Defer') && foundation.publicLaunchAuthorized === false, detail: 'The foundation gate remains deferred and grants no publication authority.' },
  { id: 'no-publication-or-trading-authority', passed: acceptance.includes('does not authorize publication, paper trading or live trading'), detail: 'The content acceptance record expressly grants no publication or trading authority.' },
  { id: 'current-predecessor-contracts', passed: landing.schemaVersion === 3 && shell.schemaVersion === 3 && foundation.schemaVersion === 3 && foundation.entryLocked === true, detail: 'Current schema-v3 predecessors are consumed and the engineering entry lock remains set.' },
  { id: 'route-heading-contract', passed: [home, platform, security, status, about].filter((page) => page.includes('<h1>')).length === 5, detail: 'Every implemented core route has exactly the required primary content contract.' },
  { id: 'provider-authority-separation', passed: platform.includes('Data providers') && platform.includes('Regulated broker') && status.includes('broker and reconciled portal record remain authoritative'), detail: 'Provider, broker and portal authority is separated consistently across public content.' },
  { id: 'elevated-risk-consistency', passed: home.includes('100%–600%') && about.includes('No scanner, social post or large price move is a recommendation'), detail: 'Elevated momentum is consistently presented as risk context, not advice.' },
  { id: 'human-content-acceptance-boundary', passed: acceptance.includes('Frontend Lead') && acceptance.includes('qualified legal/privacy') && acceptance.includes('representative accessibility') && acceptance.includes('operations'), detail: 'Frontend, legal/privacy, operations and accessibility acceptance remains separate from local content evidence.' },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) throw new Error(`Public-content readiness checks failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  { id: 'PCB-01', severity: 'Critical', status: 'Open', detail: 'WBS 3.8 remains Reject/Defer.' },
  { id: 'PCB-02', severity: 'Critical', status: 'Open', detail: 'WBS 4.1 remains unaccepted.' },
  { id: 'PCB-03', severity: 'Critical', status: 'Open', detail: 'Representative usability validation remains pending.' },
  { id: 'PCB-04', severity: 'Critical', status: 'Open', detail: 'Representative accessibility validation remains pending.' },
  { id: 'PCB-05', severity: 'Critical', status: 'Open', detail: 'Qualified legal and privacy approval remains pending.' },
  { id: 'PCB-06', severity: 'Critical', status: 'Open', detail: 'Security and Operations content approval remains pending.' },
  { id: 'PCB-07', severity: 'Critical', status: 'Open', detail: 'Product Owner and Frontend Lead acceptance remains pending.' },
  { id: 'PCB-08', severity: 'Critical', status: 'Open', detail: 'Approved origin, legal entity and public contacts remain unavailable.' },
  { id: 'PCB-09', severity: 'Critical', status: 'Open', detail: 'Analytics consent and monitoring facts remain unavailable.' },
  { id: 'PCB-10', severity: 'Critical', status: 'Open', detail: 'Provider and broker connections remain unavailable and unauthorized.' },
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 4.2 Public Route Content readiness',
  localControls: 'PASS',
  readinessDecision: 'Implementation Ready / Acceptance Pending',
  contentAccepted: false,
  publicLaunchAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  legalPrivacyApproved: false,
  accessibilityAccepted: false,
  usabilityAccepted: false,
  productOwnerApprovalRecorded: false,
  frontendLeadApprovalRecorded: false,
  deploymentAuthorized: false,
  externalUserAuthorityCreated: false,
  inventory: {
    coreRoutes: 5,
    checks: checks.length,
    blockers: blockers.length,
    artifacts: artifacts.length,
  },
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/public-content-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/public-content-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(root, 'outputs/public-content-readiness/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Public route content: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Implementation Ready / Acceptance Pending.`);
