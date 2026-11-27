import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/security/INDEPENDENT_SECURITY_CURRENT_SCOPE.md',
  'docs/security/INDEPENDENT_SECURITY_DECISION_REGISTER.md',
  'docs/security/SECURITY_ASSESSMENT_RULES_OF_ENGAGEMENT.md',
  'docs/security/SECURITY_FINDING_REGISTER.md',
  'docs/engineering/OPERATIONAL_READINESS_CURRENT_EVIDENCE.md',
  'docs/engineering/OPERATIONAL_READINESS_DECISION_REGISTER.md',
  'outputs/operational-readiness/current-evidence-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const scope = contents.get(evidenceFiles[0]);
const decisions = contents.get(evidenceFiles[1]);
const rules = contents.get(evidenceFiles[2]);
const register = contents.get(evidenceFiles[3]);
const operationalEvidence = contents.get(evidenceFiles[4]);
const operationalDecisions = contents.get(evidenceFiles[5]);
const operationalManifest = JSON.parse(contents.get(evidenceFiles[6]));
const ids = (prefix, count, width) => Array.from({ length: count }, (_, i) => `${prefix}-${String(i + 1).padStart(width, '0')}`);
const decision = 'Prepared / Independent Authorization, Execution, Remediation and Acceptance Pending';

const checks = [
  ['twenty-four-security-tests', ids('ST', 24, 3).every((id) => scope.includes(`| ${id} |`)) && (scope.match(/^\| ST-\d{3} \|/gm) ?? []).length === 24, 'Exactly ST-001 through ST-024 are defined.'],
  ['twenty-threat-mappings', ids('TM', 20, 2).every((id) => scope.includes(`| ${id} |`)) && (scope.match(/^\| TM-\d{2} \|/gm) ?? []).length === 20, 'Exactly TM-01 through TM-20 are mapped.'],
  ['twenty-mitigation-mappings', ids('SEC', 20, 3).every((id) => scope.includes(`| ${id} |`)), 'Exactly SEC-001 through SEC-020 are mapped.'],
  ['auth-and-trading-boundaries', ['Authentication', 'MFA', 'Authorization', 'Trading entry lock', 'Risk limits'].every((term) => scope.includes(term)), 'Identity, privilege, entry-lock and risk-control tests are in scope.'],
  ['assessor-independence-pending', decisions.includes('Assessor independence, qualifications and conflict declaration') && decisions.includes('| Security Lead | Pending |'), 'Assessor independence and acceptance remain pending.'],
  ['unsigned-rules-of-engagement', rules.includes('testing prohibited until authorized') && rules.includes('Codex cannot sign or approve this record.') && (rules.match(/____________________/g) ?? []).length >= 6, 'Rules of engagement remain unsigned and prohibit testing.'],
  ['isolated-target-pending', decisions.includes('Immutable release and isolated target inventory') && decisions.includes('| Engineering / Operations | Pending |'), 'No authorized immutable target is claimed.'],
  ['evidence-and-severity-defined', scope.includes('Immutable evidence per test') && scope.includes('Critical/High findings block acceptance'), 'Evidence custody, severity and blocking treatment are defined.'],
  ['assessment-not-executed', decisions.includes('| Independent Assessor | Not executed |'), 'Independent execution is explicitly not started.'],
  ['no-findings-or-passes', register.includes('No assessment executed; no findings or passes recorded') && register.includes('| Pending | Pending execution | Not assessed |'), 'No fabricated finding, pass or retest exists.'],
  ['remediation-and-retest-separate', decisions.includes('Remediation evidence for blocking findings') && decisions.includes('Independent retest and closure evidence'), 'Remediation and independent retest remain separate accountable steps.'],
  ['operational-gate-rejected', operationalManifest.gateAccepted === false && operationalManifest.entryLockCleared === false && operationalManifest.createsOperationalAuthority === false && operationalEvidence.includes('Reject / Defer') && operationalDecisions.includes('Reject / Defer'), 'Operational readiness remains rejected/deferred and entry lock remains set.'],
  ['historical-tests-qualified', scope.includes('cannot substitute for independent execution'), 'Internal and historical testing is not presented as independent assurance.'],
  ['no-security-or-trading-authority', scope.includes('No security, operational, paper-trading, pilot or live-trading authority is created.'), 'Preparation creates no security or trading authority.'],
].map(([id, passed, detail]) => ({ id, passed, detail }));

const failed = checks.filter(({ passed }) => !passed);
if (failed.length) throw new Error(`Independent-security readiness verification failed: ${failed.map(({ id }) => id).join(', ')}`);

const blockers = [
  'No accepted independent assessor, qualifications or conflict declaration exists.',
  'Rules of engagement, immutable release, isolated target, sources, identities and test window are unsigned.',
  'Operational readiness is rejected/deferred and the entry lock remains set.',
  'ST-001 through ST-024 have no authorized independent execution results.',
  'No finding triage, remediation or independent retest evidence exists.',
  'Security Lead, Sponsor, Operations and Risk acceptance is absent.',
  'No paper, pilot or live-trading promotion decision is authorized.',
];
const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 9.1 current hydrated independent-security preparation evidence',
  readinessDecision: decision,
  localPreparationControls: 'PASS',
  assessmentAuthorized: false,
  assessmentExecuted: false,
  findingsProduced: false,
  remediationCompleted: false,
  independentRetestCompleted: false,
  securityAccepted: false,
  entryLockCleared: false,
  createsOperationalAuthority: false,
  createsPaperTradingAuthority: false,
  createsLiveTradingAuthority: false,
  inventory: { securityTests: 24, threats: 20, mitigations: 20 },
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/independent-security'), { recursive: true });
const body = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(root, 'outputs/independent-security/current-readiness-manifest.json'), body, 'utf8');
console.log(`Independent-security preparation verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} blockers; no assessment, finding, acceptance or trading authority created.`);
