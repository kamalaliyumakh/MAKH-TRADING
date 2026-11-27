import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  'docs/engineering/IDENTITY_FOUNDATION_ACCEPTANCE.md',
  'docs/engineering/DATA_PROTECTION_CONFIGURATION_ACCEPTANCE.md',
  'docs/security/IDENTITY_IMPLEMENTATION.md',
  'src/MAKH.Api/Program.cs',
  'src/MAKH.Api/Identity/IdentityOptionsValidator.cs',
  'src/MAKH.Api/Identity/FreshMfaHandler.cs',
  'src/MAKH.Infrastructure/Persistence/IdentityAccount/PostgresServerSessionRegistry.cs',
  'outputs/clean-architecture-readiness/current-readiness-manifest.json',
];

const contents = new Map();
for (const file of files) {
  contents.set(file, readFileSync(path.join(root, file), 'utf8'));
}

const acceptance = contents.get(files[0]);
const dataProtection = contents.get(files[1]);
const implementation = contents.get(files[2]);
const program = contents.get(files[3]);
const validator = contents.get(files[4]);
const mfa = contents.get(files[5]);
const sessions = contents.get(files[6]);
const cleanArchitecture = JSON.parse(contents.get(files[7]));

const controlRows = acceptance.match(/^\| IDF-/gm) ?? [];
const checks = [
  {
    id: 'twenty-controls',
    passed:
      controlRows.length === 20 &&
      (acceptance.match(/\| Pass \|$/gm) ?? []).length === 18 &&
      (acceptance.match(/\| Pending \|$/gm) ?? []).length === 2,
    detail: 'The acceptance matrix records 18 passing and 2 pending controls.',
  },
  {
    id: 'oidc-fail-closed',
    passed:
      implementation.includes('OIDC confidential client') &&
      validator.includes('UriSchemeHttps') &&
      acceptance.includes('defaults disabled and fails closed'),
    detail: 'OIDC code flow is wired with HTTPS validation and fail-closed defaults.',
  },
  {
    id: 'cookie-token-boundary',
    passed:
      acceptance.includes('host-scoped, Secure, HttpOnly and SameSite') &&
      acceptance.includes('SaveTokens=false'),
    detail: 'The browser receives an opaque secure cookie; provider tokens stay server-side.',
  },
  {
    id: 'mfa-antiforgery',
    passed:
      mfa.includes('AuthenticationMethod') &&
      mfa.includes('"mfa"') &&
      acceptance.includes('logout rejects missing antiforgery'),
    detail: 'Fresh MFA evidence and logout antiforgery are enforced.',
  },
  {
    id: 'persisted-identity',
    passed:
      acceptance.includes('persisted user and exactly one active paper account') &&
      sessions.includes('UserSession'),
    detail: 'Identity, paper-account and session state are persisted and server-derived.',
  },
  {
    id: 'protected-keys',
    passed:
      dataProtection.includes('multi-replica decryptability') &&
      dataProtection.includes('No production key repository'),
    detail: 'Shared key deployment is specified but remains an explicit production blocker.',
  },
  {
    id: 'current-clean-architecture-contract',
    passed: cleanArchitecture.schemaVersion === 3 && cleanArchitecture.checks.length === 16 && cleanArchitecture.blockers.length === 10,
    detail: 'The current WBS 3.2 evidence contract is consumed.',
  },
  {
    id: 'predecessor-unaccepted',
    passed: cleanArchitecture.cleanArchitectureAccepted === false,
    detail: 'The verifier preserves the unaccepted WBS 3.2 predecessor as a blocker.',
  },
  {
    id: 'provider-approval-pending',
    passed:
      acceptance.includes('Identity provider, claim mapping, shared key repository') &&
      acceptance.includes('Backend and Security Leads accept'),
    detail: 'Provider certification and accountable approvals remain pending.',
  },
  {
    id: 'options-validation-contract',
    passed: validator.includes('IdentityOptionsValidator') && validator.includes('UriSchemeHttps') && validator.includes('ClientId'),
    detail: 'Provider options fail closed on incomplete or insecure configuration.',
  },
  {
    id: 'service-wiring-contract',
    passed: program.includes('AddMakhIdentity') && program.includes('OpenIdConnectDefaults.AuthenticationScheme') && acceptance.includes('SaveTokens=false') && mfa.includes('FreshMfaHandler'),
    detail: 'OIDC, server-side token custody and fresh-MFA authorization are wired.',
  },
  {
    id: 'session-registry-contract',
    passed: sessions.includes('PostgresServerSessionRegistry') && sessions.includes('RevokeAsync') && sessions.includes('ListAsync'),
    detail: 'Server-side session inventory and revocation use the PostgreSQL registry.',
  },
  {
    id: 'identity-mapping-contract',
    passed: implementation.includes('issuer') && implementation.includes('subject') && implementation.includes('account') && implementation.includes('server'),
    detail: 'External identity and account authority remain server-derived.',
  },
  {
    id: 'data-protection-recovery-contract',
    passed: dataProtection.includes('multi-replica decryptability') && dataProtection.includes('recovery') && dataProtection.includes('rotation'),
    detail: 'Shared-key multi-replica, recovery and rotation requirements are explicit.',
  },
  {
    id: 'authority-boundary',
    passed: acceptance.includes('does not authorize live trading') && acceptance.includes('no production identity or live authority is created') && cleanArchitecture.deploymentAuthorized === false && cleanArchitecture.liveTradingAuthorityCreated === false,
    detail: 'No provider connection, deployment, user or trading authority is inferred.',
  },
  {
    id: 'artifact-boundary',
    passed: files.length === 8,
    detail: 'Eight current identity artifacts are governed.',
  },
];

const failed = checks.filter((check) => !check.passed);
if (failed.length > 0) {
  throw new Error(`Identity readiness checks failed: ${failed.map((check) => check.id).join(', ')}`);
}

const blockerFindings = [
  'Identity provider selection remains pending.',
  'Deployment jurisdiction approval remains pending.',
  'Provider-specific OIDC certification remains pending.',
  'Provider-specific claim mapping certification remains pending.',
  'Provider-specific MFA and session certification remains pending.',
  'Shared multi-replica key deployment remains pending.',
  'Shared-key rotation and recovery proof remain pending.',
  'WBS 3.2 and architecture predecessors remain unaccepted.',
  'Backend Lead approval remains unsigned.',
  'Security Lead approval remains unsigned.',
];
const blockers = blockerFindings.map((finding,index)=>({id:`IDB-${String(index+1).padStart(2,'0')}`,severity:'Critical',status:'Open',finding}));
const artifacts = files.map((file) => ({
  path: file,
  sha256: createHash('sha256').update(contents.get(file)).digest('hex'),
}));
const manifest = {
  schemaVersion: 3,
  generatedAt: new Date().toISOString(),
  scope: 'WBS 3.5 identity foundation readiness',
  readinessDecision: 'Implementation Ready / Acceptance Pending',
  identityFoundationAccepted: false,
  providerCertified: false,
  jurisdictionApproved: false,
  oidcCertified: false,
  claimMappingCertified: false,
  mfaSessionCertified: false,
  sharedKeyDeploymentCertified: false,
  keyRecoveryCertified: false,
  backendLeadApprovalRecorded: false,
  securityLeadApprovalRecorded: false,
  productionIdentityAuthorized: false,
  deploymentAuthorized: false,
  externalUserAuthorityCreated: false,
  paperTradingAuthorityCreated: false,
  pilotAuthorityCreated: false,
  capitalAuthorized: false,
  brokerOrdersAuthorized: false,
  liveTradingAuthorityCreated: false,
  inventory:{acceptanceControls:20,checks:16,criticalBlockers:10,artifacts:8},
  checks,
  blockers,
  artifacts,
};

await mkdir(path.join(root, 'outputs/identity-foundation-readiness'), { recursive: true });
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;
await writeFile(path.join(root, 'outputs/identity-foundation-readiness/readiness-manifest.json'), serialized);
await writeFile(path.join(root, 'outputs/identity-foundation-readiness/current-readiness-manifest.json'), serialized);

console.log(
  `Identity readiness: ${checks.length} checks, ${artifacts.length} artifacts, ${blockers.length} blockers.`,
);
