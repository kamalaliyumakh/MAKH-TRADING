import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const environmentDirectory = path.join(root, 'deploy', 'environments');
const expected = ['dev', 'test', 'staging'];
const failures = [];

for (const name of expected) {
  const manifest = JSON.parse(
    await fs.readFile(path.join(environmentDirectory, `${name}.json`), 'utf8'),
  );
  if (manifest.name !== name) failures.push(`${name}: name mismatch`);
  if (manifest.dataClass !== 'synthetic-only')
    failures.push(`${name}: production data is forbidden`);
  if (manifest.entryLocked !== true)
    failures.push(`${name}: restored/startup state must be entry-locked`);
  if (!['synthetic', 'paper'].includes(manifest.accountMode))
    failures.push(`${name}: invalid account mode`);
  if (manifest.database?.version !== '18') failures.push(`${name}: PostgreSQL 18 is required`);
  if (manifest.database?.pointInTimeRestore !== true) failures.push(`${name}: PITR is required`);
  if (manifest.database?.backupRetentionDays < 7 || manifest.database?.backupRetentionDays > 35)
    failures.push(`${name}: backup retention must be 7-35 days`);
  if (manifest.database?.rpoMinutes !== 5 || manifest.database?.rtoMinutes !== 60)
    failures.push(`${name}: planning RPO/RTO changed without approval`);
  if (
    manifest.database?.ownerRole !== 'makh_owner' ||
    manifest.database?.migrationRole !== 'makh_migrator' ||
    manifest.database?.runtimeRole !== 'makh_runtime' ||
    manifest.database?.runtimeDdlAllowed !== false
  )
    failures.push(`${name}: database role separation or runtime DDL denial is missing`);
  if (manifest.identity?.providerConfigured !== false)
    failures.push(`${name}: no identity provider has been approved`);
  if (manifest.identity?.recoveryExerciseRequired !== true)
    failures.push(`${name}: Data Protection recovery exercise must remain required`);
  if (manifest.identity?.rotationDays < 30 || manifest.identity?.rotationDays > 90)
    failures.push(`${name}: Data Protection rotation must be 30-90 days`);
  if (name !== 'dev' && (
    manifest.identity?.sharedKeyRingRequired !== true ||
    manifest.identity?.certificateProtectionRequired !== true
  ))
    failures.push(`${name}: shared certificate-protected Data Protection keys are required`);
  if (
    manifest.trading?.paperConnectivityAllowed !== false ||
    manifest.trading?.liveConnectivityAllowed !== false ||
    manifest.trading?.brokerCredentialsAllowed !== false
  )
    failures.push(`${name}: broker connectivity and credentials must remain disabled`);
  if (manifest.telemetry?.retentionDays < 7 || manifest.telemetry?.retentionDays > 90)
    failures.push(`${name}: telemetry retention is outside policy`);
  const serialized = JSON.stringify(manifest).toLowerCase();
  if (/password|secret|token|connectionstring/.test(serialized))
    failures.push(`${name}: manifest appears to contain secret material`);
}

const bicep = await fs.readFile(path.join(root, 'deploy', 'azure', 'main.bicep'), 'utf8');
for (const control of [
  "@allowed(['dev', 'test', 'staging'])",
  "'data-classification': 'synthetic-only'",
  "'live-authorized': 'false'",
  "publicNetworkAccess: 'Disabled'",
  'enablePurgeProtection: true',
  "version: '18'",
  "value: 'true'",
  'sha256 digest',
]) {
  if (!bicep.includes(control)) failures.push(`Azure template missing control: ${control}`);
}
if (/param\s+\w*(?:secret|token|connectionString)\w*\s+string/i.test(bicep))
  failures.push('Azure template must accept secret references, not general secret parameters');

if (failures.length > 0)
  throw new Error(`Environment foundation violations:\n${failures.join('\n')}`);
console.log(
  'Environment foundation verified: 3 synthetic-only manifests, entry lock, database role separation, protected shared-key requirements, disabled broker connectivity, telemetry, PostgreSQL 18 and recovery controls.',
);
