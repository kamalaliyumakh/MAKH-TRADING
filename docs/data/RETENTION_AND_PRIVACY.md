# MAKH Trading Platform — Retention, Archival and Privacy

Last updated: 12 August 2026  
Status: Provisional baseline pending jurisdiction, counsel and vendor contracts

## 1. Rules

- Retain only data needed for product safety, reconciliation, audit, contractual rights and applicable law.
- Legal/security hold overrides scheduled deletion and records scope, reason, approver and expiry/review date.
- Vendor licence and redistribution rights may require a shorter market/evidence period than the baseline.
- Order, execution, policy, risk-decision and audit facts are not hard-deleted through ordinary product APIs.
- Production data is not copied to lower environments; approved masked/synthetic fixtures are used.
- Backups inherit the highest classification present and expire through provider-controlled lifecycle.
- Final periods require legal/privacy approval before live production.

## 2. Classification

| Class | Examples | Handling |
|---|---|---|
| Restricted | broker tokens, session secrets, encryption keys | managed secret/key services; never analytics/logs; minimal access |
| Confidential | identity, account references, positions, orders, P&L, exports | encryption, account authorization, redaction and access audit |
| Sensitive evidence | risk decisions, audit events, reconciliation, policy versions | append-only/tamper-evident, restricted export, long-term evidence |
| Licensed market content | quotes, bars, news and social payloads | contract-specific storage/use/redistribution and deletion |
| Internal | scanner configuration, operational metrics without account detail | workforce least privilege and standard retention |
| Public | public landing content and approved disclosures | integrity/release control; public distribution allowed |

## 3. Provisional retention schedule

| Data set | Online period | Archive/total baseline | Disposition | Approval dependency |
|---|---:|---:|---|---|
| Server sessions and revocation state | active + 30 days | 90 days | purge identifiers and token material | security/incident needs |
| Authentication/security logs | 90 days searchable | 1 year | delete unless hold | hosting/privacy policy |
| Consents and disclosures | active + 1 year | 7 years after superseded/account closure | protected delete after hold check | legal confirmation |
| Broker connection metadata | active | 1 year after disconnect | delete/anonymize; secret revoked immediately | broker/privacy rules |
| Provider tokens/secrets | only while required | none in ordinary archive | revoke and cryptographically destroy | provider behavior |
| Order proposals, orders and executions | 2 years | 7 years from final activity | protected deletion after legal review | legal/tax/broker rules |
| Positions and reconciliations | 2 years | 7 years | protected deletion after review | legal/tax/broker rules |
| Risk policies, decisions and breaches | 2 years | 7 years | protected deletion after review | legal/safety evidence |
| Audit and privileged-access events | 2 years | 7 years | checksummed archive then approved deletion | legal/security review |
| Journal and trade evidence | account life | 7 years after trade/account closure | user/legal reviewed deletion | product/legal policy |
| Raw quotes/trades | 7–30 days | contract-defined or none | partition drop/expiry | market-data licence |
| Aggregated bars/metrics | 2 years | contract-defined up to 7 years | partition/archive expiry | licence/research need |
| News/filing metadata and snapshots | 2 years | up to 7 years if permitted and trade-linked | preserve citation/hash; delete content if rights expire | content licence |
| Social metadata/content | 30–90 days | trade-linked minimal evidence only | delete content; retain permitted hash/provenance | platform terms/privacy |
| Scanner runs/candidates | 1 year | 3 years aggregate; 7 years if trade-linked | aggregate/anonymize/delete | research/legal need |
| Notification delivery attempts | 90 days | 1 year | delete payload, retain minimal outcome | provider/privacy rules |
| Report/export files | 7 days download | manifest 7 years when evidentiary | object auto-expiry; manifest retained | report classification |
| Operational metrics/traces | 30–90 days | 1 year aggregate | delete raw; retain non-sensitive aggregate | cost/security needs |
| Encrypted backups/PITR | provider baseline 35 days | monthly recovery copy up to 1 year until live policy approved | lifecycle deletion and key policy | RPO/RTO/legal review |

The seven-year figures are conservative planning assumptions, not legal conclusions. They must be replaced or approved before live operation.

## 4. Archival and deletion workflow

1. Scheduled job selects eligible partitions/records using the approved policy version.
2. It checks legal/security holds, open investigations, unsettled/reconciling orders and evidentiary links.
3. It emits a dry-run count and checksum manifest for authorized review on sensitive classes.
4. Archive writes encrypted objects with checksum, classification, key version and retention-until metadata.
5. Verification reads/checks the archive before online deletion or partition detachment.
6. Deletion uses a dedicated restricted role, bounded batches and an immutable audit event.
7. Backups age out naturally; deletion requests record that erased data may remain inaccessible until backup expiry.

## 5. Privacy rights

Access/export and erasure requests authenticate the requester and scope every query. Erasure removes or anonymizes eligible profile/journal data while preserving legally required trading/audit facts with access restriction. Generated exports are encrypted at rest, short-lived, scoped, manifested, rate-limited and audited.
