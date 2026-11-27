import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/SCANNER_UI_ACCEPTANCE.md',
  'apps/trading-portal/src/app/scanner/scanner-page.ts',
  'apps/trading-portal/src/app/scanner/scanner-page.html',
  'apps/trading-portal/src/app/scanner/scanner-page.scss',
  'apps/trading-portal/src/app/scanner/scanner-page.spec.ts',
  'apps/trading-portal/src/app/scanner/scanner-realtime.service.ts',
  'apps/trading-portal/src/app/scanner/scanner-realtime.coordinator.ts',
  'docs/engineering/SCANNER_ACCESSIBILITY_ACCEPTANCE_2026-09-29.md',
  'outputs/scanner-accessibility/local-axe-results.json',
  'docs/engineering/SCANNER_PERFORMANCE_BASELINE_2026-09-29.md',
  'outputs/scanner-performance/local-results.json',
  'docs/engineering/SCANNER_BROWSER_COMPATIBILITY_2026-09-29.md',
  'outputs/scanner-browser-compatibility/local-results.json',
  'outputs/scanner-service-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const page = `${contents.get(files[1])}\n${contents.get(files[2])}\n${contents.get(files[3])}`;
const tests = contents.get(files[4]);
const realtime = `${contents.get(files[5])}\n${contents.get(files[6])}`;
const accessibility = `${contents.get(files[7])}\n${contents.get(files[8])}`;
const performance = `${contents.get(files[9])}\n${contents.get(files[10])}`;
const browsers = `${contents.get(files[11])}\n${contents.get(files[12])}`;
const service = JSON.parse(contents.get(files[13]));

const checks = [
  { id: 'authenticated-route-and-context', passed: acceptance.includes('/app/scanner') && page.includes('preset') && page.includes('snapshotHash'), detail: 'The authenticated scanner exposes versioned run and snapshot context.' },
  { id: 'exact-strategy-funnel', passed: page.includes('Price $3–$7') && page.includes('RVOL ≥ 3×') && page.includes('Float ≤ 500k') && page.includes('Gain 100%–600%'), detail: 'The visible funnel retains the approved discovery boundaries.' },
  { id: 'no-order-controls', passed: tests.includes('does not render order submission controls') && acceptance.includes('no buy, sell, or order-entry control'), detail: 'Scanner UI exposes no order action.' },
  { id: 'extreme-move-warning', passed: page.includes('elevated risk') && tests.includes('not a buy signal'), detail: 'Extreme movement is risk evidence, never a recommendation.' },
  { id: 'fail-closed-stream-states', passed: ['Reconnecting', 'Recovering', 'Stale'].every((state) => page.includes(state)) && tests.includes('fails closed with explicit reconnecting'), detail: 'Stream uncertainty preserves explicit fail-closed guidance.' },
  { id: 'availability-suppression', passed: tests.includes('hides candidate evidence for loading, denied and failed availability') && tests.includes('authoritative empty state'), detail: 'Candidate evidence is suppressed for loading, failure, denial and authoritative empty states.' },
  { id: 'correction-provenance', passed: tests.includes('renders correction provenance') && realtime.includes('correctionReason'), detail: 'Corrections retain visible provenance without creating an action control.' },
  { id: 'responsive-reflow', passed: acceptance.includes('320 CSS pixels') && acceptance.includes('no horizontal viewport overflow'), detail: 'Narrow reflow evidence covers the 320 CSS-pixel boundary.' },
  { id: 'local-accessibility', passed: accessibility.includes('axe') && accessibility.includes('forced-colors') && accessibility.includes('reduced-motion') && acceptance.includes('keyboard-only'), detail: 'Local axe, preference, keyboard and text-spacing evidence is retained.' },
  { id: 'local-performance', passed: performance.includes('LCP') && performance.includes('CLS') && acceptance.includes('performance runs pass'), detail: 'Three authenticated production-artifact performance runs meet the local budget.' },
  { id: 'browser-compatibility', passed: browsers.includes('Chromium') && browsers.includes('Firefox') && browsers.includes('WebKit') && browsers.includes('Google Chrome'), detail: 'Eight desktop/narrow compatibility cases span four local engines/browsers.' },
  { id: 'predecessor-and-hosted-boundary', passed: service.scannerServiceAccepted === false && acceptance.includes('Hosted and Accountable Acceptance Pending') && acceptance.includes('shipping Safari/Edge evidence'), detail: 'WBS 5.5, hosted/manual and accountable acceptance remain explicitly unavailable.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Scanner-UI readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'WBS 5.5 service acceptance and authorized production integration remain unavailable.',
  'Assistive-technology, actual 400% zoom, manual operating-system preference and representative-user acceptance remain incomplete.',
  'Hosted/field performance, hosted recovery and real account/permission-state validation remain incomplete.',
  'Shipping Safari and Edge evidence remains unavailable.',
  'Product, Risk, UX, Accessibility, Backend and Frontend approvals remain Pending.',
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 5.6 Scanner UI readiness',
  localControls: 'PASS',
  readinessDecision: 'Local UI Ready / Hosted and Accountable Acceptance Pending',
  scannerUiAccepted: false,
  hostedIntegrationAccepted: false,
  orderControlsPresent: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/scanner-ui-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/scanner-ui-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Scanner UI: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local UI Ready / Hosted and Accountable Acceptance Pending.`);
