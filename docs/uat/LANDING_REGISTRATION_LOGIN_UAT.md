# MAKH Trading — Landing, Registration and Login UAT

Test date: 20–24 August 2026  
Environment: Local Angular applications (`web-public` on port 4300 and `trading-portal` on port 4200)  
Scope: Landing page → registration/access request → sign in → authenticated portal entry

## Executive result

**Initial result: FAIL. Local remediation retest: PASS. Production identity: NOT ACCEPTED.**

The public landing page and local access-request workflow passed their available acceptance checks. The complete requested journey failed because the current access form does not create an identity, the sign-in route is a placeholder, and the portal admits an anonymous browser directly.

## Test results

| ID          | Scenario                             | Expected                                                                                  | Actual                                                                                               | Result          |
| ----------- | ------------------------------------ | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------- |
| UAT-AUTH-01 | Open the landing page                | Branded page loads with navigation, risk disclosure and registration/sign-in entry points | Page loaded with correct MAKH navigation, disclosure and both entry points                           | Pass            |
| UAT-AUTH-02 | Submit an empty registration form    | Submission blocked and actionable validation shown                                        | Five field/privacy errors were exposed in an active alert and beside the fields                      | Pass            |
| UAT-AUTH-03 | Submit valid registration details    | Account is created and user proceeds to verification/login                                | Local access request was accepted and reference `MAKH-1FXOAC4` displayed, but no account was created | Fail            |
| UAT-AUTH-04 | Open sign-in page                    | Email/password or approved OIDC sign-in is available                                      | Route contains only a foundation-placeholder message and return-home link                            | Fail            |
| UAT-AUTH-05 | Enter invalid credentials            | Authentication is rejected without revealing sensitive detail                             | Cannot execute because no sign-in form/provider is connected                                         | Blocked         |
| UAT-AUTH-06 | Sign in with a valid registered user | Session is established and browser redirects to the portal                                | Cannot execute because registration creates no identity and sign-in is unavailable                   | Blocked         |
| UAT-AUTH-07 | Open portal without authentication   | User is redirected to sign in or receives access denied                                   | `http://127.0.0.1:4200/` redirected to `/app` and displayed the dashboard anonymously                | Fail — Critical |
| UAT-AUTH-08 | Verify portal safety state           | No live authority is implied while dependencies are disconnected                          | Portal displayed paper/foundation mode, entry lock and unavailable risk/broker/reconciliation state  | Pass            |

## Defects and required remediation

### UAT-CRIT-001 — Anonymous portal access

- Severity: Critical
- The portal shell and routes are not protected by an authenticated route guard/BFF session check.
- Required: enforce server-authoritative authentication for all portal routes, preserve the intended return URL safely, and verify direct/deep-link access is rejected before protected content renders.

### UAT-HIGH-002 — Sign-in is not implemented

- Severity: High
- `/sign-in` is a placeholder rather than an executable login flow.
- Required: connect the approved provider-neutral OIDC authorization-code + PKCE/BFF flow, provide failure/retry/logout handling, and validate session expiry and fresh-MFA rules.

### UAT-HIGH-003 — Registration does not create an account

- Severity: High
- The current form is correctly labelled as an access request and stores nothing outside the browser session. It cannot satisfy account registration.
- Required: decide whether the MVP uses invitation-only identity provisioning or self-registration. Implement approved identity creation, email verification, consent/version evidence, duplicate handling and privacy-controlled persistence accordingly.

### UAT-MED-004 — Cross-application journey is disconnected

- Severity: Medium
- Public and portal applications do not share an executable authentication hand-off.
- Required: configure approved origins/callbacks, session bootstrap, post-login redirect and logout return behavior across both applications.

## Exit criteria for retest

Retest only after the approved identity provider and environment configuration exist, account creation/invitation is implemented, public sign-in is executable, portal routes reject anonymous access, and test identities are available. The retest must cover registration, email verification, invalid and valid login, logout, expired session, protected deep links, password reset or provider recovery, MFA, and cross-account authorization.

No production, paper-trading or live-trading release is authorized by this UAT.

## Remediation retest — 20 August 2026

A browser-session-only UAT identity flow was added to exercise the requested journey without weakening the disabled production OIDC/BFF boundary.

| ID        | Retest                                                                                           | Result |
| --------- | ------------------------------------------------------------------------------------------------ | ------ |
| UAT-RT-01 | Anonymous `/app` access redirects to `/login?returnUrl=%2Fapp` before portal content renders     | Pass   |
| UAT-RT-02 | UAT registration accepts name, email, matching password and confirmation                         | Pass   |
| UAT-RT-03 | Successful registration redirects to login with an account-created status                        | Pass   |
| UAT-RT-04 | Invalid password produces a non-specific authentication failure                                  | Pass   |
| UAT-RT-05 | Valid credentials establish the tab-scoped session and redirect to `/app`                        | Pass   |
| UAT-RT-06 | Sign out clears the session and returns to `/login`                                              | Pass   |
| UAT-RT-07 | Protected deep link `/app/scanner` redirects to login after logout and preserves the return path | Pass   |

### Defect disposition

- `UAT-CRIT-001`: Closed for the local Angular UAT environment; production closure still requires server-authoritative BFF enforcement.
- `UAT-HIGH-002`: Closed for local UAT; production OIDC provider connection, MFA, recovery and expiry remain open.
- `UAT-HIGH-003`: Closed for local UAT through tab-scoped registration; approved persistent identity provisioning remains open.
- `UAT-MED-004`: Partially resolved. The public sign-in route now provides explicit login and registration hand-off links to the local portal. Production origins and callback configuration remain open.

### Verification evidence

- Portal and public production builds completed without warnings.
- 62 portal and 14 public Angular tests passed.
- Angular import-boundary verification passed.
- Browser retest passed anonymous rejection, registration, invalid login, valid login, logout and protected deep-link rejection.

The UAT account and password digest exist only in `sessionStorage`; they disappear when the browser tab/session closes. This mechanism must never be enabled or promoted as production authentication.

## Session-hardening verification — 21 August 2026

- Added a 30-minute absolute expiry to the local UAT session.
- Invalid, malformed and expired session state now fails closed and is removed.
- Centralized logout through the authentication service.
- Added automated route-guard coverage for anonymous deep-link rejection, safe return-path preservation and authenticated access.
- Added automated expiry/malformed-state coverage.
- Verified a fresh anonymous request to `/app/reports` redirects to `/login?returnUrl=%2Fapp%2Freports`.
- Verification result: 68 portal tests pass, the portal production build is warning-free, and Angular import boundaries pass.

## Email-verification UAT — 24 August 2026

- Registration now creates an unverified browser-session account and redirects to `/verify-email`.
- Login remains unavailable to the new account until its verification code is accepted.
- A random six-digit local UAT code is generated for each registration; the UAT screen displays it because no email provider is connected.
- Browser testing confirmed an incorrect code is rejected with a non-sensitive error.
- Browser testing confirmed the current code verifies the account and redirects to login with an `Email verified` status.
- The verified credentials then establish the 30-minute local session and open `/app`.
- The password is represented in session storage only as a SHA-256 digest; the UAT implementation remains unsuitable for production identity or password storage.
- Verification result: 68 portal tests pass, the warning-free production build passes, Angular import boundaries pass, and the complete registration → verification → login browser journey passes.

Production exit criteria remain unchanged: use the approved identity provider for account lifecycle and time-limited email delivery, store no application-managed passwords unless separately approved, enforce rate limits and attempt expiry server-side, and retain versioned verification/audit evidence under the privacy schedule.

## Password-recovery UAT — 24 August 2026

- Added `Forgot password` and `Create a new password` screens using the supplied MAKH dark visual system.
- Recovery is available only to the verified browser-session UAT account and invalidates any active local session when initiated.
- A per-request six-digit UAT reset code is generated once and displayed locally because no recovery provider is connected.
- Browser testing confirmed an incorrect reset code is rejected.
- Browser testing confirmed the current code replaces the password digest and returns the user to login with a reset status.
- Browser testing confirmed the old password is rejected and the new password opens `/app`.
- Automated coverage confirms reset-code validation, active-session invalidation, old-password rejection and new-password acceptance.
- Verification result: 69 portal tests pass, the production build is warning-free and Angular import boundaries pass.

Production recovery remains blocked pending approved provider delivery, short server-side token expiry, single-use enforcement, attempt throttling, abuse monitoring, account-enumeration resistance, MFA/recovery policy and immutable audit evidence.

## Two-factor authentication UAT — 24 August 2026

- Password validation now creates a five-minute local UAT MFA challenge instead of creating an authenticated session.
- Added a branded two-factor screen with six-digit one-time-code input and explicit local-only disclosure.
- Browser testing confirmed password-only access to `/app/scanner` remains blocked and redirects to login.
- The intended `/app/scanner` return path survives password authentication and MFA.
- Browser testing confirmed an incorrect MFA code is rejected without opening protected content.
- Browser testing confirmed the current code is consumed, establishes the 30-minute UAT session and opens the protected scanner.
- Logout, password recovery and challenge expiry remove pending MFA state and fail closed.
- Automated coverage verifies that matching credentials alone do not authenticate, incorrect MFA fails and the current MFA challenge completes authentication.
- Verification result: 69 portal tests pass, the warning-free production build passes, Angular import boundaries pass and the full browser MFA journey passes.

Production MFA remains blocked pending the approved OIDC provider, authenticator enrollment and recovery, server-held challenge state, replay/attempt controls, trusted-device policy, fresh-MFA enforcement, telemetry, privacy treatment and independent security testing.
