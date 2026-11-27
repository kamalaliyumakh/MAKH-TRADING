# MAKH Trading Platform — Information Architecture

Last updated: 12 August 2026

## Public application

```text
Home
├── Platform
│   ├── Discovery and scanner
│   ├── Evidence and catalysts
│   ├── Risk-controlled execution
│   └── Monitoring, journal and reporting
├── Security
├── Status
├── About
├── Legal / Risk
├── Privacy
├── Request access
└── Sign in
```

Header navigation remains concise; legal/risk and privacy remain reachable from every page. Primary public calls to action are Request Access and Sign In. Copy cannot imply guaranteed performance, automated certainty or custody/advisory services.

## Authenticated portal

```text
Portal shell: account + mode + market/feed/broker/reconciliation/risk status
├── Dashboard
├── Scanner
├── Watchlists
├── Symbol workspace
│   ├── Market data
│   ├── Metrics and risk flags
│   ├── Evidence
│   ├── Thesis
│   └── Order proposal
├── Orders
├── Positions
├── Risk
├── Journal
├── Reports / Exports
├── Alerts
├── Administration (authorized roles only)
└── Profile / Sessions / Consents
```

## Navigation rules

- The active account and mode are persistent, textual and repeated at consequential confirmation.
- Status is layered: a global health strip for platform-wide conditions and local status adjacent to affected data/action.
- Role-restricted destinations are absent from ordinary navigation but server authorization remains mandatory.
- Deep links preserve safe read context; sensitive mutations never execute from a link.
- Returning from MFA preserves the prepared command for review but requires fresh server validation and an explicit final action.
- Mobile navigation prioritizes Dashboard, Alerts, Positions, Orders and Risk containment; scanner details and administration use progressive drill-down.

## Page-state model

Every data-bearing page defines Loading, Ready, Empty, Stale, Degraded, Unauthorized, Error and Recovering states. Trading pages additionally define Paper/Live, Entry Blocked, Reconciliation Mismatch and Unknown Broker State. Empty/error states explain the cause and safe next action; they do not substitute fabricated or cached values.

## Content hierarchy for consequential confirmation

1. Action and account mode.
2. Symbol/account and quantity/value.
3. Limit/stop/protection and estimated risk.
4. Risk-decision outcome and policy version.
5. Data/broker/reconciliation freshness.
6. Consequence statement and final verb-specific button.

Buttons use specific verbs such as “Submit paper limit order”, “Request cancellation”, “Block new entries” or “Liquidate positions”; avoid generic “Confirm” where the consequence matters.
