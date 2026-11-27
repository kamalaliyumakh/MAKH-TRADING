import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RequestAccessService } from './request-access.service';

type SubmitState = 'ready' | 'submitting' | 'accepted' | 'duplicate' | 'unavailable';

@Component({
  selector: 'makh-request-access-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <article class="public-page request-page">
      <header class="page-hero">
        <p class="page-eyebrow">Expression of interest · local preview</p>
        <h1>Request access to MAKH</h1>
        <p class="page-lede">
          Tell us how to contact you and your general intended use. A request does not create a
          brokerage account, guarantee access, or authorize live trading.
        </p>
      </header>

      @if (state() === 'accepted' || state() === 'duplicate') {
        <section #resultPanel class="result-panel" role="status" tabindex="-1">
          <p class="page-eyebrow">
            {{ state() === 'duplicate' ? 'Request already received' : 'Request received' }}
          </p>
          <h2>Keep reference {{ referenceId() }} for follow-up.</h2>
          <p>
            This preview did not transmit or email your details. Production storage, retention,
            notifications, and response timing remain disabled until approved.
          </p>
          <p>We will never ask for your broker password by email.</p>
          <div class="page-actions"><a routerLink="/">Return home</a></div>
        </section>
      } @else {
        <section class="form-layout" aria-labelledby="form-title">
          <div>
            <h2 id="form-title">Your access request</h2>
            <p class="privacy-helper">
              Do not submit passwords, broker credentials, account numbers, government identifiers,
              account balances, or confidential trading instructions.
            </p>
            <p class="preview-note">
              Local preview: submissions stay in this browser session. External delivery is
              disabled.
            </p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
            @if (showErrors()) {
              <div #errorSummary class="error-summary" role="alert" tabindex="-1">
                <strong>Review the highlighted fields.</strong>
                <ul>
                  @if (invalid('name')) {
                    <li><a href="#name">Enter your name.</a></li>
                  }
                  @if (invalid('email')) {
                    <li><a href="#email">Enter a valid email address.</a></li>
                  }
                  @if (invalid('country')) {
                    <li><a href="#country">Enter your country or region.</a></li>
                  }
                  @if (invalid('intendedUse')) {
                    <li><a href="#intended-use">Select a general intended use.</a></li>
                  }
                  @if (invalid('consent')) {
                    <li><a href="#privacy-consent">Acknowledge the privacy notice.</a></li>
                  }
                </ul>
              </div>
            }

            <div class="field-grid">
              <div class="field">
                <label for="name">Name</label>
                <input
                  id="name"
                  formControlName="name"
                  autocomplete="name"
                  maxlength="100"
                  [attr.aria-invalid]="invalid('name')"
                />
                @if (invalid('name')) {
                  <small id="name-error">Enter your name.</small>
                }
              </div>
              <div class="field">
                <label for="email">Email</label>
                <input
                  id="email"
                  type="email"
                  formControlName="email"
                  autocomplete="email"
                  maxlength="254"
                  [attr.aria-invalid]="invalid('email')"
                />
                @if (invalid('email')) {
                  <small id="email-error">Enter a valid email address.</small>
                }
              </div>
              <div class="field">
                <label for="country">Country or region</label>
                <input
                  id="country"
                  formControlName="country"
                  autocomplete="country-name"
                  maxlength="80"
                  [attr.aria-invalid]="invalid('country')"
                />
                @if (invalid('country')) {
                  <small id="country-error">Enter your country or region.</small>
                }
              </div>
              <div class="field">
                <label for="experience">Trading experience <span>(optional)</span></label>
                <select id="experience" formControlName="experience">
                  <option value="">Prefer not to say</option>
                  <option value="new">Less than 1 year</option>
                  <option value="developing">1–3 years</option>
                  <option value="experienced">More than 3 years</option>
                </select>
              </div>
              <div class="field field-wide">
                <label for="intended-use">General intended use</label>
                <select
                  id="intended-use"
                  formControlName="intendedUse"
                  [attr.aria-invalid]="invalid('intendedUse')"
                >
                  <option value="">Select one</option>
                  <option value="research">Research and watchlists</option>
                  <option value="paper">Paper-trading evaluation</option>
                  <option value="risk">Risk controls and trade review</option>
                </select>
                @if (invalid('intendedUse')) {
                  <small id="intended-use-error">Select a general intended use.</small>
                }
              </div>
              <div class="field field-wide">
                <label for="contact-preference"
                  >Accessibility or contact preference <span>(optional)</span></label
                >
                <select id="contact-preference" formControlName="contactPreference">
                  <option value="">No preference</option>
                  <option value="email">Email</option>
                  <option value="plain-text">Plain-text email</option>
                </select>
              </div>
            </div>

            <div class="honeypot" aria-hidden="true">
              <label for="website">Website</label>
              <input id="website" formControlName="website" tabindex="-1" autocomplete="off" />
            </div>

            <label class="consent-row">
              <input
                id="privacy-consent"
                type="checkbox"
                formControlName="consent"
                [attr.aria-invalid]="invalid('consent')"
              />
              <span
                >I have read the <a routerLink="/privacy">provisional privacy notice</a> and
                understand how this request will be handled.</span
              >
            </label>
            @if (invalid('consent')) {
              <small class="consent-error">Privacy acknowledgement is required.</small>
            }

            @if (state() === 'unavailable') {
              <p class="error-summary" role="alert">
                Requests are temporarily unavailable. Wait about {{ retryAfterSeconds() }} seconds
                and try again. No details were sent.
              </p>
            }

            <button class="submit-button" type="submit" [disabled]="state() === 'submitting'">
              {{ state() === 'submitting' ? 'Submitting…' : 'Submit access request' }}
            </button>
          </form>
        </section>
      }
    </article>
  `,
})
export class RequestAccessPage {
  private readonly accessRequests = inject(RequestAccessService);
  private readonly errorSummary = viewChild<ElementRef<HTMLElement>>('errorSummary');
  private readonly resultPanel = viewChild<ElementRef<HTMLElement>>('resultPanel');
  protected readonly state = signal<SubmitState>('ready');
  protected readonly referenceId = signal('');
  protected readonly retryAfterSeconds = signal(0);
  protected readonly showErrors = signal(false);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(254)],
    }),
    country: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(80)],
    }),
    experience: new FormControl('', { nonNullable: true }),
    intendedUse: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    contactPreference: new FormControl('', { nonNullable: true }),
    consent: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    website: new FormControl('', { nonNullable: true }),
  });

  protected invalid(controlName: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.showErrors());
  }

  protected async submit(): Promise<void> {
    this.showErrors.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      setTimeout(() => this.errorSummary()?.nativeElement.focus());
      return;
    }

    this.state.set('submitting');
    const result = await this.accessRequests.submit(this.form.getRawValue());
    if (result.state === 'unavailable') {
      this.retryAfterSeconds.set(result.retryAfterSeconds);
      this.state.set('unavailable');
      return;
    }
    this.referenceId.set(result.referenceId);
    this.state.set(result.state);
    setTimeout(() => this.resultPanel()?.nativeElement.focus());
  }
}
