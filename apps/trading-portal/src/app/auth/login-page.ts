import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocalUatAuthService } from './local-uat-auth.service';

@Component({
  selector: 'makh-login-page',
  imports: [FormsModule, RouterLink],
  template: `
    <article class="auth-card">
      <div class="brand-lockup">
        <img src="/makh-trading-logo.png" alt="" /><span
          ><strong>MAKH</strong><small>TRADING</small></span
        >
      </div>
      <h1>Welcome back</h1>
      <p class="lede">Sign in to the local paper-only portal.</p>
      <p class="boundary">
        <strong>Local UAT only:</strong> production OIDC/BFF identity remains disabled pending
        provider approval.
      </p>
      @if (verified()) {
        <p role="status">Email verified. Sign in to continue.</p>
      }
      @if (reset()) {
        <p role="status">Password reset. Sign in with the new password.</p>
      }
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <form (ngSubmit)="submit()">
        <label
          >Email <input name="email" [(ngModel)]="email" type="email" autocomplete="email" required
        /></label>
        <label
          >Password
          <input
            name="password"
            [(ngModel)]="password"
            type="password"
            autocomplete="current-password"
            required
        /></label>
        <button type="submit">Sign in</button>
      </form>
      <p class="secondary"><a routerLink="/forgot-password">Forgot password?</a></p>
      <p class="secondary">Need an account? <a routerLink="/register">Register for UAT</a></p>
    </article>
  `,
  styleUrl: './auth-page.scss',
})
export class LoginPage {
  private readonly auth = inject(LocalUatAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected email = '';
  protected password = '';
  protected readonly error = signal('');
  protected readonly verified = signal(
    this.route.snapshot.queryParamMap.get('verified') === 'true',
  );
  protected readonly reset = signal(this.route.snapshot.queryParamMap.get('reset') === 'true');

  protected async submit(): Promise<void> {
    if (!(await this.auth.login(this.email, this.password))) {
      this.error.set('Sign-in failed. Check the UAT account details and try again.');
      return;
    }
    const candidate = this.route.snapshot.queryParamMap.get('returnUrl');
    const returnUrl = candidate?.startsWith('/app') ? candidate : '/app';
    await this.router.navigate(['/two-factor'], {
      queryParams: { email: this.email.trim().toLowerCase(), returnUrl },
    });
  }
}
