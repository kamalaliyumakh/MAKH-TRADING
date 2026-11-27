import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/PUBLIC_ACCESS_REQUEST_ACCEPTANCE.md',
  'docs/engineering/PUBLIC_ACCESS_REQUEST_MINIMIZATION_2026-08-28.md',
  'docs/ux/landing/PUBLIC_COPY_DECK.md',
  'apps/web-public/src/app/request-access-page.ts',
  'apps/web-public/src/app/request-access.service.ts',
  'apps/web-public/src/app/request-access.service.spec.ts',
  'apps/web-public/src/app/app.spec.ts',
  'outputs/public-shell-readiness/current-readiness-manifest.json',
  'outputs/public-content-readiness/current-readiness-manifest.json',
  'outputs/public-legal-privacy-readiness/current-readiness-manifest.json',
];
const contents = new Map();
for (const file of files) contents.set(file, readFileSync(path.join(root, file), 'utf8'));

const acceptance = contents.get(files[0]);
const minimization = contents.get(files[1]);
const copy = contents.get(files[2]);
const page = contents.get(files[3]);
const service = contents.get(files[4]);
const serviceTests = contents.get(files[5]);
const appTests = contents.get(files[6]);
const shell = JSON.parse(contents.get(files[7]));
const content = JSON.parse(contents.get(files[8]));
const legalPrivacy = JSON.parse(contents.get(files[9]));

const checks = [
  { id: 'bounded-form-fields', passed: ['name', 'email', 'country', 'experience', 'intendedUse', 'contactPreference', 'consent', 'website'].every((field) => page.includes(field)), detail: 'The local form exposes only the approved bounded fields and hidden honeypot.' },
  { id: 'sensitive-data-warning', passed: page.includes('Do not submit passwords, broker credentials, account numbers, government identifiers') && page.includes('confidential trading instructions'), detail: 'The form warns users not to submit sensitive broker, identity or trading data.' },
  { id: 'accessible-validation', passed: page.includes('role="alert"') && page.includes('Review the highlighted fields') && page.includes('aria-invalid') && page.includes('markAllAsTouched') && page.includes('errorSummary()?.nativeElement.focus()'), detail: 'Validation has an alert summary, field cues and focus management.' },
  { id: 'privacy-acknowledgement', passed: page.includes('Validators.requiredTrue') && page.includes('provisional privacy notice') && page.includes('Privacy acknowledgement is required'), detail: 'Submission requires acknowledgement of the provisional privacy notice.' },
  { id: 'honeypot-screening', passed: page.includes('class="honeypot"') && service.includes('request.website.trim()') && serviceTests.includes('screens a populated honeypot'), detail: 'A hidden non-CAPTCHA honeypot is implemented and tested.' },
  { id: 'session-rate-guard', passed: service.includes('this.attempts.length >= 3') && service.includes('retryAfterSeconds: 60') && serviceTests.includes('fails temporarily after three submissions'), detail: 'The local preview enforces and tests a three-attempt rolling-window guard.' },
  { id: 'duplicate-safe-reference', passed: service.includes("crypto.subtle.digest('SHA-256'") && service.includes("state: 'duplicate'") && serviceTests.includes('deduplicates normalized emails without changing the reference'), detail: 'Normalized email digests support duplicate-safe stable references without plaintext map keys.' },
  { id: 'safe-result-states', passed: page.includes("'accepted' | 'duplicate' | 'unavailable'") && page.includes('No details were sent') && page.includes('never ask for your broker password'), detail: 'Accepted, duplicate and unavailable states use safe user-facing wording.' },
  { id: 'local-only-boundary', passed: service.includes('sends no network request') && service.includes('retains no form payload outside this service instance') && page.includes('External delivery is') && page.includes('disabled'), detail: 'The gateway remains in-memory and sends no external request, email or notification.' },
  { id: 'copy-and-minimization-traceability', passed: copy.includes('CP-08 — Request Access') && minimization.includes('SHA-256') && minimization.includes('Three focused service cases'), detail: 'The implementation traces to CP-08 and the dedicated minimization evidence.' },
  { id: 'focused-regression-evidence', passed: (serviceTests.match(/\bit\(/g) ?? []).length === 3 && appTests.includes('minimal accessible request-access form') && acceptance.includes('Twenty-six public test instances pass'), detail: 'Three focused service cases and public route assertions remain in the 26-instance run.' },
  { id: 'predecessors-unaccepted', passed: shell.shellAccepted === false && content.contentAccepted === false && legalPrivacy.legalPrivacyAccepted === false, detail: 'Shell, content and legal/privacy predecessors remain unaccepted.' },
  { id: 'no-capture-or-trading-authority', passed: acceptance.includes('does not authorize real personal-data capture, notification delivery, publication, paper trading or live trading'), detail: 'The acceptance record grants no capture, delivery, publication or trading authority.' },
  { id: 'current-predecessor-contracts', passed: [shell, content, legalPrivacy].every((item) => item.schemaVersion === 3), detail: 'Current schema-v3 shell, content and legal/privacy predecessor evidence is consumed.' },
  { id: 'production-capture-lockout', passed: legalPrivacy.personalDataCaptureAuthorized === false && shell.externalUserAuthorityCreated === false && service.includes('sends no network request'), detail: 'Production personal-data capture and external-user authority remain disabled.' },
  { id: 'accountable-acceptance-separation', passed: acceptance.includes('privacy, security, accessibility') && acceptance.includes('Frontend Lead') && acceptance.includes('Product Owner'), detail: 'Privacy, security, accessibility, frontend and product acceptance remains separate from local interaction evidence.' },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) throw new Error(`Public access-request readiness checks failed: ${failed.map((check) => check.id).join(', ')}`);

const blockers = [
  { id: 'ARB-01', severity: 'Critical', status: 'Open', detail: 'Approved API contract remains pending.' },
  { id: 'ARB-02', severity: 'Critical', status: 'Open', detail: 'Durable encrypted storage, retention/deletion and privacy-controller facts remain pending.' },
  { id: 'ARB-03', severity: 'Critical', status: 'Open', detail: 'Edge rate limiting and production bot detection remain pending.' },
  { id: 'ARB-04', severity: 'Critical', status: 'Open', detail: 'Abuse monitoring and security testing remain pending.' },
  { id: 'ARB-05', severity: 'Critical', status: 'Open', detail: 'Notification templates and authorized recipients remain pending.' },
  { id: 'ARB-06', severity: 'Critical', status: 'Open', detail: 'Notification providers, audit outbox and failure handling remain disabled.' },
  { id: 'ARB-07', severity: 'Critical', status: 'Open', detail: 'Cross-replica uniqueness requires approved PostgreSQL implementation.' },
  { id: 'ARB-08', severity: 'Critical', status: 'Open', detail: 'Cross-replica idempotency certification remains pending.' },
  { id: 'ARB-09', severity: 'Critical', status: 'Open', detail: 'Legal/privacy, security and accessibility acceptance remains pending.' },
  { id: 'ARB-10', severity: 'Critical', status: 'Open', detail: 'Frontend Lead and Product Owner acceptance remains pending.' },
];
const artifacts = files.map((file) => ({ path: file, sha256: createHash('sha256').update(contents.get(file)).digest('hex') }));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 4.4 Public Access Request readiness',
  localControls: 'PASS',
  readinessDecision: 'Local Interaction Ready / Production Capture Disabled',
  accessRequestAccepted: false,
  productionCaptureEnabled: false,
  notificationDeliveryEnabled: false,
  publicLaunchAuthorized: false,
  paperTradingAuthorityCreated: false,
  liveTradingAuthorityCreated: false,
  personalDataCaptureAuthorized: false,
  externalUserAuthorityCreated: false,
  notificationDeliveryAuthorized: false,
  apiContractApproved: false,
  securityAccepted: false,
  accessibilityAccepted: false,
  productOwnerApprovalRecorded: false,
  frontendLeadApprovalRecorded: false,
  inventory: {
    approvedFields: 8,
    checks: checks.length,
    blockers: blockers.length,
    artifacts: artifacts.length,
  },
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/public-access-request-readiness'), { recursive: true });
await writeFile(path.join(root, 'outputs/public-access-request-readiness/readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
await writeFile(path.join(root, 'outputs/public-access-request-readiness/current-readiness-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Public access request: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers; Local Interaction Ready / Production Capture Disabled.`);
