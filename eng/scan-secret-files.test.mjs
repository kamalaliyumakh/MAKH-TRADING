import assert from 'node:assert/strict';
import test from 'node:test';
import { scanSecretFiles } from './scan-secret-files.mjs';

test('clean files are deduplicated and counted, with progress', async () => {
  const progress = [];
  const result = await scanSecretFiles('/fixture', ['b.ts', 'a.ts', 'b.ts'], {
    readFile: async () => 'const enabled = false;',
    onProgress: (done, total) => progress.push([done, total]),
  });
  assert.deepEqual(result, { scannedFiles: 2 });
  assert.deepEqual(progress, [
    [1, 2],
    [2, 2],
  ]);
});

test('all existing detection categories reject without exposing matched values', async () => {
  const samples = [
    ['private key', ['-----BEGIN ', 'PRIVATE KEY-----'].join('')],
    ['AWS access key', 'AKIA' + 'A'.repeat(16)],
    ['GitHub token', 'ghp_' + 'A'.repeat(30)],
    ['Stripe live key', 'sk_' + 'live_' + 'A'.repeat(20)],
    ['generic credential assignment', 'password = ' + JSON.stringify('A'.repeat(16))],
  ];
  for (const [category, sample] of samples) {
    await assert.rejects(
      scanSecretFiles('/fixture', ['sample.ts'], { readFile: async () => sample }),
      (error) =>
        error.message.includes(`sample.ts: ${category}`) && !error.message.includes(sample),
    );
  }
});

test('unreadable input fails closed without leaking the filesystem error', async () => {
  await assert.rejects(
    scanSecretFiles('/fixture', ['unreadable.ts'], {
      readFile: async () => {
        throw new Error('private error payload');
      },
    }),
    (error) =>
      error.message.includes('unreadable.ts') &&
      error.message.includes('incomplete') &&
      !error.message.includes('private error payload'),
  );
});

test('concurrency is bounded and findings remain sorted despite completion order', async () => {
  let active = 0;
  let maximum = 0;
  const token = 'ghp_' + 'B'.repeat(30);
  await assert.rejects(
    scanSecretFiles('/fixture', ['c.ts', 'b.ts', 'a.ts'], {
      concurrency: 2,
      readFile: async (file) => {
        maximum = Math.max(maximum, ++active);
        await new Promise((resolve) => setTimeout(resolve, file.endsWith('a.ts') ? 10 : 1));
        active--;
        return token;
      },
    }),
    {
      message:
        'Potential secrets detected:\na.ts: GitHub token\nb.ts: GitHub token\nc.ts: GitHub token',
    },
  );
  assert.equal(maximum, 2);
  assert.equal(active, 0);
});

test('read errors and findings are both retained', async () => {
  await assert.rejects(
    scanSecretFiles('/fixture', ['bad.ts', 'missing.ts'], {
      readFile: async (file) => {
        if (file.endsWith('missing.ts')) throw new Error('unavailable');
        return 'ghp_' + 'C'.repeat(30);
      },
    }),
    (error) =>
      error.message.includes('missing.ts') && error.message.includes('bad.ts: GitHub token'),
  );
});

test('empty input does not attempt a read', async () => {
  assert.deepEqual(
    await scanSecretFiles('/fixture', [], {
      readFile: async () => assert.fail('unexpected read'),
    }),
    { scannedFiles: 0 },
  );
});

test('invalid concurrency is rejected', async () => {
  for (const concurrency of [0, -1, 1.5, 33, NaN]) {
    await assert.rejects(scanSecretFiles('/fixture', [], { concurrency }), /concurrency/);
  }
});
