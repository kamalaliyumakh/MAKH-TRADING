import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/engineering/FOUNDATION_ACCEPTANCE.md',
  'docs/engineering/FOUNDATION_VERIFICATION_2026-09-11.md',
  'docs/architecture/SOLUTION_STRUCTURE.md',
  'global.json',
  'package.json',
  'pnpm-workspace.yaml',
  'pnpm-lock.yaml',
  'Directory.Build.props',
  'Directory.Packages.props',
  'angular.json',
  'MAKH.Trading.slnx',
  'outputs/architecture-ux-gate/current-readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));

const acceptance = contents.get(evidenceFiles[0]);
const verification = contents.get(evidenceFiles[1]);
const structure = contents.get(evidenceFiles[2]);
const globalJson = JSON.parse(contents.get(evidenceFiles[3]));
const packageJson = JSON.parse(contents.get(evidenceFiles[4]));
const workspace = contents.get(evidenceFiles[5]);
const lockfile = contents.get(evidenceFiles[6]);
const buildProps = contents.get(evidenceFiles[7]);
const packageProps = contents.get(evidenceFiles[8]);
const angular = JSON.parse(contents.get(evidenceFiles[9]));
const solution = contents.get(evidenceFiles[10]);
const architectureGate = JSON.parse(contents.get(evidenceFiles[11]));
const ids = Array.from({ length: 11 }, (_, index) => `FND-${String(index + 1).padStart(2, '0')}`);
const acceptanceRows = acceptance.match(/^\| FND-\d{2} \|/gm) ?? [];
const angularProjects = Object.keys(angular.projects ?? {});
const solutionProjects = solution.match(/<Project Path=/g) ?? [];

const checks = [
  { id: 'eleven-acceptance-controls', passed: acceptanceRows.length === 11 && ids.every((id) => acceptance.includes(id)) && (acceptance.match(/\| Ready \|$/gm) ?? []).length === 9 && (acceptance.match(/\| Pass \|$/gm) ?? []).length === 1 && (acceptance.match(/\| Pending \|$/gm) ?? []).length === 1, detail: 'FND-01 through FND-11 preserve nine Ready, one Pass and one human-Pending decision.' },
  { id: 'pinned-toolchains', passed: globalJson.sdk?.version === '10.0.400' && packageJson.packageManager === 'pnpm@10.27.0' && packageJson.dependencies?.['@angular/core'] === '22.1.1' && packageJson.devDependencies?.typescript === '6.0.3', detail: '.NET, pnpm, Angular and TypeScript versions are pinned.' },
  { id: 'locked-dependency-governance', passed: lockfile.startsWith("lockfileVersion: '9.0'") && workspace.includes('onlyBuiltDependencies:') && packageProps.includes('<ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>'), detail: 'Frontend and backend dependency graphs are locked and centrally governed.' },
  { id: 'strict-build-standards', passed: buildProps.includes('<Nullable>enable</Nullable>') && buildProps.includes('<TreatWarningsAsErrors>true</TreatWarningsAsErrors>') && buildProps.includes('<Deterministic>true</Deterministic>') && buildProps.includes('<RestorePackagesWithLockFile>true</RestorePackagesWithLockFile>'), detail: '.NET nullable, warning, deterministic and locked-restore controls are explicit.' },
  { id: 'angular-workspace-inventory', passed: angularProjects.length === 7 && ['web-public', 'trading-portal', 'ui', 'auth', 'api-client', 'realtime', 'shared'].every((name) => angularProjects.includes(name)) && angular.cli?.packageManager === 'pnpm', detail: 'Two Angular applications and five shared libraries are registered under pnpm.' },
  { id: 'dotnet-solution-inventory', passed: solutionProjects.length === 8 && solution.includes('src/MAKH.Migrations/MAKH.Migrations.csproj') && solution.includes('tests/MAKH.Architecture.Tests/MAKH.Architecture.Tests.csproj') && solution.includes('tests/MAKH.Api.SecurityTests/MAKH.Api.SecurityTests.csproj'), detail: 'Six production and two test projects are registered in the .NET solution.' },
  { id: 'planned-structure-and-verification-path', passed: structure.includes('## Initial solution creation order') && packageJson.scripts?.verify && packageJson.scripts?.['build:angular'] && verification.includes('Local controls: PASS') && verification.includes('Gate decision: DEFER'), detail: 'The repository structure and one-command verification path are documented, with historical local PASS/DEFER evidence.' },
  { id: 'current-architecture-gate-contract', passed: architectureGate.schemaVersion === 3 && architectureGate.checks.length === 16 && architectureGate.artifacts.length === 12 && architectureGate.blockers.length === 10, detail: 'The current WBS 2.8 evidence contract is consumed.' },
  { id: 'architecture-predecessor-unavailable', passed: architectureGate.readinessDecision.includes('Reject / Defer') && architectureGate.gateAccepted === false && architectureGate.downstreamFoundationAuthorityCreated === false, detail: 'WBS 2.8 remains rejected/deferred and creates no downstream foundation authority.' },
  { id: 'human-approval-and-hosted-evidence-pending', passed: acceptance.includes('Engineering Lead acceptance pending') && verification.includes('Seven blockers remain:') && verification.includes('hosted CI/signing evidence') && verification.includes('PostgreSQL 18 certification'), detail: 'Engineering Lead acceptance and hosted/platform evidence remain unavailable.' },
  { id: 'no-production-or-trading-authority', passed: acceptance.includes('no provider credentials, production resources, personal/trading data or live capability') && verification.includes('not production, paper-trading or live-trading approval'), detail: 'The repository baseline creates no production, paper or live authority.' },
  { id: 'frontend-command-contract', passed: ['verify','build:angular','test:angular','format:check','check:angular-boundaries'].every((name) => typeof packageJson.scripts?.[name] === 'string'), detail: 'Build, test, formatting and boundary commands are explicit.' },
  { id: 'workspace-package-boundary', passed: workspace.includes("'apps/*'") && workspace.includes("'libs/*'") && workspace.includes('onlyBuiltDependencies:'), detail: 'Application/library workspace and native-build boundaries are explicit.' },
  { id: 'backend-package-contract', passed: packageProps.includes('<ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>') && packageProps.includes('<CentralPackageTransitivePinningEnabled>true</CentralPackageTransitivePinningEnabled>'), detail: 'Central package and transitive pinning are enabled.' },
  { id: 'solution-layer-contract', passed: ['MAKH.Domain','MAKH.Application','MAKH.Infrastructure','MAKH.Api','MAKH.Worker','MAKH.Migrations','MAKH.Architecture.Tests','MAKH.Api.SecurityTests'].every((name) => solution.includes(name)), detail: 'Production and test layer inventory is complete.' },
  { id: 'artifact-boundary', passed: evidenceFiles.length === 12, detail: 'Twelve current repository evidence artifacts are governed.' },
];
const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) throw new Error(`Repository foundation readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);

const blockerFindings = [
  'WBS 2.8 Architecture and UX Gate remains Reject/Defer and grants no downstream authority.',
  'Engineering Lead review, decision and signature remain unavailable.',
  'Hosted CI execution evidence remains pending.',
  'Artifact signing and provenance evidence remains pending.',
  'Protected-branch and required-check enforcement evidence remains pending.',
  'PostgreSQL 18 managed certification remains pending.',
  'Identity-provider and shared-key deployment certification remains pending.',
  'Approved infrastructure and private-connectivity evidence remain pending.',
  'Timed recovery evidence remains pending.',
  'Accountable component-owner acceptance remains pending.',
];
const blockers = blockerFindings.map((finding, index) => ({ id: `RFB-${String(index + 1).padStart(2, '0')}`, severity: 'Critical', status: 'Open', finding }));
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 3.1 local repository foundation readiness evidence only',
  readinessDecision: 'Implementation Ready / Acceptance Pending',
  foundationAccepted: false,
  architectureGateAccepted: false,
  engineeringLeadApprovalRecorded: false,
  hostedCiCertified: false,
  artifactSigningCertified: false,
  protectedBranchCertified: false,
  managedPostgresqlCertified: false,
  identityDeploymentCertified: false,
  infrastructureAccepted: false,
  recoveryEvidenceAccepted: false,
  componentOwnerAcceptanceRecorded: false,
  productionProvisioningAuthorized: false,
  deploymentAuthorized: false,
  publicationAuthorized: false,
  externalUserAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  pilotAuthorityCreated: false,
  capitalAuthorized: false,
  brokerOrdersAuthorized: false,
  liveTradingAuthorityCreated: false,
  inventory: { acceptanceControls: 11, angularProjects: 7, dotnetProjects: 8, checks: 16, criticalBlockers: 10, artifacts: 12 },
  checks,
  blockers,
  artifacts,
};
const outputDirectory = path.join(root, 'outputs/repository-foundation-readiness');
await mkdir(outputDirectory, { recursive: true });
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(outputDirectory, 'readiness-manifest.json'), serialized, 'utf8');
await writeFile(path.join(outputDirectory, 'current-readiness-manifest.json'), serialized, 'utf8');
console.log(`Repository foundation prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; acceptance remains Pending and no production or trading authority created.`);
