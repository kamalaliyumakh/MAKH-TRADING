import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/legal/CURRENT_LEGAL_DISCOVERY_SCOPE.md',
  'docs/legal/CURRENT_LEGAL_SOURCE_REVIEW.md',
  'docs/legal/CURRENT_LEGAL_DECISION_REGISTER.md',
  'docs/legal/LEGAL_COMPLIANCE_DISCOVERY.md',
  'docs/legal/LEGAL_EVIDENCE_MATRIX.md',
  'docs/legal/PRIVACY_AND_RECORDS_CHECKLIST.md',
  'docs/legal/LEGAL_DISCOVERY_ACCEPTANCE.md',
  'outputs/compliance-evidence/current-readiness-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const scope = contents.get(evidenceFiles[0]);
const sourceReview = contents.get(evidenceFiles[1]);
const decisions = contents.get(evidenceFiles[2]);
const discovery = contents.get(evidenceFiles[3]);
const matrix = contents.get(evidenceFiles[4]);
const privacy = contents.get(evidenceFiles[5]);
const acceptance = contents.get(evidenceFiles[6]);
const compliance = JSON.parse(contents.get(evidenceFiles[7]));

const countRows = (text, pattern) => (text.match(pattern) ?? []).length;
const exactInventory = (text, prefix, count) => {
  const rows = countRows(text, new RegExp(`^\\| ${prefix}-\\d{2} \\|`, 'gm'));
  const allIds = Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(2, '0')}`)
    .every((id) => text.includes(`| ${id} |`));
  return rows === count && allIds;
};

const sourceRows = countRows(sourceReview, /^\| SRC-\d{2} \|/gm);
const decisionRows = countRows(decisions, /^\| LDD-\d{2} \| [^|]+ \| [^|]+ \| Pending \| Pending \|$/gm);
const approvalFields = countRows(decisions, /^\| [^|]+ \| Pending \|$/gm);
const domainRows = countRows(scope, /^\| LRD-\d{2} \|/gm);
const blockerRows = countRows(scope, /^\| LDB-\d{2} \| Critical \| Open \|/gm);
const constraintRows = scope.split('## Fail-closed product constraints')[1]?.split('## Current blockers')[0]?.match(/^\d+\. /gm) ?? [];
const acceptanceRows = acceptance.split('## Approval record')[0]?.split('\n').filter((line) => /^\| [^|-][^|]+ \| [^|]+ \| Pending \|$/.test(line)) ?? [];

const checks = [
  { id: 'twelve-current-operating-facts', passed: exactInventory(scope, 'LF', 12) && countRows(scope, /^\| LF-\d{2} \| [^|]+ \| [^|]+ \| Pending \|$/gm) === 12, detail: 'Exactly LF-01 through LF-12 remain Pending in the current scope.' },
  { id: 'seven-qualified-review-domains', passed: domainRows === 7 && exactInventory(scope, 'LRD', 7), detail: 'Exactly seven qualified-review domains remain Pending.' },
  { id: 'eight-current-official-sources', passed: sourceRows === 8 && exactInventory(sourceReview, 'SRC', 8), detail: 'Eight dated official-source review entries are present.' },
  { id: 'source-review-boundary', passed: sourceReview.includes('does not interpret the materials or reach a legal conclusion') && sourceReview.includes('Search-result summaries, third-party articles and Codex analysis cannot establish legal authority.'), detail: 'Official-source review remains factual and creates no legal conclusion.' },
  { id: 'eight-qualified-decisions-pending', passed: decisionRows === 8 && exactInventory(decisions, 'LDD', 8), detail: 'Exactly eight qualified legal/privacy decisions remain Pending.' },
  { id: 'seven-approval-fields-pending', passed: approvalFields === 7, detail: 'Exactly seven qualified-review approval fields remain Pending.' },
  { id: 'eight-fail-closed-constraints', passed: constraintRows.length === 8 && scope.includes('Local development and synthetic/paper evaluation only'), detail: 'Eight fail-closed product constraints block premature launch or live activity.' },
  { id: 'seven-critical-open-blockers', passed: blockerRows === 7, detail: 'Exactly seven Critical/Open legal-discovery blocker groups remain.' },
  { id: 'sixteen-legal-items-open', passed: exactInventory(matrix, 'LC', 16) && countRows(matrix, /^\| LC-\d{2} \|[^\n]+\| Open \|$/gm) === 16, detail: 'Exactly LC-01 through LC-16 remain Open.' },
  { id: 'privacy-and-records-inventory', passed: exactInventory(privacy, 'PR', 12) && exactInventory(privacy, 'RR', 8) && countRows(privacy, /^\| PR-\d{2} \|[^\n]+\| Pending \|$/gm) === 12, detail: 'PR-01–PR-12 remain Pending and RR-01–RR-08 require decisions.' },
  { id: 'legacy-acceptance-remains-pending', passed: acceptanceRows.length === 8 && acceptance.includes('Status: Pending qualified review'), detail: 'The retained acceptance record remains Pending across eight criteria.' },
  { id: 'current-compliance-predecessor-unapproved', passed: compliance.readinessDecision.startsWith('Prepared / Qualified Review') && compliance.qualifiedReviewExecuted === false && compliance.legalConclusionRecorded === false && compliance.privacyApproved === false && compliance.recordsScheduleApproved === false && compliance.approvalSigned === false, detail: 'Current compliance evidence confirms qualified review, privacy, records and approval remain unavailable.' },
  { id: 'no-public-provider-broker-or-trading-authority', passed: compliance.createsPublicAuthority === false && compliance.createsProviderAuthority === false && compliance.createsBrokerAuthority === false && compliance.createsPaperPilotAuthority === false && compliance.createsControlledLiveAuthority === false && compliance.createsLiveTradingAuthority === false, detail: 'Current compliance evidence creates no public, provider, broker, paper, pilot or live authority.' },
  { id: 'no-codex-legal-authority', passed: scope.includes('does not answer an operating fact, interpret law, determine classification, establish an exemption') && decisions.includes('Codex cannot provide legal advice, sign an opinion, determine a licence/exemption'), detail: 'Codex research cannot establish a conclusion, approval, contract or launch/trading authority.' },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Legal-discovery readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = scope
  .split('\n')
  .filter((line) => /^\| LDB-\d{2} \| Critical \| Open \|/.test(line))
  .map((line) => {
    const [, id, severity, state, description] = line.split('|').map((value) => value.trim());
    return { id, severity, state, description };
  });

const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));

const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 1.2 current legal and regulatory discovery readiness evidence only',
  readinessDecision: 'Prepared / Qualified Nigeria and Cross-Border Review Pending',
  inventory: {
    operatingFacts: 12,
    reviewDomains: domainRows,
    officialSources: sourceRows,
    qualifiedDecisions: decisionRows,
    approvalFields,
    constraints: constraintRows.length,
    legalItems: 16,
    privacyControls: 12,
    recordsDecisions: 8,
    blockers: blockerRows,
  },
  currentOfficialSourceReviewPrepared: true,
  qualifiedReviewExecuted: false,
  legalConclusionRecorded: false,
  operatorClassificationApproved: false,
  registrationOrExemptionDetermined: false,
  privacyApproved: false,
  recordsScheduleApproved: false,
  approvalSigned: false,
  publicationAuthorityCreated: false,
  providerAuthorityCreated: false,
  brokerAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  pilotAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/legal-discovery-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(
  `Legal discovery verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} Critical blockers; qualified review remains Pending and no publication or trading authority.`,
);
