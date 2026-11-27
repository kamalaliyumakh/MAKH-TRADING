import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LocalUatAuthService } from './local-uat-auth.service';

@Component({
  selector: 'makh-forgot-password-page',
  imports: [FormsModule, RouterLink],
  template: `
    <article class="auth-card">
      <div class="brand-lockup">
        <img src="/makh-trading-logo.png" alt="" /><span
          ><strong>MAKH</strong><small>TRADING</small></span
        >
      </div>
      <h1>Reset your password</h1>
      <p class="lede">Enter your verified UAT email to continue.</p>
      <p class="boundary">
        <strong>Local UAT only:</strong> the next screen displays the reset code. Production must
        deliver recovery through the approved identity provider.
      </p>
      @if (status()) {
        <p role="status">{{ status() }}</p>
      }
      <form (ngSubmit)="submit()">
        <label
          >Email <input name="email" [(ngModel)]="email" type="email" autocomplete="email" required
        /></label>
        <button type="submit">Continue</button>
      </form>
      <p class="secondary"><a routerLink="/login">Back to sign in</a></p>
    </article>
  `,
  styleUrl: './auth-page.scss',
})
export class ForgotPasswordPage {
  private readonly auth = inject(LocalUatAuthService);
  private readonly router = inject(Router);
  protected email = '';
  protected readonly status = signal('');

  protected async submit(): Promise<void> {
    const normalized = this.email.trim().toLowerCase();
    const code = this.auth.startPasswordReset(normalized);
    if (!code) {
      this.status.set(
        'If a verified UAT account exists, recovery can continue. Check the address and registration state.',
      );
      return;
    }
    await this.router.navigate(['/reset-password'], { queryParams: { email: normalized } });
  }
}
