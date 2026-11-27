import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'makh-security-page',
  imports: [RouterLink],
  template: `
    <article class="public-page">
      <header class="page-hero">
        <p class="page-eyebrow">Security</p>
        <h1>Security controls follow the consequence of the action.</h1>
        <p class="page-lede">
          A signed-in screen is not enough. Sensitive actions require server-side permission,
          current risk approval and stronger authentication where appropriate.
        </p>
      </header>
      <section aria-labelledby="controls-title">
        <h2 id="controls-title">Layered controls</h2>
        <div class="card-grid two-up">
          <article>
            <h3>Identity and MFA</h3>
            <p>
              An approved identity provider authenticates users. Sensitive actions require suitable
              permission and fresh multi-factor authentication.
            </p>
          </article>
          <article>
            <h3>Server authorization</h3>
            <p>
              The backend enforces account mode and policy; hiding a browser control never grants or
              removes authority.
            </p>
          </article>
          <article>
            <h3>Risk and order boundary</h3>
            <p>
              Central risk approval precedes an eligible submission. Stable idempotency prevents a
              retry from becoming an automatic duplicate.
            </p>
          </article>
          <article>
            <h3>Secrets and encryption</h3>
            <p>
              Provider secrets belong in managed controls. MAKH does not request raw broker
              passwords when approved delegated authorization exists.
            </p>
          </article>
          <article>
            <h3>Audit evidence</h3>
            <p>
              Material identity, policy, risk, order and administrative actions produce traceable
              records.
            </p>
          </article>
          <article>
            <h3>Resilience and reconciliation</h3>
            <p>
              A broker timeout is unknown until reconciled—not permission to send another order.
            </p>
          </article>
        </div>
      </section>
      <section class="boundary-panel" aria-labelledby="responsibility-title">
        <h2 id="responsibility-title">Shared responsibility</h2>
        <p>
          No system can eliminate market, device, provider or operational risk. Users must protect
          devices and sessions and review broker-account activity. Provider controls remain subject
          to their terms and availability.
        </p>
      </section>
      <section aria-labelledby="report-title">
        <h2 id="report-title">Report a security concern</h2>
        <p>
          Verified reporting details will be published before public launch. Do not send passwords,
          tokens, account numbers or broker credentials through an unapproved channel.
        </p>
        <p>
          <a routerLink="/status">Check service status</a> ·
          <a routerLink="/privacy">Read the privacy notice</a>
        </p>
      </section>
    </article>
  `,
})
export class SecurityPage {}
