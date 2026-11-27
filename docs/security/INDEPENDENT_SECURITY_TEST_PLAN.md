# Independent Security Test Plan

Date prepared: 13 August 2026  
WBS: 9.1  
Status: Preparation only — no independent assessment executed

## Objective and decision boundary

Independently assess whether the identified release and isolated non-live environment enforce the threat-model security and trading-safety properties. Testing does not authorize production access, live credentials, live broker connectivity, destructive activity outside scope, or controlled-live operation. Written authorization, named system owners and emergency contacts are mandatory before execution.

## Preconditions

1. Signed WBS 7.9 paper certification and WBS 8.7 operational readiness, or an explicitly authorized test-only exception that grants no operating authority.
2. Named independent assessor with conflicts disclosed and qualifications accepted by Security/Sponsor.
3. Exact environment, hosts, APIs, hubs, accounts, roles, modes, source IPs, time window and artifact digest recorded.
4. Synthetic test data and dedicated paper-only accounts; no live credentials, accounts, funds or customer data.
5. Backups, entry lock, monitoring, incident contacts, stop conditions and restoration ownership confirmed.
6. Legal/provider permission for the authorized techniques and systems.

## In-scope test domains

| Domain | Required coverage |
|---|---|
| Identity/session | OIDC/BFF flow, cookie flags, fixation, rotation, logout/revocation, MFA freshness, session inventory |
| Authorization | Role/account/mode/resource substitution across REST, SignalR, exports and administration; default-deny inventory |
| Browser/API | CSRF/origin, CSP/XSS/encoding, unsafe methods, mass assignment, injection, malformed/oversize input, rate limits |
| Trading safety | Proposal/risk binding, expiry/replay, idempotency/races, timeout handling, order/event sequencing, reconciliation lockout |
| Privileged operations | Risk policy, containment, admin elevation, break-glass, reasons, expiry, alerts and immutable audit |
| Data/content | Provider input validation, freshness, provenance, social non-authority, account/privacy isolation, export minimization |
| Secrets/supply chain | Credential exposure/rotation, workload identity, CI/SAST/SCA/secrets, SBOM, signatures and deployment provenance |
| Resilience/evidence | Dependency failure, telemetry gaps, audit/archive tamper detection, clock boundaries, recovery and reconstruction |

The assessor must execute or disposition every ST-001–ST-024 test in `SECURITY_TEST_MATRIX.md` and trace each result to TM-01–TM-20 and SEC-001–SEC-020.

## Rules of engagement

- Allowed only within the signed scope/window from approved source addresses and identities.
- Stop immediately for suspected live routing, real personal/account data, uncontrolled destructive impact, broker/provider spillover, unavailable containment, or scope ambiguity.
- Denial-of-service, phishing/social engineering, persistence, destructive database operations, third-party infrastructure testing and credential extraction require separate explicit authorization; otherwise prohibited.
- Use minimum-impact proofs. Do not retain secrets or full sensitive payloads; notify the incident contact through the approved channel.
- Critical trading/authorization bypasses trigger immediate containment, evidence preservation and testing pause.

## Evidence per test

- Test ID, threat/control IDs, assessor, UTC start/end, release digest and environment.
- Actor, role, account and mode using safe identifiers; preconditions and exact technique.
- Expected and actual result, request/response or trace references, correlation/audit IDs and redacted artifacts.
- Finding ID/severity, affected scope, reproducibility, business/trading impact and containment.
- Remediation owner, target, code/config/artifact reference, independent retest result and closure approval.

## Severity and release treatment

| Severity | Example | Required treatment |
|---|---|---|
| Critical | live/paper boundary bypass, unauthorized order/control, cross-account control, credential compromise | immediate stop/containment; release blocked; independent retest and Security/Sponsor closure |
| High | material privilege, data exposure, audit/reconciliation bypass or durable exploit chain | release blocked; remediate and independently retest |
| Medium | bounded weakness without critical control bypass | named owner and remediation before exposure or approved expiring acceptance |
| Low | defense-in-depth or low-impact issue | tracked disposition and verification |

No critical/high finding may be waived for controlled-live release. Risk acceptance never permits bypass of authorization, centralized risk, idempotency, reconciliation, segregation or audit.

## Exit criteria

- All in-scope ST tests have immutable results and no unexplained gaps.
- All critical/high findings are closed and independently retested; medium/low items have authorized dispositions.
- Endpoint/authorization inventory, secret/supply-chain evidence and reconstruction agree with the tested artifact.
- Security Lead accepts the independent report; other required gate owners sign their separate approvals.

## Current result

Not executed. There is no assessor, signed authorization, target environment, test window, result, finding, remediation or independent approval. Security gate and controlled-live activity remain unavailable.
