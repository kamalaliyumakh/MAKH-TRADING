import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs/portal-provenance-gate');
const packages = [
  [
    '6.1',
    'NEWS_FILINGS_ADAPTER_ACCEPTANCE.md',
    'news-filings-adapter-readiness',
    'newsFilingsAdapterAccepted',
  ],
  [
    '6.2',
    'SOCIAL_SIGNAL_ADAPTER_ACCEPTANCE.md',
    'social-signal-adapter-readiness',
    'socialSignalAdapterAccepted',
  ],
  [
    '6.3',
    'EVIDENCE_SERVICE_ACCEPTANCE.md',
    'evidence-service-readiness',
    'evidenceServiceAccepted',
  ],
  [
    '6.4',
    'SYMBOL_WORKSPACE_ACCEPTANCE.md',
    'symbol-workspace-readiness',
    'symbolWorkspaceAccepted',
  ],
  ['6.5', 'DASHBOARD_ACCEPTANCE.md', 'dashboard-readiness', 'dashboardAccepted'],
  ['6.6', 'JOURNAL_ACCEPTANCE.md', 'journal-readiness', 'journalAccepted'],
];
const supportingFiles = [
  'docs/engineering/PORTAL_PROVENANCE_GATE_REVIEW.md',
  'docs/engineering/PORTAL_PROVENANCE_GATE_APPROVAL.md',
  'outputs/journal-accessibility/local-browser-results.json',
  'outputs/engineering-foundation-gate-readiness/readiness-manifest.json',
  'outputs/scanner-certification-gate-readiness/readiness-manifest.json',
];
const failures = [];
const sha = (content) => crypto.createHash('sha256').update(content).digest('hex');
const read = (relativeFile) => {
  const file = path.join(root, relativeFile);
  if (!fs.existsSync(file)) {
    failures.push(`${relativeFile} is missing.`);
    return null;
  }
  return fs.readFileSync(file);
};

const predecessors = packages.map(([wbs, acceptanceName, readinessDir, acceptedKey]) => {
  const acceptanceFile = `docs/engineering/${acceptanceName}`;
  const readinessFile = `outputs/${readinessDir}/readiness-manifest.json`;
  const acceptanceBytes = read(acceptanceFile);
  const readinessBytes = read(readinessFile);
  const content = acceptanceBytes?.toString('utf8') ?? '';
  const status = content.match(/^Status:\s*(.+)$/m)?.[1]?.trim() ?? 'Missing';
  const percent = Number.parseInt(status.match(/(\d+)%/)?.[1] ?? '', 10);
  if (percent !== 99) failures.push(`WBS ${wbs} must be reconciled at 99% local readiness.`);
  let readiness = {};
  try {
    readiness = JSON.parse(readinessBytes?.toString('utf8') ?? '{}');
  } catch {
    failures.push(`${readinessFile} is invalid JSON.`);
  }
  if (readiness.localControls !== 'PASS') failures.push(`WBS ${wbs} local controls do not pass.`);
  if (readiness[acceptedKey] !== false)
    failures.push(`WBS ${wbs} must remain explicitly unaccepted.`);
  if (
    readiness.paperTradingAuthorityCreated !== false ||
    readiness.liveTradingAuthorityCreated !== false
  )
    failures.push(`WBS ${wbs} violates the no-trading-authority boundary.`);
  return {
    wbs,
    acceptanceFile,
    readinessFile,
    status,
    percentComplete: Number.isFinite(percent) ? percent : null,
    localControls: readiness.localControls ?? null,
    readinessDecision: readiness.readinessDecision ?? null,
    accepted: readiness[acceptedKey] ?? null,
    acceptanceSha256: acceptanceBytes ? sha(acceptanceBytes) : null,
    readinessSha256: readinessBytes ? sha(readinessBytes) : null,
  };
});

const supportingArtifacts = supportingFiles.map((file) => {
  const bytes = read(file);
  return { file, bytes: bytes?.length ?? 0, sha256: bytes ? sha(bytes) : null };
});
const review = read('docs/engineering/PORTAL_PROVENANCE_GATE_REVIEW.md')?.toString('utf8') ?? '';
const approval =
  read('docs/engineering/PORTAL_PROVENANCE_GATE_APPROVAL.md')?.toString('utf8') ?? '';
const foundation = JSON.parse(
  read('outputs/engineering-foundation-gate-readiness/readiness-manifest.json')?.toString('utf8') ??
    '{}',
);
const scanner = JSON.parse(
  read('outputs/scanner-certification-gate-readiness/readiness-manifest.json')?.toString('utf8') ??
    '{}',
);
const browser = JSON.parse(
  read('outputs/journal-accessibility/local-browser-results.json')?.toString('utf8') ?? '{}',
);

const checks = [
  {
    id: 'six-current-predecessors',
    passed: predecessors.length === 6 && predecessors.every((item) => item.percentComplete === 99),
    detail: 'WBS 6.1–6.6 each carry 99% local readiness.',
  },
  {
    id: 'predecessor-local-controls',
    passed: predecessors.every((item) => item.localControls === 'PASS'),
    detail: 'Every predecessor executable readiness gate passes locally.',
  },
  {
    id: 'predecessors-unaccepted',
    passed: predecessors.every((item) => item.accepted === false),
    detail: 'Local maturity is not misrepresented as accountable acceptance.',
  },
  {
    id: 'provenance-rights-boundary',
    passed: review.includes('provider') && review.includes('rights') && review.includes('licensed'),
    detail: 'Provider and content-rights gaps remain explicit.',
  },
  {
    id: 'privacy-records-boundary',
    passed: review.includes('DPIA') && review.includes('retention') && review.includes('deletion'),
    detail: 'Privacy, retention and deletion decisions remain explicit blockers.',
  },
  {
    id: 'integrity-recovery-boundary',
    passed:
      review.includes('journal PostgreSQL') && review.includes('hosted evidence reconstruction'),
    detail: 'Durable journal and hosted reconstruction evidence remain mandatory.',
  },
  {
    id: 'representative-quality-boundary',
    passed:
      review.includes('screen-reader') &&
      review.includes('performance') &&
      review.includes('fault-state'),
    detail: 'Representative accessibility, performance and fault testing remain required.',
  },
  {
    id: 'foundation-scanner-negative',
    passed: foundation.gateAccepted === false && scanner.gateAccepted === false,
    detail: 'Foundation and scanner certification predecessors remain rejected/deferred.',
  },
  {
    id: 'approval-record-pending',
    passed:
      approval.includes('Current status') &&
      (approval.match(/Pending/g)?.length ?? 0) >= 8 &&
      approval.includes('Codex cannot provide this approval'),
    detail: 'All accountable decisions remain Pending and cannot be supplied by Codex.',
  },
  {
    id: 'browser-evidence-retained',
    passed:
      Array.isArray(browser.evidence) &&
      browser.evidence.length >= 3 &&
      review.includes('zero WCAG A/AA axe violations'),
    detail: 'Retained browser evidence covers desktop, narrow and denied states.',
  },
  {
    id: 'no-authority-boundary',
    passed:
      review.includes('does not authorize provider purchase') && review.includes('live trading'),
    detail: 'The review grants no provider, deployment, broker, paper or live authority.',
  },
  {
    id: 'gate-decision-fail-closed',
    passed:
      review.includes('must not be signed') &&
      approval.includes('Awaiting prerequisites and authorized decision'),
    detail: 'The gate remains unsigned until external evidence and authorized decisions exist.',
  },
];
const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length) failures.push(...failedChecks.map((check) => `Check failed: ${check.id}`));

const blockers = [
  'Approved evidence/social providers and explicit content/data rights are absent.',
  'DPIA, privacy, retention, deletion, export and records decisions are absent.',
  'Licensed/hosted replay, protected-object storage, journal persistence and operational reconstruction evidence are incomplete.',
  'Representative assistive-technology, usability, hosted performance, volume and fault evidence is incomplete.',
  'Catalyst-verification policy and accountable workflow are not approved.',
  'WBS 6.1–6.6 and foundation/scanner predecessors lack authorized acceptance.',
  'Product, Data, Risk, Legal/Privacy, Security, UX/Accessibility, Engineering, QA and Operations approvals are not recorded.',
];
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 6.7 Portal and Provenance Gate',
  localControls: failures.length === 0 ? 'PASS' : 'FAIL',
  readinessDecision:
    'Reject / Defer — External Provenance, Privacy, Hosted Integrity and Accountable Acceptance Pending',
  gateAccepted: false,
  entryLockCleared: false,
  providerOrDeploymentAuthorized: false,
  brokerConnected: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  predecessors,
  supportingArtifacts,
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
  `Portal/provenance gate: ${checks.length} checks, ${predecessors.length * 2 + supportingArtifacts.length} hashed artifacts, ${blockers.length} blockers; Reject / Defer — External Provenance, Privacy, Hosted Integrity and Accountable Acceptance Pending.`,
);
