# WBS 7.7 — Risk Console Acceptance

## Status

In progress — 99%.

## Delivered locally

- Angular `/app/risk` route and portal navigation.
- Fail-closed entry-block state before policy capacity and administrative context.
- Policy version/as-of labels and synthetic read-only limit usage for loss, exposure and quantity.
- Active account/symbol pauses and severity-labelled immutable breach evidence.
- Deliberately separated Block, Cancel and Liquidate containment previews.
- Explicit authorization, fresh-MFA, reason, idempotency, audit and reconciliation requirements.
- Disabled final confirmations and pause controls when authority is unavailable.
- Responsive layout and semantic alert, headings, progress indicators and buttons.
- Authenticated risk-state API returning an explicitly entry-locked, unreconciled synthetic snapshot with evidence hash.
- Fresh-MFA Risk Administrator containment-preview API for separated Block Entries, Cancel Open Orders and Liquidate Positions actions.
- Antiforgery validation, reason/correlation evidence, synthetic account identifier binding, command idempotency and changed-intent conflict rejection.
- Explicit `FinalConfirmationEnabled=false`, `MutatesTradingState=false` and `CreatesTradingAuthority=false` response boundaries.
- Read-only overview API with policy version/as-of, four bounded capacity measures, two active synthetic pauses and two hash-evidenced synthetic breaches.
- Derived remaining capacity and exceeded state without granting policy, pause, breach or order authority.
- Action-specific Block/Cancel/Liquidate impact estimates with affected-order/position counts, gross-notional context, timestamp, warnings and independent evidence hash.
- Explicitly synthetic, non-authoritative and non-executable impact boundaries.
- Typed Angular `HttpClient` integration with the authenticated overview endpoint, replacing the risk-page overview fixture.
- Loading, transport-failure and invalid/authority-bearing response handling that clears untrusted evidence and retains entry lock.
- Reason-capture workflow for separated Block, Cancel and Liquidate preview requests.
- CSRF acquisition/header propagation, client-generated command/correlation IDs and strict preview-response safety validation.
- Action-specific impact, warning and evidence display with final confirmation permanently disabled.
- Mandatory normalized account claim for portal access and exact account binding on state, overview and containment-preview requests.
- Cross-account denial and `Cache-Control: no-store` on sensitive risk responses.
- Portal session-context resolution before risk reads, with subject, paper-mode and account-ID validation.
- Overview account-echo verification and exclusive reuse of authenticated account context for containment previews.
- Evidence/account clearing on invalid, unavailable or changed session context.
- Five-minute overview freshness, bounded capacity consistency and nested/aggregate evidence-hash validation.
- Server-side stale-policy conflict rejection before any containment preview is created.
- Protected-session revalidation immediately before CSRF acquisition and containment-preview submission.
- Account drift, mode drift, invalid context and revoked-session failures clear all risk evidence and stop the request chain.
- Duplicate and malformed limit, pause and breach evidence is rejected, including contradictory reconciliation health, invalid scope/severity and incomplete content.
- Containment impact validation requires nonnegative integer counts, finite nonnegative USD notional, the approved synthetic source, bounded warnings, action-specific reconciliation state and immutable non-executable boundaries.
- Containment responses are bound back to the exact command, account, action, policy, normalized reason and correlation identifiers that produced the request.
- Preview and impact timestamps must be fresh, ordered and internally coherent; nested and aggregate SHA-256 evidence are both mandatory.
- Limit, pause and breach collections are capped at 1,000 rows, pause effective times cannot postdate the overview and warning lists are capped at 20 entries.
- Client-side reason validation rejects excessive or prohibited token/secret content before session, CSRF or preview network calls.
- Backend containment actions must be defined enum values, and idempotent replay rejects changed reason or correlation intent.
- Executable readiness verification hashes the console/API evidence, checks predecessor manifests and preserves explicit false acceptance, mutation, execution and trading-authority flags.

## Verification

- 141 trading-portal tests pass, including twenty focused risk-console cases.
- The retained backend baseline is thirteen focused risk-control and five focused API authorization/isolation/read cases. Two backend regressions are authored, but fresh execution is blocked by an unrelated existing `PaperOmsServiceTests` compile error after the risk application projects compile successfully.
- Angular production build passes at 488.67 kB initial raw / 115.89 kB estimated transfer.
- Angular application type-check passes.
- Angular import-boundary verification passes.
- Browser verification confirms safety hierarchy, Liquidate preview, disabled final confirmation, visible capacity/pauses/breaches and no console warnings/errors.

## Remaining acceptance work

- Replace the synthetic backend read model with authorized risk, reconciliation and broker snapshots; add SignalR recovery updates.
- Implement durable policy, pause, breach and executable kill-switch orchestration APIs; the current containment endpoint is preview-only.
- Replace synthetic impact estimates with authorized snapshots; add authorized multi-step confirmation, progress, partial failure, resume and reconciliation timelines.
- Add SignalR gap/reconnect recovery and auditable export controls; session revocation/context drift is now handled before previews.
- Replace the synthetic test account claim with provider-normalized account membership.
- Complete keyboard, screen-reader, zoom, forced-colors, browser, performance and representative risk-admin testing.
- Run independent privilege, repeated/partial/resumed kill-switch and paper game-day tests.
- Obtain accountable risk, security, compliance, operations, product and accessibility approvals and close predecessor gates.
- Repair the unrelated architecture-test compile failure and execute the two new risk-control regressions plus the complete backend suites.

## Safety boundary

All policy, capacity, pause, breach and impact values remain synthetic fixtures. The API exposes fail-closed state and non-executable containment previews only. Final confirmations are disabled; there is no database, credential, real account, external broker connection or order/position mutation, and the API cannot create trading authority.
