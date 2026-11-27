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
const viewport = { width: 390, height: 844 };
const failures = [];

const browser = await chromium.launch({ headless: true });

try {
  const forcedColorsContext = await browser.newContext({ viewport, forcedColors: 'active' });
  const forcedColorsPage = await forcedColorsContext.newPage();

  for (const route of routes) {
    const response = await forcedColorsPage.goto(`${baseUrl}${route}`, {
      waitUntil: 'networkidle',
    });
    if (!response?.ok()) {
      failures.push(`forced colors ${route}: HTTP ${response?.status() ?? 'no response'}`);
      continue;
    }

    const result = await forcedColorsPage.evaluate(() => {
      const borderedSelectors = [
        '.state',
        '.page-actions a',
        '.page-actions button',
        '.submit-button',
        '.form-layout form',
        '.result-panel',
      ];
      const missingBorders = borderedSelectors.flatMap((selector) =>
        [...document.querySelectorAll(selector)]
          .filter((element) => {
            const style = getComputedStyle(element);
            return style.borderTopStyle === 'none' || Number.parseFloat(style.borderTopWidth) < 1;
          })
          .map((element) => element.tagName.toLowerCase() + (element.id ? `#${element.id}` : '')),
      );

      return {
        mediaActive: matchMedia('(forced-colors: active)').matches,
        missingBorders,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    if (!result.mediaActive) failures.push(`forced colors ${route}: media emulation inactive`);
    if (result.missingBorders.length) {
      failures.push(
        `forced colors ${route}: missing structural border on ${result.missingBorders.join(', ')}`,
      );
    }
    if (result.overflow) failures.push(`forced colors ${route}: horizontal overflow`);
  }

  await forcedColorsContext.close();

  const reducedMotionContext = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const reducedMotionPage = await reducedMotionContext.newPage();

  for (const route of routes) {
    const response = await reducedMotionPage.goto(`${baseUrl}${route}`, {
      waitUntil: 'networkidle',
    });
    if (!response?.ok()) {
      failures.push(`reduced motion ${route}: HTTP ${response?.status() ?? 'no response'}`);
      continue;
    }

    const result = await reducedMotionPage.evaluate(() => {
      const milliseconds = (value) =>
        value
          .split(',')
          .map((entry) => entry.trim())
          .map((entry) =>
            entry.endsWith('ms') ? Number.parseFloat(entry) : Number.parseFloat(entry) * 1000,
          );
      const offenders = [...document.querySelectorAll('*')]
        .filter((element) => {
          const style = getComputedStyle(element);
          return (
            milliseconds(style.animationDuration).some((duration) => duration > 0.01) ||
            milliseconds(style.transitionDuration).some((duration) => duration > 0.01) ||
            Number.parseFloat(style.animationIterationCount) > 1
          );
        })
        .map((element) => element.tagName.toLowerCase() + (element.id ? `#${element.id}` : ''));

      return {
        mediaActive: matchMedia('(prefers-reduced-motion: reduce)').matches,
        offenders,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });

    if (!result.mediaActive) failures.push(`reduced motion ${route}: media emulation inactive`);
    if (result.offenders.length) {
      failures.push(`reduced motion ${route}: motion remains on ${result.offenders.join(', ')}`);
    }
    if (result.overflow) failures.push(`reduced motion ${route}: horizontal overflow`);
  }

  await reducedMotionContext.close();
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Public preference verification passed: ${routes.length} routes in forced-colors and reduced-motion Chromium contexts with structural safeguards and no horizontal overflow.`,
);
