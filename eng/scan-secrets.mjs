import path from 'node:path';
import { scanSecretFiles } from './scan-secret-files.mjs';
import { discoverSecretFiles } from './discover-secret-files.mjs';

const root = path.resolve(import.meta.dirname, '..');
const { files, mode } = await discoverSecretFiles(root);

const candidates = files.filter((relative) => relative !== 'eng/scan-secrets.mjs');
console.log(
  `Secret scan starting (${mode}): ${candidates.length} files, up to 8 concurrent reads.`,
);
const result = await scanSecretFiles(root, candidates, {
  onProgress: (completed, total) => {
    if (completed % 50 === 0 || completed === total) {
      console.log(`Secret scan progress: ${completed}/${total} files checked.`);
    }
  },
});
console.log(`Secret scan passed across ${result.scannedFiles} source files.`);
