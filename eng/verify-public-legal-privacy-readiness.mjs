import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/PUBLIC_LEGAL_PRIVACY_ACCEPTANCE.md',
  'docs/ux/landing/PUBLIC_COPY_DECK.md',
  'apps/web-public/src/app/legal-documents.ts',
  'apps/web-public/src/app/risk-page.ts',
  'apps/web-public/src/app/privacy-page.ts',
  'apps/web-public/src/styles.scss',
  'apps/web-public/src/app/app.spec.ts',
  'outputs/legal-discovery-readiness/current-readiness-manifest.json',
  'outputs/landing-ux-readiness/current-readiness-manifest.json',
  'outputs/public-shell-readiness/current-readiness-manifest.json',
  'outputs/public-content-readiness/current-readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, readFileSync(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const copy = contents.get(files[1]);
const documents = contents.get(files[2]);
const risk = contents.get(files[3]);
const privacy = contents.get(files[4]);
const styles = contents.get(files[5]);
const tests = contents.get(files[6]);
const legalDiscovery = JSON.parse(contents.get(files[7]));
const landing = JSON.parse(contents.get(files[8]));
const shell = JSON.parse(contents.get(files[9]));
const content = JSON.parse(contents.get(files[10]));

const checks = [
  { id: 'versioned-draft-metadata', passed: documents.includes('MAKH-RISK-DRAFT') && documents.includes('MAKH-PRIVACY-DRAFT') && (documents.match(/version: '0\.1-draft'/g) ?? []).length === 2 && documents.includes('not approved for publication'), detail: 'Both documents have stable draft IDs, versions, review dates and provisional status.' },
  { id: 'risk-disclosure-coverage', passed: ['100% and 600%', 'Liquidity, spreads and execution', 'Stops, gaps and trading halts', 'Market data, evidence and social manipulation', 'Technology, connectivity and broker authority', 'Paper and historical-result limitations'].every((term) => risk.includes(term)), detail: 'Risk coverage includes exceptional moves, liquidity/execution, stops/halts, data/social, technology/broker and paper limitations.' },
  { id: 'broker-and-self-directed-boundary', passed: risk.includes('broker remains authoritative') && /MAKH does not custody funds or securities and does\s+not promise profit/.test(risk), detail: 'Risk copy retains broker authority, no-custody and no-guarantee boundaries.' },
  { id: 'privacy-scope-coverage', passed: ['Data we may process', 'Why information may be used', 'Providers and international processing', 'Retention and records', 'Your choices and rights', 'Analytics and cookies', 'Security, controller and contact'].every((term) => privacy.includes(term)), detail: 'Privacy copy covers anticipated categories, purposes, providers/transfers, retention, rights, analytics and security/contact.' },
  { id: 'data-minimization-and-analytics-lockout', passed: privacy.includes('Do not provide broker passwords') && privacy.includes('Nonessential analytics will') && privacy.includes('remain disabled') && privacy.includes('No privacy request, cookie preference or consent is transmitted'), detail: 'Sensitive public collection is prohibited and nonessential analytics remain disabled.' },
  { id: 'no-public-acceptance-capture', passed: risk.includes('does not record acceptance') && privacy.includes('No privacy request, cookie preference or consent is transmitted') && !risk.includes('type="checkbox"') && !privacy.includes('type="checkbox"'), detail: 'Public legal routes contain no acceptance or consent capture.' },
  { id: 'contents-and-print-controls', passed: risk.includes('Risk disclosure contents') && privacy.includes('Privacy notice contents') && risk.includes('printPage()') && styles.includes('@media print') && styles.includes('break-inside: avoid'), detail: 'On-page contents and print controls are present, with section break avoidance.' },
  { id: 'primary-source-baseline', passed: risk.includes('sec.gov') && risk.includes('finra.org') && risk.includes('investor.gov') && privacy.includes('ndpc.gov.ng') && acceptance.includes('do not establish MAKH'), detail: 'Primary regulator sources are linked without implying approval or a legal conclusion.' },
  { id: 'copy-deck-traceability', passed: copy.includes('CP-06 — Legal/Risk') && copy.includes('CP-07 — Privacy'), detail: 'Risk and privacy routes trace to CP-06 and CP-07.' },
  { id: 'focused-regression-evidence', passed: tests.includes('versioned risk draft') && tests.includes('provisional privacy notice') && acceptance.includes('26 passing test instances'), detail: 'Focused legal/privacy assertions remain in the 26-instance public test run.' },
  { id: 'predecessors-unaccepted', passed: legalDiscovery.readinessDecision.includes('Pending') && landing.readinessDecision.includes('Pending') && shell.shellAccepted === false && content.contentAccepted === false, detail: 'Legal discovery, landing UX, shell and content predecessors remain unaccepted.' },
  { id: 'no-publication-or-trading-authority', passed: acceptance.includes('does not authorize publication, analytics, paper trading or live trading'), detail: 'The acceptance record grants no publication, analytics or trading authority.' },
  { id: 'current-predecessor-contracts', passed: [legalDiscovery, landing, shell, content].every((item) => item.schemaVersion === 3), detail: 'Current schema-v3 legal, UX, shell and content predecessor evidence is consumed.' },
  { id: 'draft-publication-boundary', passed: documents.includes('not approved for publication') && legalDiscovery.qualifiedReviewExecuted === false && content.publicLaunchAuthorized === false, detail: 'Draft documents remain explicitly unpublished and unapproved.' },
  { id: 'personal-data-boundary', passed: privacy.includes('Do not provide broker passwords') && landing.personalDataCaptureAuthorized === false && shell.externalUserAuthorityCreated === false, detail: 'Sensitive-data minimization is reinforced by disabled public capture and external-user authority.' },
  { id: 'qualified-review-separation', passed: acceptance.includes('qualified legal/privacy') && acceptance.includes('Frontend Lead') && acceptance.includes('Product Owner'), detail: 'Qualified legal/privacy and accountable product/frontend acceptance remains separate from local evidence.' },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) throw new Error(`Public legal/privacy readiness checks failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  { id: 'LPB-01', severity: 'Critical', status: 'Open', detail: 'WBS 1.2 qualified legal/privacy review remains open.' },
  { id: 'LPB-02', severity: 'Critical', status: 'Open', detail: 'WBS 2.6 copy approval remains open.' },
  { id: 'LPB-03', severity: 'Critical', status: 'Open', detail: 'Legal entity, jurisdiction and controller roles remain unresolved.' },
  { id: 'LPB-04', severity: 'Critical', status: 'Open', detail: 'Lawful bases, retention and international-transfer facts remain unresolved.' },
  { id: 'LPB-05', severity: 'Critical', status: 'Open', detail: 'Contacts, rights and dispute terms remain unresolved.' },
  { id: 'LPB-06', severity: 'Critical', status: 'Open', detail: 'Authenticated versioned acknowledgement requirements remain pending.' },
  { id: 'LPB-07', severity: 'Critical', status: 'Open', detail: 'Authenticated acknowledgement implementation remains pending.' },
  { id: 'LPB-08', severity: 'Critical', status: 'Open', detail: 'Frontend, accessibility, Security and Product acceptance remain pending.' },
  { id: 'LPB-09', severity: 'Critical', status: 'Open', detail: 'Publication, analytics and production identity remain unauthorized.' },
  { id: 'LPB-10', severity: 'Critical', status: 'Open', detail: 'Broker, market-data, paper and live connections remain unauthorized.' },
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 4.3 Public Legal and Privacy Routes readiness',
  localControls: 'PASS',
  readinessDecision: 'Implementation Ready / Qualified Approval Pending',
  legalPrivacyAccepted: false,
  publicLaunchAuthorized: false,
  analyticsAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  qualifiedLegalApprovalRecorded: false,
  qualifiedPrivacyApprovalRecorded: false,
  accessibilityAccepted: false,
  productOwnerApprovalRecorded: false,
  frontendLeadApprovalRecorded: false,
  personalDataCaptureAuthorized: false,
  externalUserAuthorityCreated: false,
  inventory: {
    legalDocuments: 2,
    checks: checks.length,
    blockers: blockers.length,
    artifacts: artifacts.length,
  },
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/public-legal-privacy-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/public-legal-privacy-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(root, 'outputs/public-legal-privacy-readiness/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Public legal/privacy routes: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Implementation Ready / Qualified Approval Pending.`);
