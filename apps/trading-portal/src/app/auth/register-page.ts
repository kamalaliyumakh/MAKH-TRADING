import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LocalUatAuthService } from './local-uat-auth.service';

@Component({
  selector: 'makh-register-page',
  imports: [FormsModule, RouterLink],
  template: `
    <article class="auth-card">
      <div class="brand-lockup">
        <img src="/makh-trading-logo.png" alt="" /><span
          ><strong>MAKH</strong><small>TRADING</small></span
        >
      </div>
      <h1>Create your UAT account</h1>
      <p class="lede">Register to test the paper-only portal journey.</p>
      <p class="boundary">
        <strong>Local UAT only:</strong> this account exists only in this browser tab and is not a
        production identity or brokerage account.
      </p>
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <form (ngSubmit)="submit()">
        <label
          >Full name <input name="name" [(ngModel)]="name" autocomplete="name" required
        /></label>
        <label
          >Email <input name="email" [(ngModel)]="email" type="email" autocomplete="email" required
        /></label>
        <label
          >Password
          <input
            name="password"
            [(ngModel)]="password"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
        /></label>
        <label
          >Confirm password
          <input
            name="confirmation"
            [(ngModel)]="confirmation"
            type="password"
            autocomplete="new-password"
            required
        /></label>
        <button type="submit">Create UAT account</button>
      </form>
      <p class="secondary">Already registered? <a routerLink="/login">Sign in</a></p>
    </article>
  `,
  styleUrl: './auth-page.scss',
})
export class RegisterPage {
  private readonly auth = inject(LocalUatAuthService);
  private readonly router = inject(Router);
  protected name = '';
  protected email = '';
  protected password = '';
  protected confirmation = '';
  protected readonly error = signal('');

  protected async submit(): Promise<void> {
    if (!this.name.trim() || !/^\S+@\S+\.\S+$/.test(this.email) || this.password.length < 8) {
      this.error.set('Enter a name, valid email and password of at least 8 characters.');
      return;
    }
    if (this.password !== this.confirmation) {
      this.error.set('Passwords do not match.');
      return;
    }
    await this.auth.register(this.name, this.email, this.password);
    await this.router.navigate(['/verify-email'], { queryParams: { email: this.email.trim() } });
  }
}
