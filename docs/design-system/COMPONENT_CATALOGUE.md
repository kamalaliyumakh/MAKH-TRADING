# MAKH Trading Platform — Component Catalogue

Last updated: 12 August 2026

All components live in or compose primitives from Angular `libs/ui`. Feature-specific business logic remains in feature libraries.

## Foundations and navigation

| Component | Purpose | Required variants/states |
|---|---|---|
| `MakhButton` | General action | primary, secondary, quiet, destructive; loading/disabled; icon/text |
| `MakhIconButton` | Compact named action | tooltip plus accessible name; target-size handling |
| `MakhLink` | Navigation/download | default, external, download; visited where appropriate |
| `MakhAppShell` | Public/portal structural shell | header, side navigation, main, status region |
| `MakhBreadcrumbs` | Hierarchy and return context | collapsed mobile, current-page semantics |
| `MakhTabs` | Related views | keyboard roving focus; lazy panels without focus loss |
| `MakhSkipLink` | Direct keyboard navigation | visible on focus |

## Forms and feedback

| Component | Purpose | Required behavior |
|---|---|---|
| `MakhField`, `MakhInput`, `MakhSelect`, `MakhTextarea` | Labeled data entry | hint/error association, required/optional text, autocomplete |
| `MakhCheckbox`, `MakhRadioGroup`, `MakhSwitch` | Choices/preferences | fieldset/legend where grouped; switch only for immediate binary state |
| `MakhDateTime`, `MakhMoney`, `MakhQuantity` | Domain-safe input/display | units, decimal-safe strings, locale display and canonical value |
| `MakhErrorSummary` | Form-level errors | receives focus and links to invalid fields |
| `MakhInlineMessage` | Local info/warning/error | icon + text + semantic role; never color-only |
| `MakhToast` | Noncritical transient feedback | no critical-only information; pause/dismiss; restrained live region |
| `MakhDialog` | Modal review/confirmation | named, described, focus-contained/restored |
| `MakhConfirmAction` | Consequential review | verb-specific action, mode/scope/consequence, optional typed confirmation |

## Data and real-time state

| Component | Purpose | Required behavior |
|---|---|---|
| `MakhDataTable` | Scanner/orders/audit lists | semantic headers, keyboard sort/filter, stable row identity/focus |
| `MakhResponsiveRecordList` | Small-screen table alternative | retains labels/relationships; no omitted critical state |
| `MakhMetric` | Value/unit/context | sign, unit, source/as-of and accessible label |
| `MakhSparkline` / `MakhChartFrame` | Compact trend/chart | text summary and accessible data/table; reduced motion |
| `MakhFreshness` | Source age and quality | current/stale/suspect/unavailable with text and timestamp |
| `MakhStatusBadge` | Compact categorical state | icon/pattern/text; no color-only meaning |
| `MakhConnectionHealth` | API/feed/broker/reconciliation | separate dependencies, details and recovery action |
| `MakhLiveRegionQueue` | Managed announcements | dedupe/batch/prioritize; never announce every quote tick |
| `MakhSkeleton` | Loading placeholder | non-animated with reduced motion; labelled busy region |
| `MakhEmptyState` | No content | cause, scope and safe next action |

## Trading and risk patterns

| Component | Purpose | Safety requirements |
|---|---|---|
| `MakhModeBanner` | Persistent Paper/Live identity | text + icon + border/pattern; account name; never dismissible |
| `MakhRiskCapacity` | Limit consumption/remaining capacity | value, units, policy/as-of; no misleading gauge alone |
| `MakhRiskRuleResult` | Pass/warn/hard block detail | measured value, limit, reason and policy version |
| `MakhEvidenceCard` | Catalyst/source item | source type, trust state, published/observed time and link |
| `MakhOrderSummary` | Pre-submit consequence review | mode, account, symbol, side, type, quantity, price, stop and estimated risk |
| `MakhOrderState` | Canonical lifecycle | filled/remaining quantity, broker time, uncertainty/reconciliation action |
| `MakhProtectionState` | Exit-plan/broker protection | desired vs confirmed state and connectivity risk |
| `MakhKillSwitchPanel` | Block/cancel/liquidate workflows | separated controls, scope/impact, MFA state, confirmation and progress |
| `MakhAuditTimeline` | Reconstruct event chain | actor-safe identity, UTC/source time, reason, versions and correlation |

## Public content

`MakhHero`, `MakhFeatureFlow`, `MakhTrustBoundary`, `MakhRiskDisclosure`, `MakhFaq`, `MakhStatusSummary`, `MakhConsentNotice` and `MakhAccessRequestForm` compose accessible content without performance promises or dark patterns.

## State contract

Every interactive component supports relevant Default, Hover, Focus, Active, Disabled, Read-only, Loading, Success, Warning and Error states. Data components additionally support Empty, Stale, Degraded, Unauthorized and Recovering. Trading components additionally support Paper/Live, Entry Blocked, Reconciliation Mismatch and Unknown Broker State.

Disabled controls include a nearby explanation when safety policy prevents action. They are not the sole communication of a risk block.
