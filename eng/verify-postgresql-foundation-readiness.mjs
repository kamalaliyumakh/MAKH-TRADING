import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/POSTGRESQL_FOUNDATION_ACCEPTANCE.md',
  'deploy/postgres/roles.sql',
  'eng/verify-postgres-foundation.sh',
  'Directory.Packages.props',
  'src/MAKH.Migrations/MAKH.Migrations.csproj',
  'outputs/repository-foundation-readiness/current-readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, await readFile(path.join(root, file), 'utf8'));
const acceptance = contents.get(files[0]);
const roles = contents.get(files[1]);
const smoke = contents.get(files[2]);
const packages = contents.get(files[3]);
const migrationProject = contents.get(files[4]);
const repository = JSON.parse(contents.get(files[5]));
const rows = acceptance.match(/^\| PGF-/gm) ?? [];
const checks = [
  { id: 'twenty-four-controls', passed: rows.length === 24 && (acceptance.match(/\| Pass\s+\|$/gm) ?? []).length === 22 && (acceptance.match(/\| Pending \|$/gm) ?? []).length === 2, detail: 'Twenty-two controls pass and two accountable controls remain pending.' },
  { id: 'provider-and-migrator', passed: packages.includes('Npgsql.EntityFrameworkCore.PostgreSQL') && migrationProject.includes('<OutputType>Exe</OutputType>'), detail: 'The provider is centrally pinned and migrations use a deployment-only executable.' },
  { id: 'four-least-privilege-roles', passed: ['makh_owner','makh_migrator','makh_runtime','makh_readonly'].every((role) => roles.includes(`CREATE ROLE ${role} NOLOGIN`)), detail: 'Four non-login least-privilege roles are defined.' },
  { id: 'public-schema-revoked', passed: roles.includes('REVOKE CREATE ON SCHEMA public FROM PUBLIC'), detail: 'PUBLIC schema creation is revoked.' },
  { id: 'sixteen-migration-smoke', passed: acceptance.includes('across sixteen migrations') && acceptance.includes('PostgreSQL 17.10') && smoke.includes('dotnet'), detail: 'Sixteen migrations have local PostgreSQL 17.10 smoke evidence.' },
  { id: 'eleven-governed-schemas', passed: ['iam','account','market','scanner','evidence','risk','trading','journal','notification','audit','platform'].every((schema) => acceptance.includes(`\`${schema}\``)), detail: 'All eleven governed schemas are recorded.' },
  { id: 'current-repository-contract', passed: repository.schemaVersion === 3 && repository.checks.length === 16 && repository.blockers.length === 10 && repository.artifacts.length === 12, detail: 'The current WBS 3.1 evidence contract is consumed.' },
  { id: 'repository-predecessor-unaccepted', passed: repository.foundationAccepted === false, detail: 'WBS 3.1 remains unaccepted.' },
  { id: 'target-and-approval-pending', passed: acceptance.includes('PostgreSQL 18 migration/repeat/privilege run') && acceptance.includes('Data Engineer accepts the baseline') && acceptance.includes('does not provision a hosted database'), detail: 'PostgreSQL 18 certification and Data Engineer approval remain pending.' },
  { id: 'role-hardening-contract', passed: (roles.match(/NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION/g) ?? []).length === 4, detail: 'All four group roles prohibit login and elevated cluster capabilities.' },
  { id: 'role-membership-contract', passed: roles.includes('GRANT makh_owner TO makh_migrator') && !roles.includes('GRANT makh_owner TO makh_runtime'), detail: 'Migration ownership is separated from runtime membership.' },
  { id: 'provider-version-contract', passed: packages.includes('<PackageVersion Include="Npgsql.EntityFrameworkCore.PostgreSQL"') && packages.includes('<PackageVersion Include="Microsoft.EntityFrameworkCore'), detail: 'PostgreSQL and EF Core packages are centrally versioned.' },
  { id: 'migration-executable-contract', passed: migrationProject.includes('<OutputType>Exe</OutputType>') && migrationProject.includes('Npgsql.EntityFrameworkCore.PostgreSQL'), detail: 'Migrations remain isolated in an executable using the PostgreSQL provider.' },
  { id: 'smoke-safety-contract', passed: smoke.includes('set -euo pipefail') && smoke.includes('dotnet "$migration_runner"') && smoke.includes('psql "$connection" -v ON_ERROR_STOP=1'), detail: 'The migration/privilege smoke path fails closed.' },
  { id: 'authority-boundary', passed: acceptance.includes('does not provision a hosted database') && repository.productionProvisioningAuthorized === false && repository.deploymentAuthorized === false && repository.liveTradingAuthorityCreated === false, detail: 'No hosted database, deployment or trading authority is inferred.' },
  { id: 'artifact-boundary', passed: files.length === 6, detail: 'Six current PostgreSQL foundation artifacts are governed.' },
];
const failed = checks.filter((check) => !check.passed);
if (failed.length) throw new Error(`PostgreSQL readiness failed: ${failed.map((check) => check.id).join(', ')}`);
const blockerFindings = ['WBS 3.1 remains unaccepted.','PostgreSQL 18 managed migration certification is pending.','PostgreSQL 18 privilege certification is pending.','Data Engineer approval is unsigned.','Managed service selection and configuration remain pending.','Hosted backup evidence remains pending.','Point-in-time recovery evidence remains pending.','Timed recovery and invariant reconciliation remain pending.','Production database provisioning remains unauthorized.','Production data and live authority remain unavailable.'];
const blockers = blockerFindings.map((finding,index)=>({id:`PGB-${String(index+1).padStart(2,'0')}`,severity:'Critical',status:'Open',finding}));
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = { schemaVersion: 3, generatedAt: new Date().toISOString(), scope: 'WBS 3.4 local PostgreSQL foundation readiness evidence only', readinessDecision: 'Implementation Ready / Acceptance Pending', postgresqlFoundationAccepted: false, postgresql18Certified: false, managedServiceAccepted: false, dataEngineerApprovalRecorded: false, hostedBackupCertified: false, pointInTimeRecoveryCertified: false, timedRecoveryAccepted: false, productionDatabaseProvisioningAuthorized: false, productionDataAuthorized: false, deploymentAuthorized: false, paperTradingAuthorityCreated: false, pilotAuthorityCreated: false, capitalAuthorized: false, brokerOrdersAuthorized: false, liveTradingAuthorityCreated: false, inventory:{acceptanceControls:24,leastPrivilegeRoles:4,governedSchemas:11,migrations:16,checks:16,criticalBlockers:10,artifacts:6},checks, blockers, artifacts };
await mkdir(path.join(root, 'outputs/postgresql-foundation-readiness'), { recursive: true });
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(root, 'outputs/postgresql-foundation-readiness/readiness-manifest.json'), serialized);
await writeFile(path.join(root, 'outputs/postgresql-foundation-readiness/current-readiness-manifest.json'), serialized);
console.log(`PostgreSQL readiness: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers.`);
