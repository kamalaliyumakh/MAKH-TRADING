# Architecture Consistency Matrix

Date: 12 August 2026  
Status: Design consistency verified; implementation tests pending

| ID | Cross-cutting rule | Architecture | Security | Data/API | UX | Result |
|---|---|---|---|---|---|---|
| ACM-01 | Server is authoritative for consequential actions. | API/Application | authorization boundary | REST commands | consequence preview only | Aligned |
| ACM-02 | Central risk approval precedes broker submission. | order flow | fail closed | immutable risk decision | rejection/decision states | Aligned |
| ACM-03 | Scanner/evidence cannot authorize an order. | module boundary | abuse controls | separate resources | repeated copy/state | Aligned |
| ACM-04 | Paper and live are separated. | environments | credential boundary | account/mode scope | non-color mode banners | Aligned |
| ACM-05 | Browser does not store provider tokens. | BFF topology | session controls | secure cookie/API | session expiry flows | Aligned |
| ACM-06 | Commands are REST-only and idempotent. | API boundary | replay/CSRF controls | idempotency contract | disable/retry status | Aligned |
| ACM-07 | SignalR carries recoverable deltas only. | realtime model | authorized groups | sequences/snapshots | reconnect/gap recovery | Aligned |
| ACM-08 | PostgreSQL is platform truth; broker is execution truth. | ownership table | integrity boundary | schemas/reconciliation | mismatch/locked states | Aligned |
| ACM-09 | External payloads are untrusted and normalized. | adapter boundary | validation/redaction | provenance fields | source labels | Aligned |
| ACM-10 | Unknown broker outcome is queried before retry. | failure flow | duplicate prevention | stable client-order ID | Pending/Unknown state | Aligned |
| ACM-11 | Reconciliation mismatch blocks new entries. | failure behavior | containment | account-entry lock | risk console workflow | Aligned |
| ACM-12 | Cache is non-authoritative. | container rule | no policy truth | PostgreSQL source | snapshot recovery | Aligned |
| ACM-13 | Audit/risk facts are append-only or corrective. | evidence archive | tamper controls | invariants/retention | journal/audit view | Aligned |
| ACM-14 | Production data stays out of lower environments. | environment plan | privacy boundary | sanitization policy | no production fixture assumption | Aligned |
| ACM-15 | Accessibility and safety states are non-color-only. | frontend rules | usable security | problem/event states | token/component rules | Aligned |
| ACM-16 | Provider outages cannot silently permit entries. | fail closed | availability abuse | health/error contracts | degraded/blocked states | Aligned |
| ACM-17 | Restored environments start entry-locked. | recovery posture | privileged clearance | restore/reconcile rules | locked account status | Aligned |
| ACM-18 | Live activation remains a separately signed gate. | environment boundary | credential segregation | account/mode policy | Live design only | Aligned |

“Aligned” means the design documents do not conflict. It is not executable proof. WBS 3.* and later tests must convert these rules into build, architecture, contract, security, accessibility, recovery and paper-trial evidence.
