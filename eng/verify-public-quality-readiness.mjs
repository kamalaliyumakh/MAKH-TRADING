import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/PUBLIC_QUALITY_ACCEPTANCE.md',
  'docs/engineering/PUBLIC_RESPONSIVE_UAT_2026-08-28.md',
  'docs/engineering/PUBLIC_NARROW_ACCESSIBILITY_UAT_2026-08-28.md',
  'docs/engineering/PUBLIC_AXE_COMPONENT_AUDIT_2026-08-28.md',
  'docs/engineering/PUBLIC_CHROMIUM_AXE_ACCEPTANCE_2026-08-28.md',
  'docs/engineering/PUBLIC_PREFERENCE_EMULATION_ACCEPTANCE_2026-08-28.md',
  'docs/engineering/PUBLIC_LIGHTHOUSE_BASELINE_2026-08-28.md',
  'docs/engineering/PUBLIC_LIGHTHOUSE_REMEDIATION_2026-08-30.md',
  'docs/engineering/PUBLIC_QUALITY_REFRESH_2026-09-11.md',
  'eng/verify-public-quality.mjs',
  'apps/web-public/src/styles.scss',
  'apps/web-public/src/app/app.spec.ts',
  'outputs/public-lighthouse/summary.json',
  'outputs/public-shell-readiness/current-readiness-manifest.json',
  'outputs/public-content-readiness/current-readiness-manifest.json',
  'outputs/public-legal-privacy-readiness/current-readiness-manifest.json',
  'outputs/public-access-request-readiness/current-readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, readFileSync(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const responsive = contents.get(files[1]);
const narrow = contents.get(files[2]);
const componentAxe = contents.get(files[3]);
const chromiumAxe = contents.get(files[4]);
const preferences = contents.get(files[5]);
const lighthouseDocs = `${contents.get(files[6])}\n${contents.get(files[7])}\n${contents.get(files[8])}`;
const verifier = contents.get(files[9]);
const styles = contents.get(files[10]);
const tests = contents.get(files[11]);
const lighthouse = JSON.parse(contents.get(files[12]));
const predecessors = files.slice(13).map((file) => JSON.parse(contents.get(file)));

const checks = [
  { id: 'nine-route-deterministic-gate', passed: verifier.includes("const routes = [") && verifier.includes('expected one H1') && verifier.includes('missing description'), detail: 'The deterministic gate covers all public routes, headings and route descriptions.' },
  { id: 'robots-and-social-metadata', passed: verifier.includes("route === 'request-access' || route === 'sign-in'") && verifier.includes('Open Graph') && verifier.includes('Twitter'), detail: 'Sensitive routes are noindex and informational routes require social-summary metadata.' },
  { id: 'origin-dependent-metadata-withheld', passed: verifier.includes('origin-dependent metadata published before approval') && acceptance.includes('Canonical URLs, sitemap') && acceptance.includes('remain absent'), detail: 'Canonical, sitemap, social URL/image and structured data remain withheld pending approved facts.' },
  { id: 'analytics-tracker-lockout', passed: verifier.includes('googletagmanager') && acceptance.includes('No analytics, tag manager, advertising pixel, session replay or tracking integration is present'), detail: 'Known tracker references are rejected and analytics remains disabled.' },
  { id: 'raw-bundle-budgets', passed: verifier.includes('500_000') && verifier.includes('100_000') && verifier.includes('32_000') && acceptance.includes('287,459 bytes') && acceptance.includes('12,058 bytes') && acceptance.includes('18,063 bytes'), detail: 'Current JavaScript, CSS and logo sizes remain below deterministic raw ceilings.' },
  { id: 'responsive-browser-evidence', passed: responsive.includes('Desktop landing page') && responsive.includes('390') && narrow.includes('320') && narrow.includes('no horizontal overflow'), detail: 'Desktop, mobile and 320 CSS-pixel reflow evidence remains recorded.' },
  { id: 'keyboard-focus-evidence', passed: responsive.includes('Escape') && responsive.includes('focus returns to the Menu button') && narrow.includes('route changes continue to focus main content'), detail: 'Mobile-menu, Escape and route-focus behavior is documented and regression-tested.' },
  { id: 'component-axe-evidence', passed: componentAxe.includes('axe-core') && componentAxe.includes('zero violations'), detail: 'The pinned component-DOM axe baseline reports zero violations across nine routes.' },
  { id: 'chromium-axe-evidence', passed: chromiumAxe.includes('18 Chromium axe scans pass') && chromiumAxe.includes('zero violations'), detail: 'Desktop/mobile Chromium axe and contrast scans report zero violations.' },
  { id: 'preference-mode-evidence', passed: preferences.includes('forced-colors') && preferences.includes('reduced-motion') && preferences.includes('Eighteen preference/route combinations passed') && styles.includes('@media (forced-colors: active)') && styles.includes('@media (prefers-reduced-motion: reduce)'), detail: 'Forced-colors and reduced-motion safeguards are implemented and browser-emulated across all routes.' },
  { id: 'lighthouse-thresholds', passed: lighthouse.results.length === 3 && lighthouse.results.every((result) => Object.values(result.scores).every((score) => score === 1)) && lighthouseDocs.includes('failed'), detail: 'Three retained production-artifact Lighthouse runs score 1.00 in all categories; earlier failures remain documented.' },
  { id: 'test-and-quality-refresh', passed: acceptance.includes('Twenty-six public test instances pass') && acceptance.includes('deterministic public-quality gate passes'), detail: 'The current record includes the 26-instance test run and deterministic quality pass.' },
  { id: 'predecessors-unaccepted', passed: predecessors.every((manifest) => Object.entries(manifest).some(([key, value]) => key.endsWith('Accepted') && value === false)), detail: 'All WBS 4.1–4.4 readiness predecessors remain explicitly unaccepted.' },
  { id: 'no-hosted-or-release-authority', passed: acceptance.includes('does not authorize hosted release, publication, analytics, paper trading or live trading'), detail: 'Local quality evidence creates no hosted-release, publication, analytics or trading authority.' },
  { id: 'current-predecessor-contracts', passed: predecessors.every((manifest) => manifest.schemaVersion === 3), detail: 'Current schema-v3 WBS 4.1–4.4 predecessor evidence is consumed.' },
  { id: 'local-versus-hosted-separation', passed: predecessors.every((manifest) => manifest.publicLaunchAuthorized === false) && acceptance.includes('approved hosted release candidate'), detail: 'Local quality evidence remains separate from hosted release-candidate acceptance.' },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) throw new Error(`Public-quality readiness checks failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  { id: 'PQB-01', severity: 'Critical', status: 'Open', detail: 'Retained hosted Chromium axe evidence remains pending.' },
  { id: 'PQB-02', severity: 'Critical', status: 'Open', detail: 'Hosted release-candidate quality execution remains pending.' },
  { id: 'PQB-03', severity: 'Critical', status: 'Open', detail: 'Manual keyboard and screen-reader evidence remains pending.' },
  { id: 'PQB-04', severity: 'Critical', status: 'Open', detail: 'Operating-system preference and actual 400% zoom evidence remains pending.' },
  { id: 'PQB-05', severity: 'Critical', status: 'Open', detail: 'Representative accessibility validation remains pending.' },
  { id: 'PQB-06', severity: 'Critical', status: 'Open', detail: 'Authorized QA and Accessibility acceptance remains pending.' },
  { id: 'PQB-07', severity: 'Critical', status: 'Open', detail: 'Approved production origin, legal entity and brand-image facts remain unavailable.' },
  { id: 'PQB-08', severity: 'Critical', status: 'Open', detail: 'Repeated hosted Lighthouse and field Core Web Vitals remain unmeasured.' },
  { id: 'PQB-09', severity: 'Critical', status: 'Open', detail: 'Analytics consent basis, preference controls and event allowlist remain unavailable.' },
  { id: 'PQB-10', severity: 'Critical', status: 'Open', detail: 'Privacy and Security approval remains unavailable.' },
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 4.5 Public Web Quality readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Quality Ready / Hosted Acceptance Pending',
  qualityAccepted: false,
  hostedReleaseAuthorized: false,
  analyticsAuthorized: false,
  publicLaunchAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  hostedQualityCertified: false,
  representativeAccessibilityAccepted: false,
  qaLeadApprovalRecorded: false,
  accessibilityLeadApprovalRecorded: false,
  deploymentAuthorized: false,
  externalUserAuthorityCreated: false,
  inventory: {
    publicRoutes: 9,
    checks: checks.length,
    blockers: blockers.length,
    artifacts: artifacts.length,
  },
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/public-quality-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/public-quality-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(root, 'outputs/public-quality-readiness/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Public web quality: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local Quality Ready / Hosted Acceptance Pending.`);
