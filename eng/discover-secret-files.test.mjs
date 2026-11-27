import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import { discoverSecretFiles } from './discover-secret-files.mjs';
import { scanSecretFiles } from './scan-secret-files.mjs';

const fixture = async (t, git = true) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'makh-secret-discovery-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  if (git) execFileSync('git', ['init', '--quiet', root]);
  return root;
};
const add = (root, ...files) => execFileSync('git', ['add', '--', ...files], { cwd: root });

test('new source files are included even when tracked files already exist', async (t) => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, 'tracked.ts'), 'safe');
  add(root, 'tracked.ts');
  await fs.writeFile(path.join(root, 'new.ts'), 'ghp_' + 'A'.repeat(30));
  const result = await discoverSecretFiles(root);
  assert.equal(result.mode, 'git tracked + untracked');
  assert.deepEqual(result.files, ['new.ts', 'tracked.ts']);
  await assert.rejects(scanSecretFiles(root, result.files), /new\.ts: GitHub token/);
});

test('Git ignores and generated-file policy apply to untracked files', async (t) => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, '.gitignore'), 'ignored.ts\n');
  await fs.writeFile(path.join(root, 'ignored.ts'), 'safe');
  await fs.writeFile(path.join(root, 'visible.ts'), 'safe');
  await fs.mkdir(path.join(root, 'outputs'));
  await fs.writeFile(path.join(root, 'outputs', 'generated.ts'), 'safe');
  await fs.writeFile(path.join(root, 'image.png'), 'fixture');
  const { files } = await discoverSecretFiles(root);
  assert.deepEqual(files, ['.gitignore', 'visible.ts']);
});

test('tracked ignored files and assets retain coverage', async (t) => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, 'tracked.ts'), 'safe');
  await fs.writeFile(path.join(root, 'asset.png'), 'fixture');
  add(root, 'tracked.ts', 'asset.png');
  await fs.writeFile(path.join(root, '.gitignore'), 'tracked.ts\nasset.png\n');
  assert.deepEqual((await discoverSecretFiles(root)).files, [
    '.gitignore',
    'asset.png',
    'tracked.ts',
  ]);
});

test('whitespace and newline filenames remain intact', async (t) => {
  const root = await fixture(t);
  const names = ['space name.ts', 'new\nline.ts'];
  for (const name of names) await fs.writeFile(path.join(root, name), 'safe');
  add(root, ...names);
  assert.deepEqual((await discoverSecretFiles(root)).files, names.sort());
});

test('an archive uses the existing source and generated-file boundaries', async (t) => {
  const root = await fixture(t, false);
  await fs.writeFile(path.join(root, 'source.cs'), 'safe');
  await fs.mkdir(path.join(root, 'node_modules'));
  await fs.writeFile(path.join(root, 'node_modules', 'dependency.js'), 'safe');
  await fs.mkdir(path.join(root, 'outputs'));
  await fs.writeFile(path.join(root, 'outputs', 'generated.md'), 'safe');
  const result = await discoverSecretFiles(root);
  assert.equal(result.mode, 'source archive');
  assert.deepEqual(result.files, ['source.cs']);
});

test('broken Git metadata fails instead of falling back silently', async (t) => {
  const root = await fixture(t, false);
  await fs.writeFile(path.join(root, '.git'), 'gitdir: missing-git-directory\n');
  await assert.rejects(discoverSecretFiles(root), /Git file discovery failed/);
});

test('an unreadable tracked candidate is not lost during discovery', async (t) => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, 'removed.ts'), 'safe');
  add(root, 'removed.ts');
  await fs.unlink(path.join(root, 'removed.ts'));
  const { files } = await discoverSecretFiles(root);
  assert.deepEqual(files, ['removed.ts']);
  await assert.rejects(scanSecretFiles(root, files), /unreadable files:\nremoved.ts/);
});
