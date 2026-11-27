# Scanner Performance Baseline

Date: 29 September 2026  
Scope: Local authenticated scanner route from the production build artifact  
Decision: Local performance budget passes; hosted and field acceptance remain pending

## Method

- Built the trading portal with the production Angular configuration and served the immutable browser artifact through a local static fallback server.
- Ran three isolated Chromium contexts at 1280 × 800 with an authenticated local UAT session.
- Captured navigation timing, Largest Contentful Paint, Cumulative Layout Shift and long-task blocking through browser performance observers.
- Failed the check for LCP above 2,500 ms, CLS above 0.1, load above 2,000 ms, blocking above 200 ms, route/authentication failure or browser errors.
- Retained each run and the aggregate worst case in `outputs/scanner-performance/local-results.json`.

## Result

- All three runs passed.
- Worst LCP: 216 ms.
- Worst CLS: 0.000.
- Worst load event: 198 ms.
- Worst total blocking time: 47 ms.
- The production build remains warning-free at 474.44 kB initial plus a 55.88 kB lazy SignalR chunk.

## Boundary

These results are local synthetic lab evidence. They are not hosted measurements, field Core Web Vitals, a production service-level objective or an operational performance guarantee. Approved infrastructure, representative network/device conditions, repeated hosted testing, field telemetry and accountable QA/Operations acceptance remain required. No paper or live trading authority is created.
