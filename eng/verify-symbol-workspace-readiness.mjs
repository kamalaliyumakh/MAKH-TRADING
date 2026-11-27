import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/SYMBOL_WORKSPACE_ACCEPTANCE.md',
  'src/MAKH.Api/Program.cs',
  'src/MAKH.Application/Market/SymbolWorkspaceReadService.cs',
  'tests/MAKH.Architecture.Tests/SymbolWorkspaceReadServiceTests.cs',
  'tests/MAKH.Api.SecurityTests/IdentitySecurityTests.cs',
  'apps/trading-portal/src/app/app.routes.ts',
  'apps/trading-portal/src/app/symbol-workspace/symbol-workspace.service.ts',
  'apps/trading-portal/src/app/symbol-workspace/symbol-workspace-page.ts',
  'apps/trading-portal/src/app/symbol-workspace/symbol-workspace-page.html',
  'apps/trading-portal/src/app/symbol-workspace/symbol-workspace-page.spec.ts',
  'apps/trading-portal/src/app/symbol-workspace/symbol-workspace-realtime.coordinator.ts',
  'apps/trading-portal/src/app/symbol-workspace/symbol-workspace-realtime.coordinator.spec.ts',
  'outputs/scanner-ui-readiness/readiness-manifest.json',
  'outputs/evidence-service-readiness/readiness-manifest.json',
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
const scanner = JSON.parse(contents.get(files[12]));
const evidence = JSON.parse(contents.get(files[13]));

const checks = [
  {
    id: 'authenticated-no-store-route',
    passed:
      api.includes('MapGroup("/api/v1/symbols")') &&
      api.includes('RequireAuthorization(AuthorizationPolicies.PortalAccess)') &&
      api.includes('Headers.CacheControl = "no-store"'),
    detail: 'The workspace REST surface is authenticated and non-cacheable.',
  },
  {
    id: 'canonical-no-fallback-read-contract',
    passed:
      backend.includes('SymbolWorkspaceSnapshot? Find') &&
      backendTests.includes('UnknownSymbolReturnsNoSyntheticFallback') &&
      securityTests.includes('SymbolWorkspaceRejectsUnsafeAndUnknownSymbols'),
    detail: 'Symbols are bounded and unknown identifiers never receive fallback data.',
  },
  {
    id: 'explicit-non-authority-contract',
    passed:
      backend.includes('CreatesTradingAuthority') &&
      backend.includes('CanSubmitOrder') &&
      service.includes("value['createsTradingAuthority'] === false") &&
      service.includes("value['canSubmitOrder'] === false"),
    detail: 'Server and client retain immutable no-trading/no-order authority flags.',
  },
  {
    id: 'bounded-chronological-price-series',
    passed:
      service.includes('chartTimePattern') &&
      service.includes("value['pricePoints'].length <= 500") &&
      service.includes("value['price'] >= 0") &&
      service.includes('times[index - 1] < time') &&
      pageTests.includes('out-of-order chart observations'),
    detail: 'Chart points are bounded, nonnegative, well-formed and strictly chronological.',
  },
  {
    id: 'coherent-evidence-snapshot',
    passed:
      service.includes("value['evidence'].length <= 100") &&
      service.includes('hasUniqueEvidenceIds') &&
      service.includes('isEvidenceCurrent') &&
      pageTests.includes('duplicate evidence identifiers') &&
      pageTests.includes('evidence observed after the workspace snapshot'),
    detail: 'Evidence is bounded, uniquely identified and no later than its workspace snapshot.',
  },
  {
    id: 'trust-and-catalyst-boundary',
    passed:
      service.includes('isTrustOrdered') &&
      service.includes("value['catalystVerified'] === false") &&
      service.includes("value['catalystStatus'] === 'Not verified'") &&
      pageTests.includes('orders primary evidence before social attention'),
    detail: 'Trust ordering never promotes a catalyst to verified.',
  },
  {
    id: 'fail-closed-content-suppression',
    passed:
      service.includes(
        "'Loading' | 'Ready' | 'Unknown' | 'Denied' | 'Unavailable' | 'Stale' | 'Invalid'",
      ) &&
      service.includes('this.workspace.set(null)') &&
      pageTests.includes('hides the unsafe payload'),
    detail: 'Denied, stale, malformed and unavailable states remove workspace content.',
  },
  {
    id: 'read-only-user-interface',
    passed:
      template.includes('Proposal creation and submission are disabled') &&
      pageTests.includes("querySelector('button')") &&
      pageTests.includes("querySelector('form')"),
    detail: 'The rendered workspace contains no order form, button or submission path.',
  },
  {
    id: 'default-off-realtime-recovery',
    passed:
      realtime.includes('SCANNER_REALTIME_ENABLED') &&
      realtime.includes("this.workspace.suspend('Loading'") &&
      realtime.includes('delta.sequence !== this.sequence + 1') &&
      realtimeTests.includes('recovers from a sequence gap') &&
      realtimeTests.includes('hides content while disconnected'),
    detail:
      'Optional real-time updates recover from authoritative REST state and hide uncertain content.',
  },
  {
    id: 'focused-local-regressions',
    passed:
      pageTests.includes('negative chart prices') &&
      pageTests.includes('negative relative volume') &&
      realtimeTests.includes('fails closed when authoritative recovery is denied'),
    detail: 'Focused tests cover payload integrity and recovery denial boundaries.',
  },
  {
    id: 'predecessor-readiness-negative',
    passed: scanner.scannerUiAccepted === false && evidence.evidenceServiceAccepted === false,
    detail: 'Scanner UI and evidence-service predecessors remain explicitly unaccepted.',
  },
  {
    id: 'external-and-trading-boundary',
    passed:
      acceptance.includes('synthetic and read-only') &&
      acceptance.includes('a broker connection') &&
      acceptance.includes('never authorize a trade'),
    detail: 'The package creates no external-data, broker, order, paper or live authority.',
  },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length)
  throw new Error(
    `Symbol-workspace readiness failed: ${failed.map((check) => check.id).join(', ')}`,
  );

const blockers = [
  'Hosted multi-client SignalR/backplane and real account/session lifecycle verification remain incomplete.',
  'Approved provider attribution, quote/session semantics, corporate-action behavior and chart policy remain unavailable.',
  'Governed catalyst verification, journal persistence and separately authorized risk/proposal workflows remain unintegrated.',
  'Representative usability, assistive-technology, zoom, forced-colors, performance, volume and fault testing remain incomplete.',
  'A fresh repository-pinned .NET 10 run is required for backend and API-security evidence under the current runner constraint.',
  'Product, Risk, Frontend, UX/Accessibility, Data, Security and Operations approvals plus WBS 5.6/6.3 acceptance remain Pending.',
];
const artifacts = files.map((file) => ({
  path: file,
  sha256: createHash('sha256').update(contents.get(file)).digest('hex'),
}));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 6.4 Symbol Workspace readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Read-Only Workspace Ready / Hosted and Accountable Acceptance Pending',
  symbolWorkspaceAccepted: false,
  hostedIntegrationAccepted: false,
  licensedMarketDataConnected: false,
  brokerConnected: false,
  orderControlsPresent: false,
  deploymentAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/symbol-workspace-readiness'), { recursive: true });
await writeFile(
  path.join(root, 'outputs/symbol-workspace-readiness/readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
console.log(
  `Symbol workspace: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local Read-Only Workspace Ready / Hosted and Accountable Acceptance Pending.`,
);
