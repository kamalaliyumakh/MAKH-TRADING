import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocalUatAuthService } from './local-uat-auth.service';

@Component({
  selector: 'makh-verify-email-page',
  imports: [FormsModule, RouterLink],
  template: `
    <article class="auth-card">
      <div class="brand-lockup">
        <img src="/makh-trading-logo.png" alt="" /><span
          ><strong>MAKH</strong><small>TRADING</small></span
        >
      </div>
      <h1>Verify your email</h1>
      <p class="lede">Enter the six-digit code for {{ email }}.</p>
      <p class="boundary">
        <strong>Local UAT code:</strong> {{ testCode() || 'No pending account found' }}. Production
        will deliver a time-limited code through an approved provider; it will never display it
        here.
      </p>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <form (ngSubmit)="submit()">
        <label
          >Verification code
          <input
            name="code"
            [(ngModel)]="code"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="6"
            pattern="[0-9]{6}"
            required
        /></label>
        <button type="submit">Verify email</button>
      </form>
      <p class="secondary"><a routerLink="/register">Start registration again</a></p>
    </article>
  `,
  styleUrl: './auth-page.scss',
})
export class VerifyEmailPage {
  private readonly auth = inject(LocalUatAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  protected readonly testCode = signal(this.auth.pendingVerificationCode(this.email));
  protected readonly error = signal('');
  protected code = '';

  protected async submit(): Promise<void> {
    if (!this.auth.verifyEmail(this.email, this.code)) {
      this.error.set('Verification failed. Enter the current six-digit UAT code.');
      return;
    }
    await this.router.navigate(['/login'], { queryParams: { verified: 'true' } });
  }
}
