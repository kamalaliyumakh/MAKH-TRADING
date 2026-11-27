# Scanner Browser Compatibility Baseline

Date: 29 September 2026  
Scope: Local authenticated production-artifact scanner route  
Decision: Available Chromium, Firefox and WebKit engine checks pass; supported-browser acceptance remains incomplete

## Coverage

- Playwright-bundled Chromium at 1280 × 800 and 320 × 800.
- Locally installed Google Chrome Stable at 1280 × 800 and 320 × 800.
- Playwright-managed Firefox at 1280 × 800 and 320 × 800.
- Playwright-managed WebKit at 1280 × 800 and 320 × 800.
- Each case verifies authenticated route access, one H1 and main landmark, candidate-table rendering, keyboard focus, excluded-state filtering, three expected excluded rows, no horizontal document overflow and no console/page errors.
- Machine-readable results are retained at `outputs/scanner-browser-compatibility/local-results.json`.

## Result

- All eight authenticated cases pass.
- All four browser targets render the production artifact and preserve the scanner’s fail-closed, discovery-only boundary.

## Boundary

Shipping Apple Safari and Microsoft Edge remain untested. Playwright WebKit provides engine coverage but is not Safari product certification; Google Chrome coverage does not certify Edge. These checks do not replace the approved supported-browser matrix, real-device testing, hosted execution, assistive-technology sessions or accountable Accessibility/QA approval. No paper or live trading authority is created.
