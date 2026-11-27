import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocalUatAuthService } from './local-uat-auth.service';

@Component({
  selector: 'makh-two-factor-page',
  imports: [FormsModule, RouterLink],
  template: `
    <article class="auth-card">
      <div class="brand-lockup">
        <img src="/makh-trading-logo.png" alt="" /><span
          ><strong>MAKH</strong><small>TRADING</small></span
        >
      </div>
      <h1>Two-factor authentication</h1>
      <p class="lede">Enter the six-digit challenge for {{ email }}.</p>
      <p class="boundary">
        <strong>Local UAT MFA code:</strong> {{ testCode() || 'No active challenge' }}. This
        five-minute code is displayed only because no authenticator provider is connected.
      </p>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <form (ngSubmit)="submit()">
        <label
          >Authentication code
          <input
            name="code"
            [(ngModel)]="code"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            required
        /></label>
        <button type="submit">Verify and continue</button>
      </form>
      <p class="secondary"><a routerLink="/login">Cancel and return to sign in</a></p>
    </article>
  `,
  styleUrl: './auth-page.scss',
})
export class TwoFactorPage {
  private readonly auth = inject(LocalUatAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  protected readonly testCode = signal(this.auth.pendingMfaCode(this.email));
  protected readonly error = signal('');
  protected code = '';

  protected async submit(): Promise<void> {
    if (!this.auth.verifyMfa(this.email, this.code)) {
      this.error.set('Authentication failed. Enter the current six-digit UAT code.');
      return;
    }
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl');
    await this.router.navigateByUrl(candidate?.startsWith('/app') ? candidate : '/app');
  }
}
