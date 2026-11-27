import fs from 'node:fs';
import path from 'node:path';

const browserRoot = path.resolve('dist/web-public/browser');
const publicStyles = fs.readFileSync(path.resolve('apps/web-public/src/styles.scss'), 'utf8');
const routes = [
  '',
  'platform',
  'security',
  'status',
  'about',
  'legal/risk',
  'privacy',
  'request-access',
  'sign-in',
];
const failures = [];

const requiredAccessibilityStyles = [
  ['reduced-motion media query', /@media\s*\(prefers-reduced-motion:\s*reduce\)/],
  ['reduced animation duration', /animation-duration:\s*0\.01ms\s*!important/],
  ['single reduced-motion iteration', /animation-iteration-count:\s*1\s*!important/],
  ['forced-colors media query', /@media\s*\(forced-colors:\s*active\)/],
  ['forced-colors structural border', /border:\s*1px solid CanvasText/],
];

for (const [label, pattern] of requiredAccessibilityStyles) {
  if (!pattern.test(publicStyles)) failures.push(`public styles: missing ${label}`);
}

for (const route of routes) {
  const file = path.join(browserRoot, route, 'index.html');
  if (!fs.existsSync(file)) {
    failures.push(`${route || '/'}: missing prerendered page`);
    continue;
  }
  const html = fs.readFileSync(file, 'utf8');
  const h1Count = (html.match(/<h1(?:\s|>)/g) ?? []).length;
  if (h1Count !== 1) failures.push(`${route || '/'}: expected one H1, found ${h1Count}`);
  if (!/<title>[^<]{8,}<\/title>/.test(html)) failures.push(`${route || '/'}: missing title`);
  if (!/<meta name="description" content="[^"]{30,}"/.test(html)) {
    failures.push(`${route || '/'}: missing description`);
  }
  if (!/<meta property="og:type" content="website"/.test(html))
    failures.push(`${route || '/'}: missing Open Graph type`);
  if (!/<meta property="og:site_name" content="MAKH Trading"/.test(html))
    failures.push(`${route || '/'}: missing Open Graph site name`);
  if (!/<meta property="og:title" content="[^"]{8,}"/.test(html))
    failures.push(`${route || '/'}: missing Open Graph title`);
  if (!/<meta property="og:description" content="[^"]{30,}"/.test(html))
    failures.push(`${route || '/'}: missing Open Graph description`);
  if (!/<meta name="twitter:card" content="summary"/.test(html))
    failures.push(`${route || '/'}: missing Twitter card type`);
  if (!/<meta name="twitter:title" content="[^"]{8,}"/.test(html))
    failures.push(`${route || '/'}: missing Twitter title`);
  if (!/<meta name="twitter:description" content="[^"]{30,}"/.test(html))
    failures.push(`${route || '/'}: missing Twitter description`);
  if (/<link rel="canonical"|property="og:url"|property="og:image"/.test(html))
    failures.push(`${route || '/'}: origin-dependent metadata published before approval`);
  const shouldNoIndex = route === 'request-access' || route === 'sign-in';
  const hasNoIndex = /<meta name="robots" content="noindex,nofollow"/.test(html);
  if (shouldNoIndex !== hasNoIndex) failures.push(`${route || '/'}: incorrect robots directive`);
  if (/googletagmanager|google-analytics|segment\.com|posthog|mixpanel|hotjar/i.test(html)) {
    failures.push(`${route || '/'}: unapproved analytics/tracking reference`);
  }
}

const assets = fs.readdirSync(browserRoot);
const initialJs = assets.filter((name) => /^main-.*\.js$/.test(name));
const initialCss = assets.filter((name) => /^styles-.*\.css$/.test(name));
const size = (names) =>
  names.reduce((total, name) => total + fs.statSync(path.join(browserRoot, name)).size, 0);
if (size(initialJs) > 500_000) failures.push('initial JavaScript exceeds 500 kB raw budget');
if (size(initialCss) > 100_000) failures.push('initial CSS exceeds 100 kB raw budget');
const logoPath = path.join(browserRoot, 'makh-trading-logo.png');
if (!fs.existsSync(logoPath)) {
  failures.push('deployed brand logo is missing');
} else if (fs.statSync(logoPath).size > 32_000) {
  failures.push('deployed brand logo exceeds 32 kB raw budget');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Public quality verification passed: ${routes.length} routes, one H1 and route metadata each, no unapproved analytics, JS ${size(initialJs)} bytes, CSS ${size(initialCss)} bytes.`,
);
