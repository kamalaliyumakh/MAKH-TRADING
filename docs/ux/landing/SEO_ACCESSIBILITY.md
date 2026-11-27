# MAKH Trading Platform — Public SEO and Accessibility Specification

Last updated: 12 August 2026

## Metadata

| Route | Title | Description intent | Indexing |
|---|---|---|---|
| `/` | MAKH Trading Platform — Risk-Controlled Trading Workflow | Evidence, risk checks, broker-state monitoring and self-directed paper-first scope | index |
| `/platform` | Platform — MAKH Trading | Discovery-to-review workflow and safety boundaries | index |
| `/security` | Security — MAKH Trading | Identity, authorization, risk, order and audit controls | index |
| `/status` | Service Status — MAKH Trading | Public component availability and incidents | index |
| `/about` | About — MAKH Trading | Mission, audience and operating boundaries | index |
| `/legal/risk` | Trading Risk Disclosures — MAKH Trading | Low-priced-stock, liquidity, execution, data and technology risk | index |
| `/privacy` | Privacy Notice — MAKH Trading | Data categories, purposes, providers, retention and rights | index |
| `/request-access` | Request Access — MAKH Trading | Minimal expression-of-interest form | noindex until launch controls approved |
| `/sign-in` | Sign In — MAKH Trading | Secure identity-provider entry | noindex |

Canonical URLs, sitemap, robots rules, social metadata and organization/product structured data use the approved production origin and legal entity only after those values are decided. Structured data must not contain ratings, returns or claims not supported by approved evidence.

## Content and technical SEO

- Angular public app uses SSR/prerender for stable public routes; status may hydrate dynamic public data safely.
- One descriptive H1, meaningful headings, crawlable text and descriptive internal links.
- No keyword stuffing or hidden performance claims.
- Route-level metadata and visible copy remain consistent.
- Performance budget baseline: minimal blocking script/style, responsive images, reserved dimensions and no decorative autoplay media.

## Accessibility acceptance

- Landmarks, skip link, page title, one H1 and logical focus after navigation.
- Mobile menu, FAQ and consent controls follow native/established keyboard patterns.
- Form labels persist; error summary receives focus and links to fields; success is announced once.
- Status and incidents use text/icon/timestamp, not color alone.
- Risk disclosures support reflow, on-page headings and print without losing content.
- At 320 CSS px and 400% zoom, no horizontal page scroll except a purposeful labelled data region.
- Reduced-motion and forced-colors modes preserve operation and focus.
- Automated axe scans plus manual keyboard, screen-reader and zoom testing cover PR-01 through PR-09.

## Analytics/privacy boundary

Approved public analytics may record route, generic interaction and performance events after applicable consent. It must not record form field values, free text, identity-provider URLs/codes, session identifiers, broker/account information or portal content. Request-access success uses an internal event without the user’s email/name.
