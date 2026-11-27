import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/legal/COMPLIANCE_CURRENT_SCOPE.md',
  'docs/legal/COMPLIANCE_SOURCE_REVIEW.md',
  'docs/legal/COMPLIANCE_EVIDENCE_INDEX.md',
  'docs/legal/COMPLIANCE_APPROVAL_RECORD.md',
  'docs/legal/LEGAL_EVIDENCE_MATRIX.md',
  'docs/legal/PRIVACY_AND_RECORDS_CHECKLIST.md',
  'docs/engineering/COMPLIANCE_EVIDENCE_ACCEPTANCE.md',
  'outputs/independent-security/current-readiness-manifest.json',
  'outputs/operational-readiness/current-evidence-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
const scope = contents.get(evidenceFiles[0]);
const sources = contents.get(evidenceFiles[1]);
const index = contents.get(evidenceFiles[2]);
const approval = contents.get(evidenceFiles[3]);
const matrix = contents.get(evidenceFiles[4]);
const privacy = contents.get(evidenceFiles[5]);
const acceptance = contents.get(evidenceFiles[6]);
const security = JSON.parse(contents.get(evidenceFiles[7]));
const operations = JSON.parse(contents.get(evidenceFiles[8]));
const ids = (prefix, count, width) => Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(width, '0')}`);
const exact = (text, prefix, count, width) => ids(prefix, count, width).every((id) => text.includes(`| ${id} |`)) && (text.match(new RegExp(`^\\| ${prefix}-\\d{${width}} \\|`, 'gm')) ?? []).length === count;
const decision = 'Prepared / Qualified Review, Evidence Closure and Accountable Approval Pending';

const checks = [
  ['twelve-operating-facts-pending', exact(scope, 'LF', 12, 2) && (scope.match(/^\| LF-\d{2} \|[^\n]+\| Pending \|$/gm) ?? []).length === 12, 'Exactly LF-01 through LF-12 remain Pending.'],
  ['six-qualified-review-domains', (scope.match(/^\| (?:Entity|Broker|Privacy|Provider|Claims|Records)[^\n]+\| Open \|$/gm) ?? []).length === 6, 'Six review domains remain Open.'],
  ['sixteen-legal-items-open', exact(matrix, 'LC', 16, 2) && (matrix.match(/^\| LC-\d{2} \|[^\n]+\| Open \|$/gm) ?? []).length === 16, 'Exactly LC-01 through LC-16 remain Open.'],
  ['privacy-inventory-pending', exact(privacy, 'PR', 12, 2) && (privacy.match(/^\| PR-\d{2} \|[^\n]+\| Pending \|$/gm) ?? []).length === 12, 'Exactly PR-01 through PR-12 remain Pending.'],
  ['records-inventory-present', exact(privacy, 'RR', 8, 2), 'Exactly RR-01 through RR-08 require decisions.'],
  ['sixteen-evidence-items-pending', exact(index, 'CE', 16, 3) && (index.match(/^\| CE-\d{3} \|[^\n]+\| Pending \|$/gm) ?? []).length === 16, 'Exactly CE-001 through CE-016 lack qualified disposition.'],
  ['primary-source-review-bounded', sources.includes('does not interpret the law') && sources.includes('Search results, project notes and this log are not authoritative legal advice.'), 'Current official pointers are logged without a legal conclusion.'],
  ['unsigned-approval-record', approval.includes('Status: Unsigned template — not approved') && (approval.match(/^\| (?:Qualified Legal\/Compliance reviewer|Privacy owner|Product Owner|Sponsor) \| Pending \| Pending \| Pending \| Pending \|$/gm) ?? []).length === 4, 'Four accountable acknowledgements remain unsigned.'],
  ['qualified-review-boundary', scope.includes('only by the identified qualified reviewer') && acceptance.includes('No qualified reviewer, opinion, registration/licence conclusion'), 'Only a qualified reviewer can record legal conclusions.'],
  ['change-trigger-defined', scope.includes('Material changes to users, jurisdictions, compensation, recommendations, broker/order flow, providers, personal data or claims trigger re-review.'), 'Material product and operating changes trigger re-review.'],
  ['security-predecessor-unaccepted', security.assessmentExecuted === false && security.securityAccepted === false && security.entryLockCleared === false, 'Independent security remains unexecuted and unaccepted.'],
  ['operations-predecessor-rejected', operations.gateAccepted === false && operations.entryLockCleared === false && operations.createsOperationalAuthority === false, 'Operational readiness remains rejected/deferred.'],
  ['no-legal-conclusion-or-approval', !approval.includes('| Decision | Approved |') && approval.includes('| Decision | Pending — Approve / Approve with conditions / Reject / Defer |'), 'No legal conclusion or accountable approval is represented.'],
  ['no-release-or-trading-authority', scope.includes('creates no public, production, provider, broker, paper, pilot, controlled-live or live-trading authority.'), 'Preparation creates no release or trading authority.'],
].map(([id, passed, detail]) => ({ id, passed, detail }));

const failed = checks.filter(({ passed }) => !passed);
if (failed.length) throw new Error(`Compliance-evidence readiness verification failed: ${failed.map(({ id }) => id).join(', ')}`);
const blockers = [
  'LF-01 through LF-12 operating facts are unconfirmed.',
  'LC-01 through LC-16 have no qualified disposition.',
  'PR-01 through PR-12 and RR-01 through RR-08 lack accountable approval.',
  'CE-001 through CE-016 lack qualified disposition and durable evidence closure.',
  'No qualified reviewer, scoped opinion or registration/licence conclusion exists.',
  'Broker eligibility and provider content/data rights are unconfirmed.',
  'The compliance approval record is unsigned.',
  'Independent security is unexecuted and operational readiness is rejected/deferred.',
];
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 9.2 current hydrated legal/compliance evidence preparation',
  readinessDecision: decision,
  localPreparationControls: 'PASS',
  qualifiedReviewExecuted: false,
  legalConclusionRecorded: false,
  privacyApproved: false,
  recordsScheduleApproved: false,
  approvalSigned: false,
  gateAccepted: false,
  entryLockCleared: false,
  createsPublicAuthority: false,
  createsProviderAuthority: false,
  createsBrokerAuthority: false,
  createsPaperPilotAuthority: false,
  createsControlledLiveAuthority: false,
  createsLiveTradingAuthority: false,
  inventory: { operatingFacts: 12, reviewDomains: 6, legalItems: 16, privacyItems: 12, recordsItems: 8, evidenceItems: 16 },
  checks,
  blockers,
  artifacts,
};
await mkdir(path.join(root, 'outputs/compliance-evidence'), { recursive: true });
await writeFile(path.join(root, 'outputs/compliance-evidence/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Compliance-evidence preparation verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} blockers; no qualified conclusion, approval or authority created.`);
