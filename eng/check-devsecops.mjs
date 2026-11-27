import fs from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const workflowDirectory = path.join(root, '.github', 'workflows');
const workflowNames = ['quality.yml', 'release-provenance.yml'];
const failures = [];

for (const workflowName of workflowNames) {
  const content = await fs.readFile(path.join(workflowDirectory, workflowName), 'utf8');
  for (const [lineIndex, line] of content.split('\n').entries()) {
    const action = line.match(/^\s*uses:\s*([^\s#]+)@([^\s#]+)/);
    if (action && !/^[0-9a-f]{40}$/.test(action[2])) {
      failures.push(
        `${workflowName}:${lineIndex + 1} action ${action[1]} is not pinned to a commit SHA`,
      );
    }
  }
  if (!content.includes('permissions:')) failures.push(`${workflowName} must declare permissions`);
  if (content.includes('pull-requests: write'))
    failures.push(`${workflowName} must not write to pull requests`);
}

const quality = await fs.readFile(path.join(workflowDirectory, 'quality.yml'), 'utf8');
for (const gate of [
  '--locked-mode',
  '--frozen-lockfile',
  'codeql-action/analyze',
  'scan-secrets.mjs',
  'verify:environments',
  'dotnet list MAKH.Trading.slnx package --vulnerable',
  'cyclonedx-json',
  'LogFilePrefix=dotnet-tests',
  'angular-tests.txt',
  'postgres-foundation.txt',
  'foundation-gate.txt',
  'if-no-files-found: error',
]) {
  if (!quality.includes(gate)) failures.push(`quality.yml is missing required gate: ${gate}`);
}

const release = await fs.readFile(path.join(workflowDirectory, 'release-provenance.yml'), 'utf8');
for (const gate of ["tags: ['v*']", 'id-token: write', 'cosign sign-blob', 'SHA256SUMS']) {
  if (!release.includes(gate))
    failures.push(`release-provenance.yml is missing required release control: ${gate}`);
}
if (
  release.includes('environment: production') ||
  release.includes('kubectl') ||
  release.includes('az containerapp')
) {
  failures.push('release provenance must not deploy or authorize production');
}

if (failures.length > 0) throw new Error(`DevSecOps policy violations:\n${failures.join('\n')}`);
console.log(
  'DevSecOps workflow policy verified: immutable actions, required gates, and release-only signing.',
);
