import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/controlled-live-pilot/PILOT_OPERATING_PROTOCOL.md',
  'docs/controlled-live-pilot/PILOT_SCENARIO_AND_METRIC_MATRIX.md',
  'docs/controlled-live-pilot/PILOT_DAILY_RUN_RECORD_TEMPLATE.md',
  'docs/controlled-live-pilot/PILOT_REPORT_TEMPLATE.md',
  'docs/engineering/CONTROLLED_LIVE_PILOT_ACCEPTANCE.md',
  'outputs/controlled-live-go-no-go/local-evidence-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const protocol = contents.get(evidenceFiles[0]);
const matrix = contents.get(evidenceFiles[1]);
const dailyRecord = contents.get(evidenceFiles[2]);
const report = contents.get(evidenceFiles[3]);
const acceptance = contents.get(evidenceFiles[4]);
const goNoGo = JSON.parse(contents.get(evidenceFiles[5]));

const entryConditions = protocol.match(/^\d+\. /gm) ?? [];
const roleRows = protocol.match(/^\| (?:Pilot Owner|Trader|Risk Owner|Operations|Security|QA\/Evidence|Sponsor) \|/gm) ?? [];
const scenarioIds = Array.from({ length: 15 }, (_, index) => `CLP-${String(index + 1).padStart(2, '0')}`);
const scenarioRows = matrix.match(/^\| CLP-\d{2} \|/gm) ?? [];
const metricRows = matrix
  .split('\n')
  .filter((line) => /^\| [^|]+ \| [^|]+ \| [^|]+ \|$/.test(line))
  .filter((line) => !line.startsWith('| Metric |') && !line.startsWith('|---'));

const checks = [
  {
    id: 'eight-entry-conditions',
    passed: entryConditions.length === 8,
    detail: 'The operating protocol contains exactly eight mandatory entry conditions.',
  },
  {
    id: 'seven-separated-roles',
    passed: roleRows.length === 7 && protocol.includes('Cannot self-approve'),
    detail: 'Seven accountable roles and their self-approval boundaries are present.',
  },
  {
    id: 'fifteen-scenarios',
    passed: scenarioRows.length === 15 && scenarioIds.every((id) => matrix.includes(`| ${id} |`)),
    detail: 'The matrix contains exactly CLP-01 through CLP-15.',
  },
  {
    id: 'twelve-metrics',
    passed: metricRows.length === 12,
    detail: 'The matrix contains exactly twelve controlled-live safety and exposure metrics.',
  },
  {
    id: 'stop-resume-and-exit-controls',
    passed: protocol.includes('## Immediate stop and capital-protection rules') &&
      protocol.includes('Restart requires') && protocol.includes('## Exit criteria'),
    detail: 'Immediate stop, controlled restart and exit controls are present.',
  },
  {
    id: 'daily-record-do-not-start',
    passed: dailyRecord.includes('Status: **Not executed**') &&
      dailyRecord.includes('DO NOT START — WBS 9.4 Reject/Defer'),
    detail: 'The daily record remains not executed and defaults to DO NOT START.',
  },
  {
    id: 'report-no-results',
    passed: report.includes('Status: **No pilot executed; no results exist**') &&
      report.includes('There is no pilot release, environment, account, credential, capital allocation, order, execution, metric sample, defect result or approval to report.'),
    detail: 'The pilot report explicitly records that no pilot or result exists.',
  },
  {
    id: 'go-no-go-predecessor-unavailable',
    passed: goNoGo.decision === 'Reject/Defer' && goNoGo.gateAccepted === false &&
      goNoGo.entryLockCleared === false && goNoGo.pilotAuthorized === false &&
      goNoGo.capitalAuthorized === false && goNoGo.brokerOrdersAuthorized === false &&
      goNoGo.createsLiveTradingAuthority === false,
    detail: 'WBS 9.4 remains Reject/Defer with entry lock set and no pilot, capital, order or live authority.',
  },
  {
    id: 'acceptance-preparation-only',
    passed: acceptance.includes('Status: In progress — 35% protocol maturity; not executed') &&
      acceptance.includes('does not execute, simulate or authorize a pilot') &&
      acceptance.includes('cannot create live-trading or capital authority'),
    detail: 'The acceptance record remains preparation-only and creates no authority.',
  },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Controlled-live pilot readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = [
  'WBS 7.9 paper certification and WBS 8.7 operational readiness are not accepted.',
  'WBS 9.1 independent security testing has not been executed or approved.',
  'WBS 9.2 qualified legal, compliance, privacy, broker, data-rights and records approvals do not exist.',
  'WBS 9.3 controlled-live configuration, account, credentials, hard limits and drills are unavailable.',
  'WBS 9.4 remains Reject/Defer and provides no authorized Go decision.',
  'No exact release, environment, deployment, migration, rollback or provenance package is approved for a pilot.',
  'No named authorized pilot team, tested communications or signed operating window exists.',
  'No pre-open provider, calendar, freshness, telemetry, reconciliation or zero-safety-defect evidence exists.',
];

const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 9.5 local controlled-live pilot readiness evidence only',
  readinessDecision: 'Do Not Start',
  pilotExecuted: false,
  resultsRecorded: false,
  gateAccepted: false,
  entryLockCleared: false,
  pilotAuthorized: false,
  capitalAuthorized: false,
  brokerOrdersAuthorized: false,
  createsLiveTradingAuthority: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/controlled-live-pilot');
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  path.join(outputDirectory, 'readiness-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
  'utf8',
);

console.log(
  `Controlled-live pilot readiness prepared: ${checks.length} checks, ${artifacts.length} hashed artifacts, ${blockers.length} blockers; Do Not Start and no pilot, capital, order or live authority created.`,
);
