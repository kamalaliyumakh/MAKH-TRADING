import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const excluded = new Set([
  '.git',
  '.angular',
  '.tools',
  'bin',
  'coverage',
  'dist',
  'node_modules',
  'obj',
  'outputs',
  'TestResults',
]);
const allowedExtensions = new Set([
  '',
  '.cs',
  '.csproj',
  '.html',
  '.json',
  '.md',
  '.mjs',
  '.props',
  '.scss',
  '.sh',
  '.sql',
  '.ts',
  '.xml',
  '.yaml',
  '.yml',
]);

const eligibleSource = (relative) =>
  allowedExtensions.has(path.extname(relative)) &&
  !relative
    .split(/[\\/]/)
    .some(
      (part) => excluded.has(part) || part.startsWith('.docx_qa') || part.startsWith('.fsd_qa'),
    );

const walk = async (directory, relative = '') => {
  const files = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (
      excluded.has(entry.name) ||
      entry.name.startsWith('.docx_qa') ||
      entry.name.startsWith('.fsd_qa')
    )
      continue;
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path.join(directory, entry.name), next)));
    else if (entry.isFile() && eligibleSource(next)) files.push(next);
  }
  return files;
};

export async function discoverSecretFiles(root) {
  let hasGitMetadata = true;
  try {
    await fs.lstat(path.join(root, '.git'));
  } catch (error) {
    if (error.code !== 'ENOENT')
      throw new Error('Cannot inspect Git metadata for secret scanning.');
    hasGitMetadata = false;
  }
  if (!hasGitMetadata) {
    return { mode: 'source archive', files: (await walk(root)).sort() };
  }

  // NUL delimiters preserve whitespace and newlines in valid Git filenames.
  const list = (args) =>
    execFileSync('git', ['ls-files', ...args, '-z'], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
      .split('\0')
      .filter(Boolean);
  try {
    // Keep all tracked files, including tracked ignored files and non-source assets.
    // New files follow Git ignores plus the existing archive source/generated policy.
    const tracked = list(['--cached']);
    const untracked = list(['--others', '--exclude-standard']).filter(eligibleSource);
    return {
      mode: 'git tracked + untracked',
      files: [...new Set([...tracked, ...untracked])].sort(),
    };
  } catch {
    // A broken repository must not silently switch to a different coverage policy.
    throw new Error('Git file discovery failed; secret scan is incomplete.');
  }
}
