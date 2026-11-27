import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.PORTAL_BASE_URL ?? 'http://127.0.0.1:4200';
const outputDir = path.resolve('outputs/scanner-accessibility');
const viewports = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'zoom-200-reflow', width: 640, height: 800, keyboard: false },
  { name: 'narrow', width: 320, height: 800 },
];
const modes = [
  { name: 'standard' },
  { name: 'forced-colors', forcedColors: 'active' },
  { name: 'reduced-motion', reducedMotion: 'reduce' },
];
const failures = [];
const evidence = [];
const browser = await chromium.launch({ headless: true });

try {
  for (const viewport of viewports) {
    for (const mode of modes) {
      const label = `${viewport.name}/${mode.name}`;
      const context = await browser.newContext({
        viewport,
        forcedColors: mode.forcedColors,
        reducedMotion: mode.reducedMotion,
      });
      await context.addInitScript(() => {
        sessionStorage.setItem(
          'makh.uat.session',
          JSON.stringify({ authenticated: true, expiresAt: Date.now() + 10 * 60 * 1000 }),
        );
      });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => consoleErrors.push(error.message));

      const response = await page.goto(`${baseUrl}/app/scanner`, { waitUntil: 'networkidle' });
      if (!response?.ok() || page.url().includes('/login')) {
        failures.push(`${label}: authenticated scanner route was unavailable.`);
        await context.close();
        continue;
      }

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      const structure = await page.evaluate(() => {
        const milliseconds = (value) =>
          value
            .split(',')
            .map((entry) =>
              entry.trim().endsWith('ms')
                ? Number.parseFloat(entry)
                : Number.parseFloat(entry) * 1000,
            );
        const missingBorders = ['.state', '#candidate-filter', '.warning', '.rules', '.table-wrap']
          .flatMap((selector) => [...document.querySelectorAll(selector)])
          .filter((element) => {
            const style = getComputedStyle(element);
            return style.borderTopStyle === 'none' || Number.parseFloat(style.borderTopWidth) < 1;
          }).length;
        const motionOffenders = [...document.querySelectorAll('*')].filter((element) => {
          const style = getComputedStyle(element);
          return (
            milliseconds(style.animationDuration).some((duration) => duration > 0.01) ||
            milliseconds(style.transitionDuration).some((duration) => duration > 0.01) ||
            Number.parseFloat(style.animationIterationCount) > 1
          );
        }).length;
        return {
          h1Count: document.querySelectorAll('h1').length,
          mainCount: document.querySelectorAll('main').length,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
          title: document.title,
          forcedColorsActive: matchMedia('(forced-colors: active)').matches,
          reducedMotionActive: matchMedia('(prefers-reduced-motion: reduce)').matches,
          missingBorders,
          motionOffenders,
        };
      });
      await page.locator('#candidate-filter').focus();
      const filterFocused = await page
        .locator('#candidate-filter')
        .evaluate((element) => element === document.activeElement);
      let keyboardJourney = null;
      let textSpacing = null;
      if (mode.name === 'standard' && viewport.keyboard !== false) {
        await page.evaluate(() => {
          document.body.tabIndex = -1;
          document.body.focus();
        });
        await page.keyboard.press('Tab');
        const skipLink = await page.evaluate(() => {
          const active = document.activeElement;
          const style = active ? getComputedStyle(active) : null;
          const box = active?.getBoundingClientRect();
          return {
            matched: active?.matches('.skip-link') ?? false,
            visible: Boolean(box && box.top >= 0 && box.width > 0 && box.height > 0),
            outlined: Boolean(
              style && style.outlineStyle !== 'none' && Number.parseFloat(style.outlineWidth) >= 2,
            ),
          };
        });
        await page.keyboard.press('Enter');
        const skipTargetReached = await page.evaluate(
          () =>
            document.activeElement?.matches('#portal-content') === true &&
            location.pathname === '/app/scanner',
        );

        const tabUntil = async (selector, maximumTabs = 24) => {
          for (let index = 0; index < maximumTabs; index++) {
            const matched = await page.evaluate(
              (target) => document.activeElement?.matches(target) ?? false,
              selector,
            );
            if (matched) return index;
            await page.keyboard.press('Tab');
          }
          return -1;
        };
        const summaryTabs = await tabUntil('details.rules > summary');
        if (summaryTabs >= 0) await page.keyboard.press('Enter');
        const rulesOpened =
          summaryTabs >= 0
            ? await page.locator('details.rules').evaluate((details) => details.open)
            : false;
        const filterTabs = await tabUntil('#candidate-filter');
        if (filterTabs >= 0) await page.keyboard.press('e');
        const filterChanged =
          filterTabs >= 0 && (await page.locator('#candidate-filter').inputValue()) === 'Excluded';
        if (filterChanged) await page.locator('a[href*="/app/symbols/"]').first().waitFor();
        const symbolTabs = await tabUntil('a[href*="/app/symbols/"]');
        const symbolFocused = await page.evaluate(
          () => document.activeElement?.matches('a[href*="/app/symbols/"]') ?? false,
        );
        await page.keyboard.press('Shift+Tab');
        const reverseReturnedToFilter = await page.evaluate(
          () => document.activeElement?.matches('#candidate-filter') ?? false,
        );
        keyboardJourney = {
          skipLink,
          skipTargetReached,
          summaryTabs,
          rulesOpened,
          filterTabs,
          filterChanged,
          symbolTabs,
          symbolFocused,
          reverseReturnedToFilter,
        };
        if (!skipLink.matched || !skipLink.visible || !skipLink.outlined)
          failures.push(`${label}: skip link was not visibly keyboard focused.`);
        if (!skipTargetReached) failures.push(`${label}: skip link did not reach portal content.`);
        if (summaryTabs < 0 || !rulesOpened)
          failures.push(`${label}: preset rules were not keyboard operable.`);
        if (filterTabs < 0 || !filterChanged)
          failures.push(`${label}: candidate filter was not keyboard operable.`);
        if (symbolTabs < 0 || !symbolFocused)
          failures.push(`${label}: symbol review link was not keyboard reachable.`);
        if (!reverseReturnedToFilter)
          failures.push(`${label}: reverse navigation did not return to the candidate filter.`);

        textSpacing = await page.evaluate(() => {
          const style = document.createElement('style');
          style.dataset.testId = 'wcag-text-spacing';
          style.textContent = `
            * { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }
            p { margin-bottom: 2em !important; }
          `;
          document.head.append(style);
          const clippedControls = [
            ...document.querySelectorAll('a:not(.brand), button, label, summary, select'),
          ]
            .filter((element) => {
              const box = element.getBoundingClientRect();
              return (
                box.width > 0 &&
                box.height > 0 &&
                (element.scrollWidth > element.clientWidth + 1 ||
                  element.scrollHeight > element.clientHeight + 1)
              );
            })
            .map(
              (element) =>
                element.id || element.getAttribute('href') || element.textContent?.trim(),
            )
            .filter(Boolean);
          return {
            horizontalOverflow:
              document.documentElement.scrollWidth > document.documentElement.clientWidth,
            clippedControls,
          };
        });
        if (textSpacing.horizontalOverflow)
          failures.push(`${label}: text-spacing overrides caused horizontal viewport overflow.`);
        if (textSpacing.clippedControls.length)
          failures.push(
            `${label}: text-spacing overrides clipped controls: ${textSpacing.clippedControls.join(', ')}.`,
          );
      }

      for (const violation of results.violations) {
        const targets = violation.nodes.flatMap((node) => node.target).join(', ');
        failures.push(`${label}: ${violation.id} (${violation.impact ?? 'unknown'}) — ${targets}`);
      }
      if (structure.h1Count !== 1) failures.push(`${label}: expected one h1.`);
      if (structure.mainCount !== 1) failures.push(`${label}: expected one main landmark.`);
      if (structure.overflow) failures.push(`${label}: horizontal viewport overflow detected.`);
      if (!filterFocused) failures.push(`${label}: candidate filter did not receive focus.`);
      if (mode.forcedColors && !structure.forcedColorsActive)
        failures.push(`${label}: forced-colors emulation was inactive.`);
      if (mode.forcedColors && structure.missingBorders)
        failures.push(`${label}: ${structure.missingBorders} structural borders were missing.`);
      if (mode.reducedMotion && !structure.reducedMotionActive)
        failures.push(`${label}: reduced-motion emulation was inactive.`);
      if (mode.reducedMotion && structure.motionOffenders)
        failures.push(`${label}: ${structure.motionOffenders} elements retained motion.`);
      if (consoleErrors.length) failures.push(`${label}: ${consoleErrors.join(' | ')}`);

      evidence.push({
        viewport,
        mode: mode.name,
        route: '/app/scanner',
        title: structure.title,
        violations: results.violations.length,
        incomplete: results.incomplete.length,
        incompleteRules: results.incomplete.map((item) => ({
          id: item.id,
          impact: item.impact,
          help: item.help,
          targets: item.nodes.flatMap((node) => node.target),
        })),
        horizontalOverflow: structure.overflow,
        filterFocused,
        keyboardJourney,
        textSpacing,
        forcedColorsActive: structure.forcedColorsActive,
        reducedMotionActive: structure.reducedMotionActive,
        missingStructuralBorders: structure.missingBorders,
        motionOffenders: structure.motionOffenders,
        consoleErrors,
      });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(
  path.join(outputDir, 'local-axe-results.json'),
  `${JSON.stringify(
    {
      generatedAtUtc: new Date().toISOString(),
      scope: 'Local synthetic authenticated scanner accessibility evidence',
      wcagConformanceClaimed: false,
      manualReviewRequired: true,
      viewports: evidence,
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
  `Scanner accessibility verification passed: ${viewports.length * modes.length} authenticated Chromium viewport/mode cases plus ${viewports.filter((viewport) => viewport.keyboard !== false).length} keyboard-only and text-spacing journeys, zero axe violations, preference safeguards active, no overflow or console errors; incomplete axe items are retained for manual review.`,
);
