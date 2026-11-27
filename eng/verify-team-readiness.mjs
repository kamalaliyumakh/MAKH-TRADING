import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceFiles = [
  'docs/governance/CURRENT_TEAM_READINESS_REVIEW.md',
  'docs/governance/CURRENT_TEAM_DECISION_REGISTER.md',
  'docs/governance/CEREMONIES_AND_COMMUNICATION.md',
  'docs/governance/ESCALATION_AND_HANDOFF.md',
  'docs/governance/TEAM_CONFIRMATION.md',
  'outputs/charter-readiness/readiness-manifest.json',
];

const contents = new Map();
for (const relativePath of evidenceFiles) {
  contents.set(relativePath, await readFile(path.join(root, relativePath), 'utf8'));
}

const review = contents.get(evidenceFiles[0]);
const decisions = contents.get(evidenceFiles[1]);
const ceremonies = contents.get(evidenceFiles[2]);
const escalation = contents.get(evidenceFiles[3]);
const confirmation = contents.get(evidenceFiles[4]);
const charter = JSON.parse(contents.get(evidenceFiles[5]));

const countRows = (text, pattern) => (text.match(pattern) ?? []).length;
const capabilityRows = countRows(review, /^\| TC-\d{2} \|/gm);
const assignmentRows = countRows(review, /^\| (?:Product Owner|Project\/Delivery Manager|Solution\/Engineering Lead|Backend engineering|Frontend engineering|Data engineering\/owner|QA\/accessibility|Security|Risk Owner\/SME|Operations\/platform|UX\/design|Legal\/compliance\/privacy) \| Pending \| Pending \| Pending \| Pending \| Pending \| Pending \|$/gm);
const blockerRows = countRows(review, /^\| TMB-\d{2} \| Critical \| Open \|/gm);
const decisionRows = countRows(decisions, /^\| TSD-\d{2} \| [^|]+ \| [^|]+ \| Pending \| Pending \|$/gm);
const commitmentRows = countRows(decisions, /^\| [^|]+ \| Pending \|$/gm);
const ceremonyRows = countRows(ceremonies, /^\| CC-\d{2} \|/gm);
const channelRows = ceremonies.split('\n').filter((line) => /^\| (?:Project control|Engineering work|Team chat|Documentation|Incident|Confidential\/legal) \|/.test(line));
const escalationRows = escalation.split('\n').filter((line) => /^\| E[1-4] /.test(line));
const handoffItems = escalation.split('## Handoff checklist')[1]?.match(/^\d+\. /gm) ?? [];
const capabilityIds = Array.from({ length: 14 }, (_, index) => `TC-${String(index + 1).padStart(2, '0')}`);
const ceremonyIds = Array.from({ length: 10 }, (_, index) => `CC-${String(index + 1).padStart(2, '0')}`);

const checks = [
  { id: 'fourteen-current-capabilities', passed: capabilityRows === 14 && capabilityIds.every((id) => review.includes(`| ${id} |`)), detail: 'Exactly TC-01 through TC-14 are present in the current capability review.' },
  { id: 'all-capabilities-pending', passed: countRows(review, /^\| TC-\d{2} \| [^|]+ \| [^|]+ \| Pending \|$/gm) === 14, detail: 'All fourteen required capabilities remain Pending.' },
  { id: 'twelve-assignments-pending', passed: assignmentRows === 12, detail: 'All twelve primary delivery assignments and their commitment fields remain Pending.' },
  { id: 'ten-ceremonies', passed: ceremonyRows === 10 && ceremonyIds.every((id) => ceremonies.includes(`| ${id} |`)), detail: 'Exactly CC-01 through CC-10 are present.' },
  { id: 'six-governed-channels', passed: channelRows.length === 6 && ceremonies.includes('Do not place credentials, tokens'), detail: 'Six governed logical channels and restricted-data rules are present.' },
  { id: 'four-escalation-levels', passed: escalationRows.length === 4 && escalation.includes('## Safety-first response'), detail: 'Four escalation levels and the E1 safety-first response are present.' },
  { id: 'eight-handoff-controls', passed: handoffItems.length === 8 && escalation.includes('High-risk work is not handed off through chat alone.'), detail: 'Eight handoff controls and durable-record requirements are present.' },
  { id: 'six-staffing-decisions-pending', passed: decisionRows === 6, detail: 'Exactly six staffing confirmation decisions remain Pending.' },
  { id: 'eight-commitment-fields-pending', passed: commitmentRows === 8, detail: 'Exactly eight required staffing commitment fields remain Pending.' },
  { id: 'six-critical-open-blockers', passed: blockerRows === 6, detail: 'Exactly six Critical/Open staffing blocker groups remain.' },
  { id: 'capacity-and-conflict-rules', passed: review.includes('Capacity is recorded as a time-bounded commitment') && review.includes('conflicts are recorded and an independent reviewer is assigned'), detail: 'Capacity, backup and role-conflict controls are explicit.' },
  { id: 'legacy-confirmation-remains-pending', passed: confirmation.includes('Status: Awaiting WBS 0.1 approval and named staffing commitments') && countRows(confirmation, /^\| [^|]+ \| Pending \|$/gm) === 6, detail: 'The retained confirmation record remains unsigned with six Pending checklist items.' },
  { id: 'charter-predecessor-unavailable', passed: charter.readinessDecision === 'Prepared / Approval Pending' && charter.charterApproved === false && charter.downstreamGateAuthorityCreated === false, detail: 'WBS 0.1 remains unapproved and creates no downstream-gate authority.' },
  { id: 'no-appointment-commitment-access-or-authority', passed: review.includes('does not appoint a person, commit capacity, grant access') && decisions.includes('cannot appoint people, commit their time, grant access') && charter.procurementAuthorized === false && charter.publicationAuthorized === false && charter.liveTradingAuthorized === false, detail: 'The evidence appoints nobody and creates no staffing, access, procurement, publication or trading authority.' },
];

const failedChecks = checks.filter((check) => !check.passed);
if (failedChecks.length > 0) {
  throw new Error(`Team readiness verification failed: ${failedChecks.map((check) => check.id).join(', ')}`);
}

const blockers = review
  .split('\n')
  .filter((line) => /^\| TMB-\d{2} \| Critical \| Open \|/.test(line))
  .map((line) => {
    const [, id, severity, state, description] = line.split('|').map((value) => value.trim());
    return { id, severity, state, description };
  });

const artifacts = evidenceFiles.map((relativePath) => ({
  path: relativePath,
  sha256: createHash('sha256').update(contents.get(relativePath)).digest('hex'),
}));

const manifest = {
  schemaVersion: 2,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 0.3 current team and capacity readiness evidence only',
  readinessDecision: 'Prepared / Named Staffing, Capacity and Authority Pending',
  inventory: {
    capabilities: capabilityRows,
    pendingAssignments: assignmentRows,
    ceremonies: ceremonyRows,
    governedChannels: channelRows.length,
    escalationLevels: escalationRows.length,
    handoffControls: handoffItems.length,
    pendingStaffingDecisions: decisionRows,
    pendingCommitmentFields: commitmentRows,
    blockers: blockerRows,
  },
  localPreparationControls: true,
  staffingConfirmed: false,
  capacityCommitted: false,
  backupCoverageConfirmed: false,
  authorityAndAccessConfirmed: false,
  roleConflictsAccepted: false,
  charterPredecessorAccepted: false,
  downstreamGateAuthorityCreated: false,
  procurementAuthorized: false,
  servicePublished: false,
  operationalOrTradingAuthorityCreated: false,
  checks,
  blockers,
  artifacts,
};

const outputDirectory = path.join(root, 'outputs/team-readiness');
await mkdir(outputDirectory, { recursive: true });
await writeFile(path.join(outputDirectory, 'current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(
  `Team readiness verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} Critical blockers; staffing remains Pending and no downstream, operational or trading authority.`,
);
