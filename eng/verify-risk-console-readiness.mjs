import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/risk-console-readiness');
const artifacts = [
  'docs/engineering/RISK_CONSOLE_ACCEPTANCE.md',
  'apps/trading-portal/src/app/risk-console/risk-console.service.ts',
  'apps/trading-portal/src/app/risk-console/risk-console-page.ts',
  'apps/trading-portal/src/app/risk-console/risk-console-page.html',
  'apps/trading-portal/src/app/risk-console/risk-console-page.spec.ts',
  'src/MAKH.Application/Risk/RiskControlContracts.cs',
  'tests/MAKH.Architecture.Tests/RiskControlPreviewServiceTests.cs',
  'src/MAKH.Api/Program.cs',
  'src/MAKH.Api/Identity/IdentityServiceCollectionExtensions.cs',
  'outputs/risk-domain-readiness/readiness-manifest.json',
  'outputs/broker-paper-adapter-readiness/readiness-manifest.json',
  'outputs/paper-oms-readiness/readiness-manifest.json',
  'outputs/position-ledger-readiness/readiness-manifest.json',
  'outputs/reconciliation-readiness/readiness-manifest.json',
  'outputs/paper-trading-ui-readiness/readiness-manifest.json',
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

const service = text['apps/trading-portal/src/app/risk-console/risk-console.service.ts'];
const template = text['apps/trading-portal/src/app/risk-console/risk-console-page.html'];
const tests = text['apps/trading-portal/src/app/risk-console/risk-console-page.spec.ts'];
const backend = text['src/MAKH.Application/Risk/RiskControlContracts.cs'];
const backendTests = text['tests/MAKH.Architecture.Tests/RiskControlPreviewServiceTests.cs'];
const api = text['src/MAKH.Api/Program.cs'];
const identity = text['src/MAKH.Api/Identity/IdentityServiceCollectionExtensions.cs'];
const acceptance = text['docs/engineering/RISK_CONSOLE_ACCEPTANCE.md'];
const risk = json('outputs/risk-domain-readiness/readiness-manifest.json');
const broker = json('outputs/broker-paper-adapter-readiness/readiness-manifest.json');
const oms = json('outputs/paper-oms-readiness/readiness-manifest.json');
const positions = json('outputs/position-ledger-readiness/readiness-manifest.json');
const reconciliation = json('outputs/reconciliation-readiness/readiness-manifest.json');
const paperUi = json('outputs/paper-trading-ui-readiness/readiness-manifest.json');
const foundation = json('outputs/engineering-foundation-gate-readiness/readiness-manifest.json');

const checks = [
  {
    id: 'paper-session-account-boundary',
    passed:
      service.includes("value.accountMode === 'paper'") &&
      service.includes('session.accountId.toLowerCase() !== accountId.toLowerCase()') &&
      tests.includes('fails closed when the account changes before preview'),
    detail:
      'Only a revalidated paper session for the same account can request a containment preview.',
  },
  {
    id: 'fresh-fail-closed-overview',
    passed:
      service.includes('ageMilliseconds <= 5 * 60_000') &&
      service.includes('value.entryLocked === true') &&
      service.includes('value.reconciliationHealthy === false') &&
      tests.includes('rejects a stale overview and clears its evidence'),
    detail: 'Overview evidence must be fresh, entry-locked and unreconciled.',
  },
  {
    id: 'bounded-overview-evidence',
    passed:
      service.includes('maximumOverviewRows = 1_000') &&
      service.includes('effectiveFrom <= asOf') &&
      tests.includes('rejects oversized or temporally invalid overview evidence'),
    detail: 'Limits, pauses and breaches are bounded, uniquely identified and time coherent.',
  },
  {
    id: 'capacity-integrity',
    passed:
      service.includes('value.remaining === Math.max(0, value.limit - value.used)') &&
      service.includes('value.exceeded === value.used > value.limit') &&
      tests.includes('rejects inconsistent capacity or tampered evidence'),
    detail:
      'Displayed remaining capacity and exceeded state must reconcile to used and limit values.',
  },
  {
    id: 'reason-defense-in-depth',
    passed:
      service.includes('/token|secret/i.test(normalizedReason)') &&
      service.includes('normalizedReason.length > 500') &&
      tests.includes('rejects unsafe reason content before any preview request'),
    detail: 'Unsafe or excessive reasons are rejected before protected network calls.',
  },
  {
    id: 'exact-request-response-binding',
    passed:
      service.includes('value?.commandId === commandId') &&
      service.includes('value.reason === reason') &&
      service.includes('value.correlationId === correlationId') &&
      tests.includes('rejects containment evidence that is not bound to the exact request'),
    detail:
      'Preview evidence must echo the exact command, account, intent and correlation identifiers.',
  },
  {
    id: 'timestamp-and-nested-evidence',
    passed:
      service.includes('createdAt - dataAsOf <= 5 * 60_000') &&
      service.includes('value.reconciliationRequired === (action !== 0)') &&
      service.includes('value.impact.warnings.length <= 20') &&
      service.includes('value.impact.evidenceSha256') &&
      tests.includes('accepts a fully bound block preview without a reconciliation requirement'),
    detail:
      'Preview and impact evidence is fresh, ordered, bounded, independently hashed and action-specific.',
  },
  {
    id: 'immutable-non-executable-boundary',
    passed:
      service.includes('value.finalConfirmationEnabled === false') &&
      service.includes('value.mutatesTradingState === false') &&
      service.includes('value.impact.canExecute === false') &&
      template.includes('Confirm {{ action }} unavailable'),
    detail: 'Final confirmation, mutation and execution remain unavailable.',
  },
  {
    id: 'backend-defined-intent-and-idempotency',
    passed:
      backend.includes('if (!Enum.IsDefined(action))') &&
      backend.includes('existing.Reason != request.Reason') &&
      backend.includes('existing.CorrelationId != request.CorrelationId') &&
      backendTests.includes('ChangedReasonOrCorrelationWithSameCommandIdIsRejected') &&
      backendTests.includes('UndefinedContainmentActionIsRejected'),
    detail: 'Undefined actions and changed idempotent reason/correlation intent fail closed.',
  },
  {
    id: 'api-authorization-antiforgery-policy',
    passed:
      api.includes('AuthorizationPolicies.RiskAdministration') &&
      identity.includes('RequireRole(PlatformRoles.RiskAdministrator)') &&
      identity.includes('.AddRequirements(freshMfa)') &&
      api.includes('IsAuthorizedAccount(context, request.AccountId)') &&
      api.includes('antiforgery.IsRequestValidAsync(context)') &&
      api.includes('CurrentPolicyVersion'),
    detail:
      'Risk previews require account authorization, fresh MFA, antiforgery and current policy.',
  },
  {
    id: 'visible-separated-safety-workflow',
    passed:
      template.includes('Risk state is fail-closed') &&
      template.includes('Review Block') &&
      template.includes('Review Cancel') &&
      template.includes('Review Liquidate'),
    detail: 'Fail-closed state and separated consequential actions remain visible.',
  },
  {
    id: 'predecessors-and-boundary',
    passed:
      [risk, broker, oms, positions, reconciliation, paperUi, foundation].every(
        (manifest) => manifest.localControls === 'PASS',
      ) &&
      risk.riskDomainAccepted === false &&
      broker.brokerPaperAdapterAccepted === false &&
      oms.paperOmsAccepted === false &&
      positions.positionLedgerAccepted === false &&
      reconciliation.reconciliationAccepted === false &&
      paperUi.paperTradingUiAccepted === false &&
      foundation.gateAccepted === false &&
      acceptance.includes('In progress — 99%') &&
      acceptance.includes('cannot create trading authority'),
    detail:
      'Local predecessors pass while accountable acceptance and all trading authority remain absent.',
  },
];
for (const check of checks) if (!check.passed) failures.push(`Check failed: ${check.id}`);

const blockers = [
  'Authorized risk, reconciliation and broker snapshots plus SignalR gap/recovery handling are not integrated.',
  'Durable policy/pause/breach state and executable multi-step containment orchestration are absent.',
  'Provider-normalized account membership, representative accessibility/browser/performance evidence and independent game-day testing remain incomplete.',
  'Two focused backend regressions are authored but fresh execution is blocked by an unrelated existing PaperOmsServiceTests compile error.',
  'Predecessor acceptance and Risk/Security/Compliance/Operations/Product/Accessibility approvals remain pending.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 7.7 Risk Console',
  localControls: failures.length === 0 ? 'PASS' : 'FAIL',
  readinessDecision:
    'Local Risk Console Ready / Authoritative Orchestration and Accountable Acceptance Pending',
  riskConsoleAccepted: false,
  containmentExecutionEnabled: false,
  brokerConnected: false,
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
  `Risk-console readiness: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; ${manifest.readinessDecision}.`,
);
