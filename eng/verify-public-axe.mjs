import AxeBuilder from '@axe-core/playwright';
import { chromium } from 'playwright';

const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://127.0.0.1:58580';
const routes = [
  '/',
  '/platform',
  '/security',
  '/status',
  '/about',
  '/legal/risk',
  '/privacy',
  '/request-access',
  '/sign-in',
];
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'mobile', width: 390, height: 844 },
];

const browser = await chromium.launch({ headless: true });
const failures = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    for (const route of routes) {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
      if (!response?.ok()) {
        failures.push(`${viewport.name} ${route}: HTTP ${response?.status() ?? 'no response'}`);
        continue;
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      for (const violation of results.violations) {
        const targets = violation.nodes.flatMap((node) => node.target).join(', ');
        failures.push(
          `${viewport.name} ${route}: ${violation.id} (${violation.impact ?? 'unknown'}) — ${targets}`,
        );
      }
    }

    await context.close();
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Public axe verification passed: ${routes.length} routes across ${viewports.length} Chromium viewports with WCAG A/AA tags and no violations.`,
);
