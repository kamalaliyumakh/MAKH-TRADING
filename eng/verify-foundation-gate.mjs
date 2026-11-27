import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const failures = [];
const requiredEvidence = [
  'docs/engineering/FOUNDATION_GATE_REVIEW.md',
  'docs/engineering/FOUNDATION_GATE_APPROVAL.md',
  'docs/engineering/POSTGRESQL_FOUNDATION_ACCEPTANCE.md',
  'docs/engineering/IDENTITY_FOUNDATION_ACCEPTANCE.md',
  'docs/engineering/DEVSECOPS_FOUNDATION_ACCEPTANCE.md',
  'docs/engineering/ENVIRONMENT_FOUNDATION_ACCEPTANCE.md',
  'docs/engineering/DATA_PROTECTION_CONFIGURATION_ACCEPTANCE.md',
  'docs/engineering/CI_EVIDENCE_RETENTION_ACCEPTANCE.md',
];

for (const relative of requiredEvidence) {
  try {
    await fs.access(path.join(root, relative));
  } catch {
    failures.push(`missing evidence: ${relative}`);
  }
}

const manifests = await Promise.all(
  ['dev', 'test', 'staging'].map(async (name) =>
    JSON.parse(await fs.readFile(path.join(root, 'deploy/environments', `${name}.json`), 'utf8')),
  ),
);
for (const manifest of manifests) {
  if (manifest.dataClass !== 'synthetic-only' || manifest.entryLocked !== true)
    failures.push(`${manifest.name}: foundation gate requires synthetic-only entry lock`);
  if (manifest.trading?.liveConnectivityAllowed !== false)
    failures.push(`${manifest.name}: live connectivity must be denied`);
  if (manifest.database?.runtimeDdlAllowed !== false)
    failures.push(`${manifest.name}: runtime DDL must be denied`);
}

const blockers = [
  'architecture-gate-approval',
  'component-owner-acceptance',
  'hosted-ci-and-signing-evidence',
  'postgresql-18-certification',
  'identity-provider-and-shared-key-deployment',
  'approved-infrastructure-and-private-connectivity',
  'timed-recovery-exercise',
];

if (failures.length > 0)
  throw new Error(`Foundation gate verification failed:\n${failures.join('\n')}`);

console.log(JSON.stringify({
  gate: 'WBS-3.8',
  localControls: 'PASS',
  decision: 'DEFER',
  entryLocked: true,
  liveAuthorized: false,
  blockers,
}, null, 2));
