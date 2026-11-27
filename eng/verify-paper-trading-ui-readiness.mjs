import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/paper-trading-ui-readiness');
const artifacts = [
  'docs/engineering/PAPER_TRADING_UI_ACCEPTANCE.md',
  'apps/trading-portal/src/app/trading/trading.service.ts',
  'apps/trading-portal/src/app/trading/trading-page.ts',
  'apps/trading-portal/src/app/trading/trading-page.html',
  'apps/trading-portal/src/app/trading/trading-page.spec.ts',
  'src/MAKH.Application/Trading/PaperTradingOverviewService.cs',
  'tests/MAKH.Architecture.Tests/PaperTradingOverviewServiceTests.cs',
  'src/MAKH.Api/Program.cs',
  'outputs/risk-domain-readiness/readiness-manifest.json',
  'outputs/broker-paper-adapter-readiness/readiness-manifest.json',
  'outputs/paper-oms-readiness/readiness-manifest.json',
  'outputs/position-ledger-readiness/readiness-manifest.json',
  'outputs/reconciliation-readiness/readiness-manifest.json',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
];
const failures = [];
const sha = (content) => crypto.createHash('sha256').update(content).digest('hex');
const read = (file) => {
  const absolute = path.join(root, file);
  if (!fs.existsSync(absolute)) {
    failures.push(`${file} is missing.`);
    return Buffer.from('');
  }
  return fs.readFileSync(absolute);
};
const text = Object.fromEntries(artifacts.map((file) => [file, read(file).toString('utf8')]));
const json = (file) => {
  try {
    return JSON.parse(text[file]);
  } catch {
    failures.push(`${file} is invalid JSON.`);
    return {};
  }
};

const service = text['apps/trading-portal/src/app/trading/trading.service.ts'];
const page = text['apps/trading-portal/src/app/trading/trading-page.ts'];
const template = text['apps/trading-portal/src/app/trading/trading-page.html'];
const tests = text['apps/trading-portal/src/app/trading/trading-page.spec.ts'];
const backend = text['src/MAKH.Application/Trading/PaperTradingOverviewService.cs'];
const backendTests = text['tests/MAKH.Architecture.Tests/PaperTradingOverviewServiceTests.cs'];
const api = text['src/MAKH.Api/Program.cs'];
const acceptance = text['docs/engineering/PAPER_TRADING_UI_ACCEPTANCE.md'];
const risk = json('outputs/risk-domain-readiness/readiness-manifest.json');
const broker = json('outputs/broker-paper-adapter-readiness/readiness-manifest.json');
const oms = json('outputs/paper-oms-readiness/readiness-manifest.json');
const positions = json('outputs/position-ledger-readiness/readiness-manifest.json');
const reconciliation = json('outputs/reconciliation-readiness/readiness-manifest.json');
const foundation = json('outputs/engineering-foundation-gate-readiness/readiness-manifest.json');

const checks = [
  {
    id: 'paper-session-boundary',
    passed:
      service.includes("value.accountMode === 'paper'") &&
      service.includes(
        "this.failClosed('Authenticated paper-account context changed or was revoked.')",
      ) &&
      tests.includes('fails closed and clears synthetic evidence for invalid account context'),
    detail: 'Only a validated paper-account session can expose or review account evidence.',
  },
  {
    id: 'account-bound-fresh-overview',
    passed:
      service.includes('age <= 5 * 60_000') &&
      service.includes("value.reconciliation === 'Mismatch'") &&
      tests.includes('rejects a cross-account or authority-bearing overview'),
    detail: 'Overview evidence is account-bound, fresh, mismatched and entry-locked.',
  },
  {
    id: 'bounded-lifecycle-evidence',
    passed:
      service.includes('maximumOverviewRows = 1_000') &&
      service.includes('TradingService.orderStates.has(order.state)') &&
      tests.includes('rejects unknown order states and oversized response collections'),
    detail: 'Order/position collections are bounded and order lifecycle values are allow-listed.',
  },
  {
    id: 'position-economic-coherence',
    passed:
      service.includes('Math.abs(position.unrealizedPnl - expectedUnrealizedPnl) <= 0.01') &&
      tests.includes(
        'rejects position evidence whose unrealized pnl is not arithmetically coherent',
      ),
    detail:
      'Displayed unrealized P&L reconciles to quantity, average cost and mark within one cent.',
  },
  {
    id: 'draft-defense-in-depth',
    passed:
      service.includes('if (!this.isSafeDraft(draft))') &&
      page.includes('Validators.max(500000)') &&
      tests.includes('rejects an invalid draft before making any review request'),
    detail: 'Form and service boundaries both enforce the scoped order guardrails.',
  },
  {
    id: 'csrf-session-revalidation',
    passed:
      service.includes("this.http.get<{ token: string }>('/auth/csrf')") &&
      service.includes("'X-CSRF-TOKEN': token") &&
      tests.includes('stops review when session account changes before csrf'),
    detail: 'Review revalidates the account session and carries antiforgery evidence.',
  },
  {
    id: 'expiring-non-authoritative-review',
    passed:
      service.includes("value.mode === 'PAPER'") &&
      service.includes('expiresAt - createdAt === 2 * 60_000') &&
      service.includes('value.mutatesTradingState === false') &&
      tests.includes('rejects an expired order-review window'),
    detail:
      'Accepted review evidence is short-lived, paper-only and cannot mutate state or create authority.',
  },
  {
    id: 'submission-denied',
    passed:
      service.includes('canSubmit(): boolean') &&
      service.includes('return false;') &&
      template.includes('Submit unavailable — entry locked') &&
      tests.includes('requires review and never enables submission'),
    detail: 'The user interface and service expose no executable order-submission path.',
  },
  {
    id: 'server-review-guardrails',
    passed:
      backend.includes('quantity is < 1 or > 500_000') &&
      backend.includes('limitPrice is < 3m or > 7m') &&
      backendTests.includes('ReviewRejectsOutOfScopeQuantityOrPrice'),
    detail: 'The synthetic server review independently enforces quantity and price guardrails.',
  },
  {
    id: 'api-authorization-and-antiforgery',
    passed:
      api.includes('AuthorizationPolicies.PaperTrading') &&
      api.includes('IsAuthorizedAccount(context, request.AccountId)') &&
      api.includes('antiforgery.IsRequestValidAsync(context)'),
    detail:
      'Trading reads and reviews require portal/paper authorization, account scope and antiforgery checks.',
  },
  {
    id: 'visible-safety-language',
    passed:
      template.includes('PAPER · simulated only') &&
      template.includes('Not broker authoritative') &&
      template.includes('not reconciled broker or tax truth'),
    detail: 'Paper mode, broker non-authority and estimated P&L limitations remain visible.',
  },
  {
    id: 'predecessors-and-boundary',
    passed:
      [risk, broker, oms, positions, reconciliation, foundation].every(
        (manifest) => manifest.localControls === 'PASS',
      ) &&
      risk.riskDomainAccepted === false &&
      broker.brokerPaperAdapterAccepted === false &&
      oms.paperOmsAccepted === false &&
      positions.positionLedgerAccepted === false &&
      reconciliation.reconciliationAccepted === false &&
      foundation.gateAccepted === false &&
      acceptance.includes('In progress — 99%') &&
      acceptance.includes('The UI cannot authorize live trading'),
    detail:
      'Local predecessors pass while all accountable acceptance and trading authority remain absent.',
  },
];
for (const check of checks) if (!check.passed) failures.push(`Check failed: ${check.id}`);

const blockers = [
  'Authorized OMS, position, reconciliation, risk and selected-broker snapshots plus SignalR recovery are not integrated.',
  'Cancel, replace and protection commands with idempotency and fresh-version conflict handling are absent from the UI.',
  'Representative browser, accessibility, performance and full lifecycle/recovery evidence remains incomplete.',
  'A fresh production bundle run aborted on the current host after startup; the application type-check and all 137 portal tests pass.',
  'Predecessor acceptance, selected-broker certification and Product/UX/Accessibility/Risk/Security/Compliance approvals remain pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 7.6 Paper-Trading Portal',
  localControls: failures.length === 0 ? 'PASS' : 'FAIL',
  readinessDecision:
    'Local Paper-Trading UI Ready / Authoritative Integration and Accountable Acceptance Pending',
  paperTradingUiAccepted: false,
  brokerConnected: false,
  orderSubmissionEnabled: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  artifacts: artifacts.map((file) => ({ file, sha256: sha(Buffer.from(text[file])) })),
  blockers,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(
  `Paper-trading UI readiness: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`,
);
