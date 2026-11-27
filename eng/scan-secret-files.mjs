import fs from 'node:fs/promises';
import path from 'node:path';

const rules = [
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/],
  ['AWS access key', /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
  ['GitHub token', /\bgh[oprsu]_[A-Za-z0-9_]{30,255}\b/],
  ['Stripe live key', /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/],
  [
    'generic credential assignment',
    /\b(?:api[_-]?key|client[_-]?secret|password|private[_-]?key)\s*[:=]\s*["'][^"'\s]{12,}["']/i,
  ],
];

export async function scanSecretFiles(
  root,
  files,
  { concurrency = 8, readFile = fs.readFile, onProgress = () => {} } = {},
) {
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new Error('Scan concurrency must be an integer between 1 and 32.');
  }
  const candidates = [...new Set(files)].sort();
  const findings = [];
  const unreadable = [];
  let next = 0;
  let completed = 0;
  const worker = async () => {
    while (next < candidates.length) {
      const relative = candidates[next++];
      let content;
      try {
        content = await readFile(path.join(root, relative), 'utf8');
      } catch {
        // Do not leak exception payloads or mistake unreadable files for clean ones.
        unreadable.push(relative);
      }
      if (content !== undefined) {
        for (const [name, pattern] of rules) {
          if (pattern.test(content)) findings.push(`${relative}: ${name}`);
        }
      }
      onProgress(++completed, candidates.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, candidates.length) }, worker));
  const failures = [];
  if (unreadable.length) {
    failures.push(`Secret scan incomplete; unreadable files:\n${unreadable.sort().join('\n')}`);
  }
  if (findings.length) {
    failures.push(`Potential secrets detected:\n${findings.sort().join('\n')}`);
  }
  if (failures.length) throw new Error(failures.join('\n'));
  return { scannedFiles: candidates.length };
}
