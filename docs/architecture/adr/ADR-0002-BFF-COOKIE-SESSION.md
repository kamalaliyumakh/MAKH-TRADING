# ADR-0002 — Use a BFF with Server-Side Tokens and Secure Cookie Sessions

Date: 12 August 2026  
Status: Accepted

## Context

The Angular portal performs sensitive account, risk and trading operations. Browser-token designs expose reusable tokens to JavaScript/runtime attacks and distribute refresh/revocation concerns into the client. The platform needs consistent CSRF, expiry, MFA freshness, logout and SignalR authorization behavior. Provider selection remains open, but session topology can be decided independently.

## Decision

- ASP.NET Core acts as backend for frontend and performs OIDC authorization code flow with PKCE.
- Provider access/refresh tokens remain in a protected server-side store.
- Angular receives only a host-scoped opaque `Secure`, `HttpOnly`, appropriately `SameSite` cookie.
- Mutations require anti-forgery validation and trusted-origin checks.
- Sessions enforce idle/absolute expiry, rotation, logout and revocation.
- Provider claims normalize into platform subject, roles, account/mode entitlements, authentication time and MFA context.
- REST and SignalR apply server policy/resource authorization; route guards are not controls.
- Sensitive responses use no-store caching; portal telemetry excludes order/account content and credentials.

## Consequences

Tokens stay out of Angular/browser storage, and authorization/revocation has one enforcement point. The backend must operate a protected highly available session store, cookie authentication requires CSRF defenses, cross-origin hosting needs new review, and horizontal scale needs shared protected state.

## Rejected alternatives

- Browser local/session-storage tokens: XSS/extensions can exfiltrate them and lifecycle logic becomes client-exposed.
- Pure stateless JWT session cookie: insufficient default for rapid revocation, privilege changes, session inventory and provider-token lifecycle.

## Constraints

Identity-provider selection remains `DEC-001A` and must support code+PKCE, MFA/step-up signals, logout/revocation and required jurisdiction. Managed keys protect cookies/tokens. Logs exclude credentials and tokens. Tests cover fixation, rotation, expiry, logout, revocation, CSRF, MFA freshness and SignalR authorization. Live remains gated on provider-specific verification.
