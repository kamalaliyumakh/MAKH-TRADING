import fs from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const sourceRoots = ['apps', 'libs'];
const violations = [];

const visit = async (relativeDirectory) => {
  const directory = path.join(repositoryRoot, relativeDirectory);
  let entries = [];

  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      await visit(relativePath);
      continue;
    }
    if (!entry.name.endsWith('.ts') || entry.name.endsWith('.spec.ts')) continue;

    const content = await fs.readFile(path.join(repositoryRoot, relativePath), 'utf8');
    const imports = [...content.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);

    for (const specifier of imports) {
      if (relativePath.startsWith('libs/') && specifier.includes('/apps/')) {
        violations.push(`${relativePath}: libraries cannot import application code (${specifier})`);
      }
      if (specifier.startsWith('@makh/') && specifier.includes('/src/')) {
        violations.push(`${relativePath}: import library public APIs only (${specifier})`);
      }
      if (specifier.startsWith('../') && specifier.includes('libs/')) {
        violations.push(`${relativePath}: cross-library imports must use @makh aliases (${specifier})`);
      }
    }
  }
};

for (const root of sourceRoots) await visit(root);

if (violations.length > 0) {
  throw new Error(`Angular boundary violations:\n${violations.join('\n')}`);
}

console.log('Angular import boundaries verified.');
