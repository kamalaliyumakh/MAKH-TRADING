import { Component } from '@angular/core';

@Component({
  selector: 'makh-sign-in-page',
  template: `
    <article class="document-page narrow auth-handoff">
      <p class="eyebrow">Local UAT authentication</p>
      <h1>Continue to the MAKH portal</h1>
      <p>
        The current local workflow supports browser-session registration and login for acceptance
        testing. It does not create a production identity or brokerage account.
      </p>
      <div class="actions">
        <a class="primary-link" href="http://127.0.0.1:4200/login">Sign in to portal</a>
        <a href="http://127.0.0.1:4200/register">Create UAT account</a>
      </div>
      <p class="disclosure">
        <strong>Security boundary:</strong> approved production OIDC/BFF identity, email
        verification, recovery and MFA remain disabled until provider and environment approval.
      </p>
    </article>
  `,
  styles: [
    `
      .auth-handoff {
        max-width: 48rem;
      }
      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.8rem;
        margin: 1.5rem 0;
      }
      .actions a {
        padding: 0.75rem 1rem;
        border: 1px solid var(--border);
        border-radius: 0.35rem;
      }
      .disclosure {
        padding: 1rem;
        border-left: 0.2rem solid var(--accent);
        background: rgb(255 94 0 / 8%);
      }
    `,
  ],
})
export class SignInPage {}
