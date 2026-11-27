import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/security/CURRENT_INDEPENDENT_SECURITY_GATE_REVIEW.md', 'docs/security/INDEPENDENT_SECURITY_CURRENT_SCOPE.md',
  'docs/security/INDEPENDENT_SECURITY_DECISION_REGISTER.md', 'docs/security/SECURITY_ASSESSMENT_RULES_OF_ENGAGEMENT.md',
  'docs/security/SECURITY_FINDING_REGISTER.md', 'docs/security/INDEPENDENT_SECURITY_TEST_PLAN.md',
  'docs/engineering/INDEPENDENT_SECURITY_TEST_ACCEPTANCE.md', 'outputs/operational-readiness/current-readiness-manifest.json',
  'docs/engineering/OPERATIONAL_READINESS_CURRENT_EVIDENCE.md', 'docs/engineering/OPERATIONAL_READINESS_DECISION_REGISTER.md',
];
const c = new Map(); for (const f of files) c.set(f, await readFile(path.join(root, f), 'utf8'));
const review=c.get(files[0]), scope=c.get(files[1]), decisions=c.get(files[2]), rules=c.get(files[3]), register=c.get(files[4]);
const operations=JSON.parse(c.get(files[7]));
const ids=(p,n,w=2)=>Array.from({length:n},(_,i)=>`${p}-${String(i+1).padStart(w,'0')}`);
const decision='Prepared / Independent Authorization, Execution, Remediation, Retest and Acceptance Pending';
const checks=[
 ['criteria',ids('ISC',15).every(id=>review.includes(`| ${id} |`))&&(review.match(/^\| ISC-\d{2} \|/gm)??[]).length===15,'ISC-01–ISC-15 are complete.'],
 ['outcomes',(review.match(/^\| ISC-\d{2} \|[^\n]+\| LocalPass \|/gm)??[]).length===4&&(review.match(/^\| ISC-\d{2} \|[^\n]+\| Fail \|/gm)??[]).length===8&&(review.match(/^\| ISC-\d{2} \|[^\n]+\| Pending \|/gm)??[]).length===3,'Four pass locally, eight fail and three remain pending.'],
 ['blockers',ids('ISB',10).every(id=>review.includes(`| ${id} | Critical | Open |`)),'Ten Critical/Open blockers remain.'],
 ['tests',ids('ST',24,3).every(id=>scope.includes(`| ${id} |`)),'ST-001–ST-024 are defined.'],
 ['threats',ids('TM',20).every(id=>scope.includes(`| ${id} |`)),'TM-01–TM-20 are mapped.'],
 ['mitigations',ids('SEC',20,3).every(id=>scope.includes(id)),'SEC-001–SEC-020 are mapped.'],
 ['boundaries',['Authentication','MFA','Authorization','Trading entry lock','Risk limits'].every(x=>scope.includes(x)),'Identity and trading boundaries are in scope.'],
 ['assessor-pending',decisions.includes('Assessor independence, qualifications and conflict declaration')&&decisions.includes('| Security Lead | Pending |'),'Assessor acceptance is pending.'],
 ['roe-unsigned',rules.includes('testing prohibited until authorized')&&(rules.match(/____________________/g)??[]).length>=6,'Rules of engagement are unsigned.'],
 ['target-pending',decisions.includes('Immutable release and isolated target inventory')&&decisions.includes('| Engineering / Operations | Pending |'),'Target authorization is pending.'],
 ['not-executed',decisions.includes('| Independent Assessor | Not executed |'),'Assessment is not executed.'],
 ['no-findings',register.includes('No assessment executed; no findings or passes recorded'),'No finding or pass is fabricated.'],
 ['retest-separated',decisions.includes('Independent retest and closure evidence'),'Independent retest remains separate.'],
 ['operations-rejected',operations.gateAccepted===false&&operations.entryLockCleared===false,'Operations is rejected and entry-locked.'],
 ['authority-boundary',review.includes('creates no assessment authorization, target access, credential, provider/broker connection, finding/pass, remediation, retest, security acceptance, entry-lock clearance, operational authority, paper authority, pilot authority, capital, broker order or live-trading authority.'),'No authority is created.'],
 ['decision',review.includes(`Decision: **${decision}**`)&&(review.match(/^\d+\. /gm)??[]).length===10,'Decision and ten exit steps are consistent.'],
].map(([id,passed,detail])=>({id,passed,detail}));
const failed=checks.filter(x=>!x.passed); if(failed.length) throw new Error(`Current independent-security gate failed: ${failed.map(x=>x.id).join(', ')}`);
const blockers=ids('ISB',10).map(id=>{const line=review.split('\n').find(x=>x.startsWith(`| ${id} |`));return{id,severity:'Critical',status:'Open',finding:line.split('|')[4].trim()};});
const artifacts=files.map(f=>({path:f,sha256:createHash('sha256').update(c.get(f)).digest('hex')}));
const manifest={schemaVersion:3,generatedAt:new Date().toISOString(),scope:'WBS 9.1 current independent-security gate evidence',readinessDecision:decision,localPreparationControls:'PASS',assessmentAuthorized:false,targetAccessAuthorized:false,assessmentExecuted:false,findingsProduced:false,remediationCompleted:false,independentRetestCompleted:false,securityAccepted:false,entryLockCleared:false,operationalAuthorityCreated:false,paperTradingAuthorityCreated:false,pilotAuthorityCreated:false,capitalAuthorized:false,brokerOrdersAuthorized:false,liveTradingAuthorityCreated:false,inventory:{criteria:15,localPass:4,failed:8,pending:3,securityTests:24,threats:20,mitigations:20,criticalBlockers:10,exitSteps:10},checks,blockers,artifacts};
await mkdir(path.join(root,'outputs/independent-security'),{recursive:true}); await writeFile(path.join(root,'outputs/independent-security/current-readiness-manifest.json'),`${JSON.stringify(manifest,null,2)}\n`);
console.log(`Current independent-security gate verified: ${checks.length} checks, ${artifacts.length} hydrated artifacts, ${blockers.length} Critical blockers; no assessment, finding, acceptance or trading authority.`);
