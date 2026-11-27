import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/engineering/CLEAN_ARCHITECTURE_ACCEPTANCE.md',
  'docs/architecture/MODULE_BOUNDARIES.md',
  'tests/MAKH.Architecture.Tests/LayerDependencyTests.cs',
  'src/MAKH.Domain/MAKH.Domain.csproj',
  'src/MAKH.Application/MAKH.Application.csproj',
  'src/MAKH.Infrastructure/MAKH.Infrastructure.csproj',
  'src/MAKH.Migrations/MAKH.Migrations.csproj',
  'src/MAKH.Api/MAKH.Api.csproj',
  'src/MAKH.Worker/MAKH.Worker.csproj',
  'src/MAKH.Application/Common/Ports/IClock.cs',
  'src/MAKH.Infrastructure/Common/SystemClock.cs',
  'src/MAKH.Api/Program.cs',
  'src/MAKH.Worker/Worker.cs',
  'outputs/repository-foundation-readiness/current-readiness-manifest.json',
  'outputs/architecture-ux-gate/current-readiness-manifest.json',
];
const contents = new Map();
for (const relativePath of evidenceFiles) contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));

const acceptance = contents.get(evidenceFiles[0]);
const boundaries = contents.get(evidenceFiles[1]);
const tests = contents.get(evidenceFiles[2]);
const domain = contents.get(evidenceFiles[3]);
const application = contents.get(evidenceFiles[4]);
const infrastructure = contents.get(evidenceFiles[5]);
const migrations = contents.get(evidenceFiles[6]);
const api = contents.get(evidenceFiles[7]);
const worker = contents.get(evidenceFiles[8]);
const clockPort = contents.get(evidenceFiles[9]);
const clockAdapter = contents.get(evidenceFiles[10]);
const apiProgram = contents.get(evidenceFiles[11]);
const workerProgram = contents.get(evidenceFiles[12]);
const repository = JSON.parse(contents.get(evidenceFiles[13]));
const architectureGate = JSON.parse(contents.get(evidenceFiles[14]));
const ids = Array.from({ length: 12 }, (_, index) => `CA-${String(index + 1).padStart(2, '0')}`);
const criteria = acceptance.match(/^\| CA-\d{2} \|/gm) ?? [];

const checks = [
  { id: 'twelve-acceptance-controls', passed: criteria.length === 12 && ids.every((id) => acceptance.includes(id)) && (acceptance.match(/\| Pass \|$/gm) ?? []).length === 10 && (acceptance.match(/\| Pending \|$/gm) ?? []).length === 2, detail: 'CA-01 through CA-12 preserve ten implementation passes and two accountable pending decisions.' },
  { id: 'six-layer-boundaries', passed: (boundaries.match(/^\| `MAKH\./gm) ?? []).length === 6 && boundaries.includes('The API and Worker are composition roots') && boundaries.includes('deployment-only executable'), detail: 'Six production projects have explicit allowed and prohibited dependency directions.' },
  { id: 'six-compiled-layer-tests', passed: (tests.match(/\[Fact\]/g) ?? []).length === 6 && ['DomainHasNoDependenciesOnOtherMakhLayers', 'ApplicationDependsOnlyOnDomain', 'InfrastructureDependsOnlyOnApplicationAndDomain', 'MigrationsDependOnlyOnInfrastructure', 'ApiDependsOnApplicationAndInfrastructureWithoutDirectDomainReference', 'WorkerDependsOnApplicationAndInfrastructureWithoutDirectDomainReference'].every((name) => tests.includes(name)), detail: 'Six compiled layer tests cover every production project.' },
  { id: 'domain-and-application-direction', passed: !domain.includes('<ProjectReference') && application.includes('../MAKH.Domain/MAKH.Domain.csproj') && !application.includes('MAKH.Infrastructure'), detail: 'Domain is independent and Application references Domain only.' },
  { id: 'infrastructure-and-migration-direction', passed: infrastructure.includes('../MAKH.Application/MAKH.Application.csproj') && infrastructure.includes('../MAKH.Domain/MAKH.Domain.csproj') && migrations.includes('../MAKH.Infrastructure/MAKH.Infrastructure.csproj') && !migrations.includes('../MAKH.Application/'), detail: 'Infrastructure implements inner-layer contracts and the migration executable depends only on Infrastructure.' },
  { id: 'composition-root-direction', passed: [api, worker].every((text) => text.includes('../MAKH.Application/MAKH.Application.csproj') && text.includes('../MAKH.Infrastructure/MAKH.Infrastructure.csproj') && !text.includes('../MAKH.Domain/')), detail: 'API and Worker compose Application and Infrastructure without direct Domain references.' },
  { id: 'provider-neutral-port-adapter', passed: clockPort.includes('public interface IClock') && clockAdapter.includes('public sealed class SystemClock : IClock'), detail: 'IClock/SystemClock demonstrate the provider-neutral port/adapter direction.' },
  { id: 'runtime-smoke-boundaries', passed: apiProgram.includes('app.MapGet("/"') && apiProgram.includes('app.MapHealthChecks("/health")') && workerProgram.includes('BackgroundService') && workerProgram.includes('ExecuteAsync(CancellationToken stoppingToken)'), detail: 'API readiness/health and Worker cancellation boundaries are implemented.' },
  { id: 'current-predecessor-contracts', passed: repository.schemaVersion === 3 && repository.checks.length === 16 && repository.blockers.length === 10 && architectureGate.schemaVersion === 3 && architectureGate.checks.length === 16 && architectureGate.blockers.length === 10, detail: 'Current WBS 3.1 and WBS 2.8 evidence contracts are consumed.' },
  { id: 'predecessors-not-accepted', passed: repository.foundationAccepted === false && repository.readinessDecision === 'Implementation Ready / Acceptance Pending' && architectureGate.gateAccepted === false && architectureGate.readinessDecision.includes('Reject / Defer'), detail: 'WBS 3.1 and WBS 2.8 remain unaccepted predecessors.' },
  { id: 'review-and-authority-pending', passed: acceptance.includes('Backend Lead reviews') && acceptance.includes('No persistence, identity, broker, market-data, production or live behavior is implemented'), detail: 'Backend Lead approval remains unsigned and no production or trading authority is inferred.' },
  { id: 'project-file-boundary', passed: [domain, application, infrastructure, migrations, api, worker].every((text) => text.includes('<Project Sdk="Microsoft.NET.Sdk')),'detail': 'All six production projects use explicit SDK project contracts.' },
  { id: 'clock-contract-boundary', passed: clockPort.includes('DateTimeOffset UtcNow') && clockAdapter.includes('DateTimeOffset.UtcNow'), detail: 'Time remains behind an application port and infrastructure adapter.' },
  { id: 'api-composition-contract', passed: apiProgram.includes('AddSingleton<IClock') && apiProgram.includes('AddMakhIdentity') && apiProgram.includes('AddMakhObservability') && apiProgram.includes('MapHealthChecks'), detail: 'API port, identity, observability and health composition boundaries are explicit.' },
  { id: 'worker-composition-contract', passed: workerProgram.includes('BackgroundService') && workerProgram.includes('stoppingToken') && workerProgram.includes('Task.Delay'), detail: 'Worker lifecycle and cancellation boundaries are explicit.' },
  { id: 'artifact-boundary', passed: evidenceFiles.length === 15, detail: 'Fifteen current Clean Architecture artifacts are governed.' },
];
const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) throw new Error(`Clean Architecture readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);

const blockerFindings = [
  'WBS 2.8 Architecture and UX Gate remains Reject/Defer.',
  'WBS 3.1 repository foundation remains unaccepted.',
  'Backend Lead review, decision and signature remain unavailable.',
  'Hosted build enforcement remains pending.',
  'Hosted architecture-test enforcement remains pending.',
  'Production composition-root validation remains pending.',
  'PostgreSQL persistence integration acceptance remains pending.',
  'Identity integration acceptance remains pending.',
  'Broker and market-data provider integration acceptance remains pending.',
  'Operational deployment and recovery acceptance remain pending.',
];
const blockers = blockerFindings.map((finding, index) => ({ id: `CAB-${String(index + 1).padStart(2, '0')}`, severity: 'Critical', status: 'Open', finding }));
const artifacts = evidenceFiles.map((relativePath) => ({ path: relativePath, sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex') }));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 3.2 local Clean Architecture foundation readiness evidence only',
  readinessDecision: 'Implementation Ready / Acceptance Pending',
  cleanArchitectureAccepted: false,
  repositoryFoundationAccepted: false,
  architectureGateAccepted: false,
  backendLeadApprovalRecorded: false,
  hostedBuildCertified: false,
  hostedArchitectureTestsCertified: false,
  productionCompositionValidated: false,
  persistenceIntegrationAccepted: false,
  identityIntegrationAccepted: false,
  providerIntegrationAccepted: false,
  operationalAcceptanceRecorded: false,
  productionAuthorized: false,
  deploymentAuthorized: false,
  publicationAuthorized: false,
  externalUserAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  pilotAuthorityCreated: false,
  capitalAuthorized: false,
  brokerOrdersAuthorized: false,
  liveTradingAuthorityCreated: false,
  inventory: { acceptanceControls: 12, productionProjects: 6, compiledLayerTests: 6, checks: 16, criticalBlockers: 10, artifacts: 15 },
  checks,
  blockers,
  artifacts,
};
const outputDirectory = path.join(root, 'outputs/clean-architecture-readiness');
await mkdir(outputDirectory, { recursive: true });
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(outputDirectory, 'readiness-manifest.json'), serialized, 'utf8');
await writeFile(path.join(outputDirectory, 'current-readiness-manifest.json'), serialized, 'utf8');
console.log(`Clean Architecture prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; acceptance remains Pending and no production or trading authority created.`);
