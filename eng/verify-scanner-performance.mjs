import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.PORTAL_BASE_URL ?? 'http://127.0.0.1:58581';
const outputDir = path.resolve('outputs/scanner-performance');
const thresholds = {
  cumulativeLayoutShift: 0.1,
  largestContentfulPaintMs: 2500,
  loadEventMs: 2000,
  totalBlockingTimeMs: 200,
};
const runs = [];
const failures = [];
const browser = await chromium.launch({ headless: true });

try {
  for (let run = 1; run <= 3; run++) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    await context.addInitScript(() => {
      sessionStorage.setItem(
        'makh.uat.session',
        JSON.stringify({ authenticated: true, expiresAt: Date.now() + 10 * 60 * 1000 }),
      );
      window.__scannerPerformance = { cls: 0, lcp: 0, blocking: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) window.__scannerPerformance.lcp = entry.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) window.__scannerPerformance.cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__scannerPerformance.blocking += Math.max(0, entry.duration - 50);
        }
      }).observe({ type: 'longtask', buffered: true });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));
    const response = await page.goto(`${baseUrl}/app/scanner`, { waitUntil: 'networkidle' });
    await page.locator('h1').waitFor();
    await page.waitForTimeout(250);
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        cumulativeLayoutShift: window.__scannerPerformance.cls,
        largestContentfulPaintMs: window.__scannerPerformance.lcp,
        loadEventMs: navigation.loadEventEnd - navigation.startTime,
        totalBlockingTimeMs: window.__scannerPerformance.blocking,
        resourceCount: performance.getEntriesByType('resource').length,
      };
    });
    runs.push({ run, route: '/app/scanner', status: response?.status() ?? null, metrics, errors });
    if (!response?.ok() || page.url().includes('/login'))
      failures.push(`Run ${run}: authenticated scanner route was unavailable.`);
    if (errors.length) failures.push(`Run ${run}: ${errors.join(' | ')}`);
    for (const [metric, maximum] of Object.entries(thresholds)) {
      if (metrics[metric] > maximum)
        failures.push(`Run ${run}: ${metric} ${metrics[metric]} exceeded ${maximum}.`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const worst = Object.fromEntries(
  Object.keys(thresholds).map((metric) => [
    metric,
    Math.max(...runs.map((run) => run.metrics[metric])),
  ]),
);
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(
  path.join(outputDir, 'local-results.json'),
  `${JSON.stringify(
    {
      generatedAtUtc: new Date().toISOString(),
      scope: 'Local authenticated production-artifact scanner performance evidence',
      productionClaimed: false,
      thresholds,
      worst,
      runs,
      failures,
    },
    null,
    2,
  )}\n`,
);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Scanner performance verification passed across ${runs.length} local production-artifact runs: LCP ≤ ${worst.largestContentfulPaintMs.toFixed(0)} ms, CLS ≤ ${worst.cumulativeLayoutShift.toFixed(3)}, load ≤ ${worst.loadEventMs.toFixed(0)} ms and blocking ≤ ${worst.totalBlockingTimeMs.toFixed(0)} ms.`,
);
