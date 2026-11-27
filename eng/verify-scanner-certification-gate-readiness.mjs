import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readinessFiles = [
  'outputs/security-master-readiness/readiness-manifest.json',
  'outputs/market-data-adapter-readiness/readiness-manifest.json',
  'outputs/reference-data-adapter-readiness/readiness-manifest.json',
  'outputs/scanner-calculations-readiness/readiness-manifest.json',
  'outputs/scanner-service-readiness/readiness-manifest.json',
  'outputs/scanner-ui-readiness/readiness-manifest.json',
  'outputs/scanner-realtime-readiness/readiness-manifest.json',
];
const files = [
  'docs/engineering/SCANNER_GATE_REVIEW.md',
  'docs/engineering/SCANNER_GATE_APPROVAL.md',
  'eng/verify-scanner-gate.mjs',
  'outputs/scanner-gate/local-evidence-manifest.json',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
  ...readinessFiles,
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const review = contents.get(files[0]);
const approval = contents.get(files[1]);
const gate = JSON.parse(contents.get(files[3]));
const foundation = JSON.parse(contents.get(files[4]));
const predecessors = readinessFiles.map((file) => JSON.parse(contents.get(file)));
const authorizationKeys = [
  'securityMasterAccepted',
  'marketDataAdapterAccepted',
  'referenceDataAdapterAccepted',
  'scannerCalculationsAccepted',
  'scannerServiceAccepted',
  'scannerUiAccepted',
  'scannerRealtimeAccepted',
  'gateAccepted',
  'certificationAuthorized',
  'deploymentAuthorized',
  'paperTradingAuthorityCreated',
  'liveTradingAuthorityCreated',
];
const explicitAcceptanceCreated = predecessors.some((manifest) =>
  authorizationKeys.some((key) => manifest[key] === true),
);

const checks = [
  { id: 'fourteen-gate-criteria', passed: (review.match(/\| SCG-\d{2} \|/g) ?? []).length === 14, detail: 'The review retains all fourteen scanner certification criteria.' },
  { id: 'seven-certification-blockers', passed: (review.match(/\| (?:Critical|High)[^|]*\|/g) ?? []).length === 7 && gate.blockers.length === 7, detail: 'Seven unresolved licensing, data, reliability, usability and governance blockers remain.' },
  { id: 'eight-pending-decisions', passed: (approval.match(/\| Pending\s*\|/g) ?? []).length === 8, detail: 'All eight accountable approval decisions remain Pending.' },
  { id: 'legacy-local-evidence-pass', passed: gate.localEvidenceChecksPassed === true && gate.certificationAuthorized === false && gate.paperOrLiveTradingAuthorized === false, detail: 'The existing evidence collector passes locally while preserving negative authorization.' },
  { id: 'predecessor-local-controls', passed: predecessors.every((manifest) => manifest.localControls === 'PASS' && typeof manifest.readinessDecision === 'string' && manifest.readinessDecision.length > 0), detail: 'WBS 5.1–5.7 each expose a passing local-control decision.' },
  { id: 'predecessor-acceptance-negative', passed: !explicitAcceptanceCreated, detail: 'No readiness manifest claims accountable acceptance or authorization.' },
  { id: 'foundation-gate-negative', passed: foundation.localControls === 'PASS' && foundation.gateAccepted === false && foundation.readinessDecision === 'Reject/Defer', detail: 'The WBS 3.8 foundation gate remains explicitly unaccepted.' },
  { id: 'strategy-boundaries', passed: review.includes('$3–$7') && review.includes('RVOL ≥3×') && review.includes('public float ≤500,000') && review.includes('100%–600% gain'), detail: 'The exact strategy boundaries remain visible without creating executable authority.' },
  { id: 'licensed-data-boundary', passed: review.includes('No market/reference-data provider') && review.includes('No licensed point-in-time dataset'), detail: 'Provider rights and licensed reconciliation/replay remain explicit blockers.' },
  { id: 'hosted-boundary', passed: review.includes('Multi-replica outbox/SignalR coordination') && review.includes('Hosted capacity, soak'), detail: 'Multi-replica and hosted operational certification remain explicit blockers.' },
  { id: 'deployment-and-trading-boundary', passed: review.includes('public/shared deployment') && review.includes('paper trading') && review.includes('live trading'), detail: 'The package grants no public, shared, paper or live authority.' },
  { id: 'reject-defer-decision', passed: review.includes('Reject / Defer — Licensed and Hosted Certification Pending'), detail: 'The decision remains fail closed pending licensed and hosted certification.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`Scanner certification gate readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [...gate.blockers];
const artifacts = files.map((file) => ({
  path: file,
  sha256: createHash('sha256').update(contents.get(file)).digest('hex'),
}));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 5.8 Scanner and Data-Quality Certification Gate readiness',
  localControls: 'PASS',
  readinessDecision: 'Reject / Defer — Licensed and Hosted Certification Pending',
  gateAccepted: false,
  certificationAuthorized: false,
  deploymentAuthorized: false,
  providerPurchaseAuthorized: false,
  realDataIngestionAuthorized: false,
  publicOrSharedDeploymentAuthorized: false,
  brokerConnectivityAuthorized: false,
  paperTradingAuthorized: false,
  liveTradingAuthorized: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/scanner-certification-gate-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/scanner-certification-gate-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Scanner certification gate: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Reject / Defer — Licensed and Hosted Certification Pending.`);
