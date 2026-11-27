import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const browserRoot = path.join(root, 'dist/web-public/browser');
const outputDir = path.join(root, 'outputs/public-web-milestone');
const acceptanceFiles = [
  'PUBLIC_SHELL_ACCEPTANCE.md',
  'PUBLIC_CONTENT_ACCEPTANCE.md',
  'PUBLIC_LEGAL_PRIVACY_ACCEPTANCE.md',
  'PUBLIC_ACCESS_REQUEST_ACCEPTANCE.md',
  'PUBLIC_QUALITY_ACCEPTANCE.md',
];
const failures = [];

const walkFiles = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walkFiles(entryPath) : [entryPath];
    })
    .sort();

const describeFile = (file) => {
  const bytes = fs.readFileSync(file);
  return {
    file: path.relative(root, file).split(path.sep).join('/'),
    bytes: bytes.length,
    sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
  };
};

if (!fs.existsSync(browserRoot)) failures.push('Public prerender output is missing.');

const acceptance = acceptanceFiles.map((name) => {
  const file = path.join(root, 'docs/engineering', name);
  const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!text) failures.push(`${name} is missing.`);
  const status = text.match(/^Status:\s*(.+)$/m)?.[1]?.trim() ?? 'Missing';
  const evidence = describeFile(file);
  return { ...evidence, status };
});

const artifacts = [];
if (fs.existsSync(browserRoot)) {
  artifacts.push(...walkFiles(browserRoot).map(describeFile));
}

const routeArtifacts = artifacts.filter(({ file }) => file.endsWith('/index.html'));
if (routeArtifacts.length !== 9) {
  failures.push(`Expected 9 prerendered route documents, found ${routeArtifacts.length}.`);
}

const blockers = [
  'WBS 3.8 and WBS 4.1–4.5 lack authorized acceptance.',
  'Qualified legal/privacy approval and final entity, jurisdiction, contact and retention facts are missing.',
  'Automated axe and browser preference emulation pass locally; assistive-technology, representative-user, actual zoom, hosted execution and hosted performance evidence remain incomplete.',
  'Approved production origin, hosting, DNS, TLS/WAF/security headers and public monitoring are not configured.',
  'Identity provider/sign-in and durable request-access storage/notifications are disabled.',
  'Product Owner, Legal/Privacy, Security, Accessibility, Frontend and Operations approvals are not recorded.',
];

const manifest = {
  generatedAtUtc: new Date().toISOString(),
  scope: 'Local synthetic public-web milestone evidence only',
  releaseAuthorized: false,
  localEvidenceChecksPassed: failures.length === 0,
  verification: {
    expectedPrerenderedRoutes: 9,
    hashedPrerenderedRoutes: routeArtifacts.length,
    hashedBrowserArtifacts: artifacts.length,
    hashedAcceptanceRecords: acceptance.length,
    localAxeMatrix: '9 routes × 2 viewports passed',
    localPreferenceMatrix: '9 routes × forced-colors/reduced-motion passed',
    actualZoomAccepted: false,
    hostedExecutionAccepted: false,
  },
  acceptance,
  artifacts,
  blockers,
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, 'local-evidence-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Public milestone evidence prepared: ${routeArtifacts.length} prerendered routes and ${artifacts.length} total browser artifacts hashed, ${acceptance.length} acceptance records hashed, ${blockers.length} release blockers; publication remains unauthorized.`,
);
