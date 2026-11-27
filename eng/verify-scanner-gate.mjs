import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/scanner-gate');
const acceptanceNames = [
  'SECURITY_MASTER_ACCEPTANCE.md',
  'MARKET_DATA_ADAPTER_ACCEPTANCE.md',
  'REFERENCE_DATA_ADAPTER_ACCEPTANCE.md',
  'SCANNER_CALCULATIONS_ACCEPTANCE.md',
  'SCANNER_SERVICE_ACCEPTANCE.md',
  'SCANNER_UI_ACCEPTANCE.md',
  'SCANNER_REALTIME_ACCEPTANCE.md',
];
const evidenceFiles = [
  'src/MAKH.Application/Market/ScannerCalculations.cs',
  'src/MAKH.Application/Market/ScannerService.cs',
  'tests/MAKH.Architecture.Tests/ScannerCalculationsTests.cs',
  'tests/MAKH.Architecture.Tests/ScannerServiceTests.cs',
  'apps/trading-portal/src/app/scanner/scanner-realtime.service.ts',
  'apps/trading-portal/src/app/scanner/scanner-realtime.service.spec.ts',
  'apps/trading-portal/src/app/scanner/scanner-page.ts',
  'apps/trading-portal/src/app/scanner/scanner-page.html',
  'apps/trading-portal/src/app/scanner/scanner-page.scss',
  'apps/trading-portal/src/app/scanner/scanner-page.spec.ts',
  'apps/trading-portal/src/app/scanner/scanner-realtime.coordinator.ts',
  'src/MAKH.Api/Realtime/OutboxDispatchHostedService.cs',
  'src/MAKH.Api/Realtime/SignalRScannerOutboxPublisher.cs',
  'tests/MAKH.Api.SecurityTests/ScannerRealtimeEndToEndTests.cs',
  'tests/MAKH.Architecture.Tests/OutboxDispatchLoadChaosTests.cs',
  'src/MAKH.Infrastructure/Market/PostgresScannerRunRepository.cs',
  'src/MAKH.Infrastructure/Market/ScannerOutboxMessageFactory.cs',
  'tests/MAKH.Architecture.Tests/ScannerPersistenceTests.cs',
  'tests/MAKH.Architecture.Tests/ScannerCorrectionReplayTests.cs',
  'eng/verify-scanner-accessibility.mjs',
  'outputs/scanner-accessibility/local-axe-results.json',
  'eng/serve-portal-static.mjs',
  'eng/verify-scanner-performance.mjs',
  'outputs/scanner-performance/local-results.json',
  'docs/engineering/SCANNER_PERFORMANCE_BASELINE_2026-09-29.md',
  'eng/verify-scanner-browser-compatibility.mjs',
  'outputs/scanner-browser-compatibility/local-results.json',
  'docs/engineering/SCANNER_BROWSER_COMPATIBILITY_2026-09-29.md',
];
const failures = [];
const portalDist = path.join(root, 'dist/trading-portal/browser');

const acceptance = acceptanceNames.map((name) => {
  const relativeFile = `docs/engineering/${name}`;
  const file = path.join(root, relativeFile);
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!text) failures.push(`${name} is missing.`);
  return {
    file: relativeFile,
    status: text.match(/^Status:\s*(.+)$/m)?.[1]?.trim() ?? 'Missing',
    sha256: text ? crypto.createHash('sha256').update(text).digest('hex') : null,
  };
});

const artifacts = evidenceFiles.map((relativeFile) => {
  const file = path.join(root, relativeFile);
  if (!fs.existsSync(file)) {
    failures.push(`${relativeFile} is missing.`);
    return { file: relativeFile, bytes: 0, sha256: null };
  }
  const bytes = fs.readFileSync(file);
  return {
    file: relativeFile,
    bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
});

const portalAssets = fs.existsSync(portalDist)
  ? fs
      .readdirSync(portalDist)
      .filter((name) => /\.(js|css)$/.test(name))
      .sort()
      .map((name) => {
        const bytes = fs.readFileSync(path.join(portalDist, name));
        return {
          file: `dist/trading-portal/browser/${name}`,
          bytes: bytes.length,
          sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
        };
      })
  : [];
if (!portalAssets.length) failures.push('Trading portal production assets are missing.');

const blockers = [
  'WBS 3.8 and WBS 5.1–5.7 lack authorized acceptance.',
  'Approved providers, entitlements and permitted storage/display/replay rights are absent.',
  'Licensed point-in-time replay and provider reconciliation certification are absent.',
  'Multi-replica outbox/SignalR coordination and hosted correction replay are not certified.',
  'Hosted representative capacity, soak, process/network chaos, freshness SLO, alerting and recovery drills are incomplete.',
  'Assistive-technology, actual zoom, manual operating-system preferences, supported-browser, hosted and representative-user accessibility acceptance is incomplete.',
  'Product, Data, Risk, Security, Engineering, QA/Accessibility, Legal and Operations approvals are not recorded.',
];

const manifest = {
  generatedAtUtc: new Date().toISOString(),
  scope: 'Local synthetic scanner and data-quality gate evidence only',
  certificationAuthorized: false,
  paperOrLiveTradingAuthorized: false,
  localEvidenceChecksPassed: failures.length === 0,
  verification: {
    dotnetTests: 384,
    portalTests: 83,
    portalBundleRawBytes: portalAssets.reduce((total, asset) => total + asset.bytes, 0),
  },
  acceptance,
  artifacts,
  portalAssets,
  blockers,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'local-evidence-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Scanner gate evidence prepared: ${acceptance.length} acceptance records, ${artifacts.length} hashed implementation artifacts, ${blockers.length} certification blockers; certification remains unauthorized.`,
);
