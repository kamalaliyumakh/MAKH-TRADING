import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/legal/LEGAL_COMPLIANCE_DISCOVERY.md',
  'docs/legal/LEGAL_EVIDENCE_MATRIX.md',
  'docs/legal/PRIVACY_AND_RECORDS_CHECKLIST.md',
  'docs/legal/DISCLOSURE_COPY_DRAFT.md',
  'docs/legal/LEGAL_DISCOVERY_ACCEPTANCE.md',
  'docs/legal/README.md',
  'outputs/scope-validation-readiness/readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const discovery = contents.get(evidenceFiles[0]);
const matrix = contents.get(evidenceFiles[1]);
const privacy = contents.get(evidenceFiles[2]);
const disclosure = contents.get(evidenceFiles[3]);
const acceptance = contents.get(evidenceFiles[4]);
const readme = contents.get(evidenceFiles[5]);
const predecessor = JSON.parse(contents.get(evidenceFiles[6]));
const ids = (prefix, count, width = 2) => Array.from({ length: count }, (_, index) => `${prefix}-${String(index + 1).padStart(width, '0')}`);
const exactInventory = (text, prefix, count, width = 2) => {
  const pattern = new RegExp(`^\\| ${prefix}-\\d{${width}} \\|`, 'gm');
  return (text.match(pattern) ?? []).length === count && ids(prefix, count, width).every((id) => text.includes(`| ${id} |`));
};

const primaryFindings = discovery.split('## Primary-source findings')[1]?.split('## Required operating facts')[0]?.match(/^\d+\. /gm) ?? [];
const launchConstraints = discovery.split('## Provisional launch constraints')[1]?.split('## Counsel deliverable requested')[0]?.match(/^- /gm) ?? [];
const disclosureSections = disclosure.match(/^## (?:Global product notice|Trading-risk notice|Data notice|Social-signal notice|Paper-mode notice|Broker notice|Performance and marketing rules|Consent presentation)$/gm) ?? [];
const acceptanceRows = acceptance.split('## Approval record')[0]?.split('\n').filter((line) => /^\| [^|-][^|]+ \| [^|]+ \| Pending \|$/.test(line)) ?? [];
const acceptanceFields = acceptance.split('## Approval record')[1]?.split('## Local readiness verification')[0]?.split('\n').filter((line) => /^\| [^|-][^|]+ \| Pending/.test(line)) ?? [];

const checks = [
  { id: 'seven-primary-source-findings', passed: primaryFindings.length === 7, detail: 'Seven primary-source findings frame the qualified-review questions.' },
  { id: 'twelve-operating-facts-pending', passed: exactInventory(discovery, 'LF', 12) && (discovery.match(/^\| LF-\d{2} \|[^\n]+\| Pending \|$/gm) ?? []).length === 12, detail: 'Exactly LF-01 through LF-12 exist and remain Pending.' },
  { id: 'seven-launch-constraints', passed: launchConstraints.length === 7 && discovery.includes('not legal advice or approval'), detail: 'Seven provisional constraints block premature public or live activity.' },
  { id: 'sixteen-legal-items-open', passed: exactInventory(matrix, 'LC', 16) && (matrix.match(/^\| LC-\d{2} \|[^\n]+\| Open \|$/gm) ?? []).length === 16, detail: 'Exactly LC-01 through LC-16 exist and remain Open.' },
  { id: 'privacy-and-records-inventory', passed: exactInventory(privacy, 'PR', 12) && exactInventory(privacy, 'RR', 8) && (privacy.match(/^\| PR-\d{2} \|[^\n]+\| Pending \|$/gm) ?? []).length === 12, detail: 'PR-01 through PR-12 remain Pending and RR-01 through RR-08 require decisions.' },
  { id: 'eight-disclosure-sections', passed: disclosureSections.length === 8 && disclosure.includes('not approved for publication'), detail: 'Eight draft disclosure sections remain unapproved for publication.' },
  { id: 'eight-acceptance-criteria-pending', passed: acceptanceRows.length === 8, detail: 'All eight legal-discovery acceptance criteria remain pending qualified acceptance.' },
  { id: 'seven-approval-fields-pending', passed: acceptanceFields.length === 7 && acceptance.includes('Status: Pending qualified review'), detail: 'All seven approval-record fields remain Pending.' },
  { id: 'predecessor-and-authority-boundary', passed: predecessor.scopeApproved === false && predecessor.productOwnerApprovalRecorded === false && predecessor.downstreamGateAuthorityCreated === false && predecessor.publicationAuthorityCreated === false && predecessor.liveTradingAuthorityCreated === false && readme.includes('No registration, licence, exemption, privacy compliance, approved disclosure or launch authorization is claimed.'), detail: 'WBS 1.1 remains unavailable and no legal conclusion, publication or trading authority is inferred.' },
];
const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) throw new Error(`Legal-discovery readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);

const blockers = [
  'WBS 1.1 Product Owner scope approval remains unavailable.',
  'LF-01 through LF-12 operating facts are unconfirmed.',
  'LC-01 through LC-16 lack qualified jurisdiction-specific disposition.',
  'Privacy, records, provider-rights, broker-eligibility and launch constraints lack approval.',
  'The qualified reviewer, conclusion, conditions and durable approval record remain Pending.',
];
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 1.2 local legal/compliance discovery readiness evidence only',
  readinessDecision: 'Prepared / Qualified Review Pending',
  qualifiedReviewExecuted: false,
  legalConclusionRecorded: false,
  predecessorAccepted: false,
  approvalSigned: false,
  publicationAuthorityCreated: false,
  providerAuthorityCreated: false,
  brokerAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};
const outputDirectory = path.join(root, 'outputs/legal-discovery-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Legal discovery prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; qualified review remains Pending and no publication or trading authority created.`);
