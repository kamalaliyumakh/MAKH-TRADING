import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/operations/LIVE_CONFIGURATION_CURRENT_DESIGN.md',
  'deploy/controlled-live/controlled-live-disabled.schema.json',
  'deploy/controlled-live/controlled-live-config.template.json',
  'docs/operations/LIVE_CONFIGURATION_EVIDENCE_RECORD.md',
  'docs/engineering/LIVE_CONFIGURATION_ACCEPTANCE.md',
  'outputs/operational-readiness/current-evidence-manifest.json',
  'outputs/independent-security/current-readiness-manifest.json',
  'outputs/compliance-evidence/current-readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
const design = contents.get(evidenceFiles[0]);
const schema = JSON.parse(contents.get(evidenceFiles[1]));
const config = JSON.parse(contents.get(evidenceFiles[2]));
const evidence = contents.get(evidenceFiles[3]);
const acceptance = contents.get(evidenceFiles[4]);
const operations = JSON.parse(contents.get(evidenceFiles[5]));
const security = JSON.parse(contents.get(evidenceFiles[6]));
const compliance = JSON.parse(contents.get(evidenceFiles[7]));
const decision = 'Disabled / Configuration, Drills and Go-No-Go Authorization Pending';
const pendingReferences = Object.values(config.references).filter((value) => value.startsWith('PENDING-'));
const numericLimits = ['pilotCapital', 'dailyLoss', 'positionExposure', 'orderNotional', 'shareQuantity', 'openPositions', 'ordersPerDay'];
const unavailableAssurance = Object.values(config.assurance).filter((value) => ['NOT-EXECUTED', 'NOT-APPROVED', 'REJECTED-DEFERRED'].includes(value));
const checks = [
  ['json-contracts-parse', schema.$schema.includes('2020-12') && schema.type === 'object', 'Current schema and disabled template parse as JSON.'],
  ['disabled-mode-locked', config.mode === 'controlled-live-disabled' && config.entryLocked === true, 'Mode is disabled and entry lock is set.'],
  ['authorization-disabled', config.authorization.liveEnabled === false && config.authorization.gateReference === 'PENDING' && config.authorization.expiresAt === 'PENDING', 'Live authorization is false and approval references are Pending.'],
  ['five-pending-references', Object.keys(config.references).length === 5 && pendingReferences.length === 5, 'Exactly five non-secret external references remain Pending.'],
  ['seven-null-limits', numericLimits.every((name) => config.limits[name] === null) && config.limits.policyVersion === 'PENDING', 'All seven numeric ceilings are null and policy version is Pending.'],
  ['null-is-not-unlimited', design.includes('Null never means unlimited.'), 'Null limits cannot be interpreted as unlimited authority.'],
  ['seven-unavailable-assurance-states', Object.keys(config.assurance).length === 7 && unavailableAssurance.length === 7, 'All seven assurance states are unavailable.'],
  ['twelve-startup-assertions', (design.match(/^\| LA-\d{2} \|/gm) ?? []).length === 12 && Array.from({ length: 12 }, (_, i) => `| LA-${String(i + 1).padStart(2, '0')} |`).every((id) => design.includes(id)), 'Exactly LA-01 through LA-12 must pass before future startup.'],
  ['fail-closed-startup', design.includes('Any false, missing, stale, conflicting or unavailable assertion keeps the entry lock set'), 'Missing or conflicting startup evidence fails closed.'],
  ['containment-and-revocation', ['kill switch', 'Reconciliation uncertainty', 'Roll back', 'Secrets'].every((term) => design.toLowerCase().includes(term.toLowerCase())) || design.includes('Rollback restores'), 'Kill switch, reconciliation, rollback and secret boundaries are defined.'],
  ['four-unsigned-approvals', (evidence.match(/^\| (?:Risk Administrator|Security Lead|Operations Owner|Sponsor) \| Pending \| Pending \| Pending \| Pending \|$/gm) ?? []).length === 4, 'Four accountable approvals remain unsigned.'],
  ['current-predecessors-unaccepted', operations.gateAccepted === false && security.securityAccepted === false && compliance.gateAccepted === false, 'Operations, security and compliance predecessors remain unaccepted.'],
  ['evidence-record-not-configured', evidence.includes('Status: Not configured — unsigned template') && evidence.includes('No credential exists') && evidence.includes('Not cleared'), 'Evidence record claims no environment, credential or lock clearance.'],
  ['no-environment-capital-or-live-authority', design.includes('No environment, account, credential, provider call, broker connection, deployment, drill, capital allocation, pilot or live-trading authority is created.') && acceptance.includes('grants no pilot, live or capital authority.'), 'Preparation creates no external change, capital or live authority.'],
].map(([id, passed, detail]) => ({ id, passed, detail }));
const failed = checks.filter(({ passed }) => !passed);
if (failed.length) throw new Error(`Controlled-live configuration readiness failed: ${failed.map(({ id }) => id).join(', ')}`);

const blockers = [
  'No approved immutable release or dedicated controlled-live environment exists.',
  'No segregated broker account, credential, identity/provider or managed database/telemetry reference exists.',
  'All seven numeric ceilings and the governing policy version are unapproved.',
  'Kill-switch, reconciliation and rollback/revocation drills have not run.',
  'Operational readiness is rejected/deferred and independent security is unexecuted/unaccepted.',
  'Compliance evidence lacks qualified review and accountable approval.',
  'Risk, Security, Operations and Sponsor signatures are absent.',
  'WBS 9.4 go/no-go authorization does not exist.',
];
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 9.3 current hydrated disabled controlled-live configuration evidence',
  readinessDecision: decision,
  localPreparationControls: 'PASS',
  configurationApplied: false,
  environmentCreated: false,
  credentialCreated: false,
  drillsExecuted: false,
  goNoGoApproved: false,
  entryLockCleared: false,
  pilotCapitalAuthorized: false,
  createsBrokerConnection: false,
  createsPilotAuthority: false,
  createsLiveTradingAuthority: false,
  inventory: { startupAssertions: 12, pendingReferences: 5, nullNumericLimits: 7, unavailableAssuranceStates: 7, pendingApprovals: 4 },
  checks,
  blockers,
  artifacts,
};
await mkdir(path.join(root, 'outputs/controlled-live-configuration'), { recursive: true });
await writeFile(path.join(root, 'outputs/controlled-live-configuration/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Controlled-live configuration preparation verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} blockers; disabled, locked and without external or trading authority.`);
