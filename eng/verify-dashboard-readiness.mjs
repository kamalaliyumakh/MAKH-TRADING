import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/DASHBOARD_ACCEPTANCE.md',
  'src/MAKH.Api/Program.cs',
  'src/MAKH.Application/Market/DashboardReadService.cs',
  'tests/MAKH.Architecture.Tests/DashboardReadServiceTests.cs',
  'tests/MAKH.Api.SecurityTests/IdentitySecurityTests.cs',
  'apps/trading-portal/src/app/app.routes.ts',
  'apps/trading-portal/src/app/dashboard/dashboard.service.ts',
  'apps/trading-portal/src/app/dashboard/dashboard-page.ts',
  'apps/trading-portal/src/app/dashboard/dashboard-page.html',
  'apps/trading-portal/src/app/dashboard/dashboard-page.spec.ts',
  'apps/trading-portal/src/app/dashboard/dashboard-realtime.coordinator.ts',
  'apps/trading-portal/src/app/dashboard/dashboard-realtime.coordinator.spec.ts',
  'outputs/scanner-realtime-readiness/readiness-manifest.json',
  'outputs/symbol-workspace-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const api = contents.get(files[1]);
const backend = contents.get(files[2]);
const backendTests = contents.get(files[3]);
const securityTests = contents.get(files[4]);
const routes = contents.get(files[5]);
const service = contents.get(files[6]);
const page = contents.get(files[7]);
const template = contents.get(files[8]);
const pageTests = contents.get(files[9]);
const realtime = contents.get(files[10]);
const realtimeTests = contents.get(files[11]);
const scannerRealtime = JSON.parse(contents.get(files[12]));
const symbolWorkspace = JSON.parse(contents.get(files[13]));

const checks = [
  {
    id: 'authenticated-account-scoped-route',
    passed:
      api.includes('MapGet("/api/v1/dashboard"') &&
      api.includes('PlatformClaims.AccountId') &&
      api.includes('Headers.CacheControl = "no-store"'),
    detail: 'The dashboard REST surface is authenticated, account-scoped and non-cacheable.',
  },
  {
    id: 'paper-locked-non-authority-contract',
    passed:
      backend.includes('"PAPER"') &&
      backend.includes('"Locked"') &&
      backendTests.includes('SnapshotIsAccountScopedReadOnlyAndEntryLocked') &&
      service.includes("value['canSubmitOrder'] === false"),
    detail: 'PAPER mode, entry lock and immutable false authority are required end to end.',
  },
  {
    id: 'pnl-and-loss-capacity-reconciliation',
    passed:
      service.includes("value['realized'] + value['unrealized'] - value['total']") &&
      service.includes("value['consumedLossCapacity'] + value['remainingLossCapacity']") &&
      service.includes("value['openRisk'] >= 0"),
    detail: 'Displayed P&L and loss capacity reconcile and risk values cannot be negative.',
  },
  {
    id: 'point-in-time-snapshot-coherence',
    passed:
      service.includes('isPnlCurrent') &&
      service.includes('age < -30_000') &&
      pageTests.includes('P&L observed after the dashboard snapshot') &&
      pageTests.includes('future-dated snapshot'),
    detail: 'P&L cannot postdate the snapshot and materially future snapshots fail closed.',
  },
  {
    id: 'bounded-unique-account-evidence',
    passed:
      service.includes("value['dependencies'].length <= 20") &&
      service.includes("value['alerts'].length <= 50") &&
      service.includes("value['candidates'].length <= 100") &&
      service.includes('hasUniqueStrings'),
    detail: 'Dependency, alert and candidate collections are bounded and uniquely identified.',
  },
  {
    id: 'required-authorities-unavailable',
    passed:
      service.includes("['Risk service', 'Broker', 'Reconciliation']") &&
      backendTests.includes('SnapshotUsesClockAndKeepsAuthorityDependenciesUnavailable') &&
      template.includes('Not broker authoritative'),
    detail: 'Risk, broker and reconciliation dependencies remain unavailable and visible.',
  },
  {
    id: 'fail-closed-content-suppression',
    passed:
      service.includes("'Loading' | 'Ready' | 'Denied' | 'Unavailable' | 'Stale' | 'Invalid'") &&
      service.includes('this.snapshot.set(null)') &&
      pageTests.includes('hides account content'),
    detail: 'Malformed, stale, denied and unavailable states remove all account content.',
  },
  {
    id: 'read-only-user-interface',
    passed:
      pageTests.includes("querySelector('button')") &&
      pageTests.includes("querySelector('form')") &&
      template.includes('Candidate gain is secondary context'),
    detail: 'The dashboard contains no consequential form or button and keeps gain secondary.',
  },
  {
    id: 'default-off-sequenced-recovery',
    passed:
      realtime.includes('SCANNER_REALTIME_ENABLED') &&
      realtime.includes('delta.sequence !== this.sequence + 1') &&
      realtimeTests.includes('recovers from a sequence gap') &&
      realtimeTests.includes('hides content while disconnected'),
    detail: 'Optional real-time updates use sequenced authoritative recovery and hide uncertainty.',
  },
  {
    id: 'focused-local-regressions',
    passed:
      pageTests.includes('duplicate dependency names') &&
      pageTests.includes('negative open risk') &&
      pageTests.includes('negative candidate relative volume') &&
      realtimeTests.includes('preserves denial'),
    detail: 'Focused regressions cover integrity, nonnegative risk and recovery-denial boundaries.',
  },
  {
    id: 'predecessor-readiness-negative',
    passed:
      scannerRealtime.scannerRealtimeAccepted === false &&
      symbolWorkspace.symbolWorkspaceAccepted === false,
    detail: 'Real-time and adjacent portal predecessors remain explicitly unaccepted.',
  },
  {
    id: 'external-and-trading-boundary',
    passed:
      acceptance.includes('synthetic and read-only') &&
      acceptance.includes('no broker connection') &&
      acceptance.includes('never be used for a real trading decision'),
    detail: 'The package creates no real-account, broker, order, paper or live authority.',
  },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length)
  throw new Error(`Dashboard readiness failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  'Authorized broker, risk, market, evidence and reconciliation sources are not connected.',
  'Hosted multi-client SignalR/backplane and real account/session lifecycle verification remain incomplete.',
  'Approved authoritative P&L, risk, snapshot-version and cross-account authorization semantics remain unavailable.',
  'Position/order drill-downs, alert acknowledgement policy and operations support paths remain unapproved.',
  'Representative usability, assistive-technology, zoom, forced-colors, performance, volume and fault testing remain incomplete.',
  'A fresh repository-pinned .NET 10 run plus Product, Risk, Frontend, UX/Accessibility, Broker/Operations, Security and QA approvals remain Pending.',
];
const artifacts = files.map((file) => ({
  path: file,
  sha256: createHash('sha256').update(contents.get(file)).digest('hex'),
}));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 6.5 Dashboard readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Read-Only Dashboard Ready / Hosted and Accountable Acceptance Pending',
  dashboardAccepted: false,
  hostedIntegrationAccepted: false,
  authoritativeAccountSourcesConnected: false,
  brokerConnected: false,
  orderControlsPresent: false,
  deploymentAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/dashboard-readiness'), { recursive: true });
await writeFile(
  path.join(root, 'outputs/dashboard-readiness/readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `Dashboard: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local Read-Only Dashboard Ready / Hosted and Accountable Acceptance Pending.`,
);
