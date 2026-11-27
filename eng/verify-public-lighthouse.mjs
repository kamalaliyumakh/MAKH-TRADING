import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://127.0.0.1:58580';
const outputDir = path.resolve(process.env.LIGHTHOUSE_OUTPUT_DIR ?? 'outputs/public-lighthouse');
const routes = [
  { name: 'home', path: '/' },
  { name: 'platform', path: '/platform' },
  { name: 'security', path: '/security' },
];
const thresholds = {
  accessibility: 0.95,
  'best-practices': 0.9,
  performance: 0.85,
  seo: 0.9,
};
const failures = [];
const summary = [];

fs.mkdirSync(outputDir, { recursive: true });

for (const route of routes) {
  const reportPath = path.join(outputDir, `${route.name}.json`);
  const result = spawnSync(
    path.resolve('node_modules/.bin/lighthouse'),
    [
      `${baseUrl}${route.path}`,
      '--quiet',
      '--preset=desktop',
      '--only-categories=performance,accessibility,best-practices,seo',
      '--output=json',
      `--output-path=${reportPath}`,
      '--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage',
    ],
    {
      encoding: 'utf8',
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
    },
  );

  if (result.status !== 0) {
    failures.push(`${route.path}: Lighthouse failed — ${result.stderr.trim() || 'unknown error'}`);
    continue;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const scores = Object.fromEntries(
    Object.keys(thresholds).map((category) => [category, report.categories[category]?.score ?? 0]),
  );
  const metrics = {
    cumulativeLayoutShift: report.audits['cumulative-layout-shift']?.numericValue ?? null,
    largestContentfulPaintMs: report.audits['largest-contentful-paint']?.numericValue ?? null,
    totalBlockingTimeMs: report.audits['total-blocking-time']?.numericValue ?? null,
  };
  summary.push({ route: route.path, scores, metrics });

  for (const [category, minimum] of Object.entries(thresholds)) {
    if (scores[category] < minimum) {
      failures.push(
        `${route.path}: ${category} score ${scores[category].toFixed(2)} is below ${minimum.toFixed(2)}`,
      );
    }
  }
}

fs.writeFileSync(
  path.join(outputDir, 'summary.json'),
  `${JSON.stringify({ generatedAtUtc: new Date().toISOString(), thresholds, results: summary }, null, 2)}\n`,
);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Public Lighthouse verification passed for ${routes.length} representative routes with performance ≥ ${thresholds.performance}, accessibility ≥ ${thresholds.accessibility}, best practices ≥ ${thresholds['best-practices']} and SEO ≥ ${thresholds.seo}.`,
);
