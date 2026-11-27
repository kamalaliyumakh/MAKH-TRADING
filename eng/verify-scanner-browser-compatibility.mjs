import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium, firefox, webkit } from 'playwright';

const baseUrl = process.env.PORTAL_BASE_URL ?? 'http://127.0.0.1:58581';
const outputDir = path.resolve('outputs/scanner-browser-compatibility');
const browsers = [
  { name: 'playwright-chromium', type: chromium },
  {
    name: 'google-chrome-stable',
    type: chromium,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  },
  { name: 'playwright-firefox', type: firefox },
  { name: 'playwright-webkit', type: webkit },
];
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'narrow', width: 320, height: 800 },
];
const results = [];
const failures = [];

for (const browserTarget of browsers) {
  try {
    if (browserTarget.executablePath) await fs.access(browserTarget.executablePath);
  } catch {
    failures.push(`${browserTarget.name}: browser executable is unavailable.`);
    continue;
  }

  const browser = await browserTarget.type.launch({
    headless: true,
    executablePath: browserTarget.executablePath,
  });
  try {
    for (const viewport of viewports) {
      const label = `${browserTarget.name}/${viewport.name}`;
      const context = await browser.newContext({ viewport });
      await context.addInitScript(() => {
        sessionStorage.setItem(
          'makh.uat.session',
          JSON.stringify({ authenticated: true, expiresAt: Date.now() + 10 * 60 * 1000 }),
        );
      });
      const page = await context.newPage();
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      const response = await page.goto(`${baseUrl}/app/scanner`, { waitUntil: 'networkidle' });
      const filter = page.locator('#candidate-filter');
      await filter.waitFor();
      await filter.selectOption('Excluded');
      await page.locator('a[href*="/app/symbols/"]').first().waitFor();
      await filter.focus();
      const checks = await page.evaluate(() => ({
        h1Count: document.querySelectorAll('h1').length,
        mainCount: document.querySelectorAll('main').length,
        tableCount: document.querySelectorAll('table').length,
        excludedRows: document.querySelectorAll('tbody tr').length,
        filterFocused: document.activeElement?.matches('#candidate-filter') ?? false,
        horizontalOverflow:
          document.documentElement.scrollWidth > document.documentElement.clientWidth,
        userAgent: navigator.userAgent,
      }));
      const passed =
        response?.ok() === true &&
        !page.url().includes('/login') &&
        checks.h1Count === 1 &&
        checks.mainCount === 1 &&
        checks.tableCount === 1 &&
        checks.excludedRows === 3 &&
        checks.filterFocused &&
        !checks.horizontalOverflow &&
        errors.length === 0;
      if (!passed) failures.push(`${label}: scanner compatibility checks failed.`);
      results.push({
        browser: browserTarget.name,
        browserVersion: browser.version(),
        viewport,
        route: '/app/scanner',
        status: response?.status() ?? null,
        passed,
        checks,
        errors,
      });
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(
  path.join(outputDir, 'local-results.json'),
  `${JSON.stringify(
    {
      generatedAtUtc: new Date().toISOString(),
      scope: 'Local authenticated scanner compatibility evidence',
      supportedBrowserAcceptanceClaimed: false,
      testedBrowsers: browsers.map((browser) => browser.name),
      untestedBrowserProducts: ['Apple Safari', 'Microsoft Edge'],
      results,
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
  `Scanner browser compatibility passed ${results.length} authenticated cases across Playwright Chromium, Firefox, WebKit and installed Google Chrome; real Safari and Edge remain untested.`,
);
