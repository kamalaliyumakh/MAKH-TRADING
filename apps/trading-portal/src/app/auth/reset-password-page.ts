import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LocalUatAuthService } from './local-uat-auth.service';

@Component({
  selector: 'makh-reset-password-page',
  imports: [FormsModule, RouterLink],
  template: `
    <article class="auth-card">
      <div class="brand-lockup">
        <img src="/makh-trading-logo.png" alt="" /><span
          ><strong>MAKH</strong><small>TRADING</small></span
        >
      </div>
      <h1>Create a new password</h1>
      <p class="lede">Reset the local UAT account for {{ email }}.</p>
      <p class="boundary">
        <strong>Local UAT reset code:</strong> {{ testCode() || 'No active reset request' }}.
        Production will never display a recovery secret on this screen.
      </p>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <form (ngSubmit)="submit()">
        <label
          >Reset code
          <input name="code" [(ngModel)]="code" inputmode="numeric" maxlength="6" required
        /></label>
        <label
          >New password
          <input
            name="password"
            [(ngModel)]="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
        /></label>
        <label
          >Confirm new password
          <input
            name="confirmation"
            [(ngModel)]="confirmation"
            type="password"
            autocomplete="new-password"
            required
        /></label>
        <button type="submit">Reset password</button>
      </form>
      <p class="secondary"><a routerLink="/login">Cancel and return to sign in</a></p>
    </article>
  `,
  styleUrl: './auth-page.scss',
})
export class ResetPasswordPage {
  private readonly auth = inject(LocalUatAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly email = this.route.snapshot.queryParamMap.get('email') ?? '';
  protected readonly testCode = signal(this.auth.pendingPasswordResetCode(this.email));
  protected readonly error = signal('');
  protected code = '';
  protected password = '';
  protected confirmation = '';

  protected async submit(): Promise<void> {
    if (this.password !== this.confirmation) {
      this.error.set('Passwords do not match.');
      return;
    }
    if (!(await this.auth.resetPassword(this.email, this.code, this.password))) {
      this.error.set('Password reset failed. Check the code and password requirements.');
      return;
    }
    await this.router.navigate(['/login'], { queryParams: { reset: 'true' } });
  }
}
