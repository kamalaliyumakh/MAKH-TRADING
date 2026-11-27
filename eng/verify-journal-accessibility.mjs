import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.PORTAL_BASE_URL ?? 'http://127.0.0.1:58581';
const outputDir = path.resolve('outputs/journal-accessibility');
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'narrow', width: 320, height: 800 },
];
const failures = [];
const evidence = [];
const browser = await chromium.launch({ headless: true });

const snapshot = () => {
  const asOf = new Date().toISOString();
  return {
    accountId: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000002',
    snapshotId: 'synthetic-journal-browser-audit',
    asOf,
    entries: [
      ['61000000-0000-0000-0000-000000000001', 'TRKA', 'Reviewed', 18.4, 3],
      ['61000000-0000-0000-0000-000000000002', 'XCUR', 'Reviewed', -4.6, 2],
      ['61000000-0000-0000-0000-000000000003', 'SYNB', 'Draft', null, 3],
      ['61000000-0000-0000-0000-000000000004', 'DFLI', 'Archived', 7.2, 2],
    ].map(([entryId, symbol, state, resultPercent, evidenceCount], index) => ({
      entryId,
      symbol,
      side: 'Long',
      state,
      openedAt: new Date(Date.now() - (index + 1) * 3_600_000).toISOString(),
      thesis: `Synthetic ${symbol} process thesis for browser verification.`,
      outcome:
        state === 'Draft'
          ? 'Outcome review is pending. No execution authority exists.'
          : 'Synthetic outcome retained for process review.',
      resultPercent,
      tags: ['synthetic', String(state).toLowerCase()],
      evidenceCount,
    })),
    dataMode: 'Synthetic',
    containsPersonalNotes: false,
    isReadOnly: true,
    createsTradingAuthority: false,
    canChangeRisk: false,
    canSubmitOrder: false,
  };
};

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(() => {
      sessionStorage.setItem(
        'makh.uat.session',
        JSON.stringify({ authenticated: true, expiresAt: Date.now() + 10 * 60 * 1000 }),
      );
    });
    await context.route('**/api/v1/journal', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'cache-control': 'no-store' },
        body: JSON.stringify(snapshot()),
      });
    });
    const page = await context.newPage();
    const consoleErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    const response = await page.goto(`${baseUrl}/app/journal`, { waitUntil: 'networkidle' });
    if (!response?.ok() || page.url().includes('/login')) {
      failures.push(`${viewport.name}: authenticated journal route was unavailable.`);
      await context.close();
      continue;
    }
    await page.locator('.entry').first().waitFor();
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    const structure = await page.evaluate(() => ({
      h1Count: document.querySelectorAll('h1').length,
      mainCount: document.querySelectorAll('main').length,
      entryCount: document.querySelectorAll('.entry').length,
      resultBarCount: document.querySelectorAll('.result-bar').length,
      ringLabel: document.querySelector('.ring')?.getAttribute('aria-label') ?? '',
      buttonCount: document.querySelectorAll('.journal button').length,
      formCount: document.querySelectorAll('.journal form').length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      text: document.body.textContent ?? '',
    }));

    for (const violation of axe.violations) {
      failures.push(
        `${viewport.name}: ${violation.id} — ${violation.nodes.flatMap((node) => node.target).join(', ')}`,
      );
    }
    for (const incomplete of axe.incomplete.filter(
      (item) =>
        item.id === 'aria-prohibited-attr' &&
        item.nodes.some((node) =>
          node.target.some((target) => String(target).includes('summary-grid')),
        ),
    )) {
      if (incomplete.impact === 'serious' || incomplete.impact === 'critical')
        failures.push(
          `${viewport.name}: unresolved journal accessibility review ${incomplete.id}.`,
        );
    }
    if (structure.h1Count !== 1) failures.push(`${viewport.name}: expected one h1.`);
    if (structure.mainCount !== 1) failures.push(`${viewport.name}: expected one main landmark.`);
    if (structure.entryCount !== 4)
      failures.push(`${viewport.name}: expected four journal entries.`);
    if (structure.resultBarCount !== 3)
      failures.push(`${viewport.name}: expected three result bars.`);
    if (!structure.ringLabel.includes('percent'))
      failures.push(`${viewport.name}: review ring lacks an accessible label.`);
    if (structure.buttonCount || structure.formCount)
      failures.push(`${viewport.name}: consequential controls are present.`);
    if (structure.overflow)
      failures.push(`${viewport.name}: horizontal viewport overflow detected.`);
    if (!structure.text.includes('Synthetic, non-authoritative and non-executable'))
      failures.push(`${viewport.name}: safety boundary is missing.`);
    if (consoleErrors.length)
      failures.push(`${viewport.name}: console errors: ${consoleErrors.join(' | ')}`);
    evidence.push({
      viewport,
      structure: { ...structure, text: undefined },
      axeIncomplete: axe.incomplete,
      consoleErrors,
    });
    await context.close();
  }

  const deniedContext = await browser.newContext({ viewport: viewports[0] });
  await deniedContext.addInitScript(() => {
    sessionStorage.setItem(
      'makh.uat.session',
      JSON.stringify({ authenticated: true, expiresAt: Date.now() + 10 * 60 * 1000 }),
    );
  });
  await deniedContext.route('**/api/v1/journal', (route) =>
    route.fulfill({ status: 403, body: '{}' }),
  );
  const deniedPage = await deniedContext.newPage();
  await deniedPage.goto(`${baseUrl}/app/journal`, { waitUntil: 'networkidle' });
  const denied = await deniedPage.evaluate(() => ({
    alert: document.querySelector('[role="alert"]')?.textContent ?? '',
    entries: document.querySelectorAll('.entry').length,
    metrics: document.querySelectorAll('.summary-grid').length,
  }));
  if (!denied.alert.includes('Journal records unavailable') || denied.entries || denied.metrics)
    failures.push('denied: the 403 state did not hide all journal records and metrics.');
  evidence.push({ state: 'denied', ...denied });
  await deniedContext.close();
} finally {
  await browser.close();
}

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(
  path.join(outputDir, 'local-browser-results.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), baseUrl, evidence, failures }, null, 2),
);

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(
    'Journal browser verification passed: two authenticated viewports plus denied state, zero axe violations, no overflow, no consequential controls and no console errors.',
  );
}
