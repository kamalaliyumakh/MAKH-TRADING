import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import axe from 'axe-core';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('states that scanner momentum does not authorize a trade', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Scanner momentum never authorizes a trade');
    expect(compiled.textContent).toContain('No account connection');
  });

  it('renders the required shell navigation and persistent risk disclosure', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('a[href="#main-content"]')?.textContent).toContain('Skip');
    expect(compiled.querySelector('nav[aria-label="Primary navigation"]')).toBeTruthy();
    expect(compiled.querySelector('nav[aria-label="Footer navigation"]')).toBeTruthy();
    expect(compiled.textContent).toContain('MAKH does not guarantee outcomes');
  });

  it('exposes an accessible mobile-menu control', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const button = fixture.nativeElement.querySelector('#menu-button') as HTMLButtonElement;

    expect(button.getAttribute('aria-controls')).toBe('mobile-menu');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    button.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.querySelector('#mobile-menu')).toBeTruthy();
    expect(document.activeElement?.textContent?.trim()).toBe('Platform');
  });

  it.each([
    [
      '/platform',
      'One accountable path from market signal to broker outcome.',
      'broker remains authoritative',
    ],
    [
      '/security',
      'Security controls follow the consequence of the action.',
      'broker timeout is unknown',
    ],
    ['/status', 'MAKH service status', 'Monitoring not connected'],
    [
      '/about',
      'Built for disciplined self-directed trading.',
      'does not custody funds or securities',
    ],
  ])('renders approved bounded content for %s', async (path, heading, boundary) => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(path);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('main h1')).toHaveLength(1);
    expect(compiled.querySelector('main h1')?.textContent).toContain(heading);
    expect(compiled.textContent?.toLowerCase()).toContain(boundary.toLowerCase());
    expect(compiled.textContent).toContain('MAKH does not guarantee outcomes');
  });

  it('pairs 100%–600% momentum with explicit elevated-risk language', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('A 100%–600% move is not a recommendation');
    expect(text).toContain('extreme volatility, thin liquidity, wide spreads, halts');
    expect(text).toContain('They do not promise another gain');
  });

  it('renders the versioned risk draft without public acceptance capture', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/legal/risk');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';

    expect(compiled.querySelectorAll('main h1')).toHaveLength(1);
    expect(text).toContain('MAKH-RISK-DRAFT');
    expect(text).toContain('0.1-draft');
    expect(text).toContain('losses larger than a planned stop');
    expect(text).toContain('broker remains authoritative');
    expect(text).toContain('does not record acceptance');
    expect(compiled.querySelector('input[type="checkbox"]')).toBeNull();
  });

  it('renders the provisional privacy notice without claiming completed controls', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/privacy');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const text = compiled.textContent ?? '';

    expect(compiled.querySelectorAll('main h1')).toHaveLength(1);
    expect(text).toContain('MAKH-PRIVACY-DRAFT');
    expect(text).toContain('No provisional planning period should be treated as legally approved');
    expect(text).toContain('Nonessential analytics will remain disabled');
    expect(text).toContain('No privacy request, cookie preference or consent is transmitted');
  });

  it('renders a minimal accessible request-access form with safe-data guidance', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/request-access');
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('main h1')).toHaveLength(1);
    expect(compiled.querySelector('label[for="email"]')).toBeTruthy();
    expect(compiled.querySelector('input[type="checkbox"]')).toBeTruthy();
    expect(compiled.textContent).toContain('Do not submit passwords, broker credentials');
    expect(compiled.textContent).toContain('External delivery is disabled');
  });

  it('validates required request-access fields without transmitting data', async () => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/request-access');
    await fixture.whenStable();

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).requestSubmit();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Review the highlighted fields');
    expect(text).toContain('Enter a valid email address');
    expect(text).toContain('Privacy acknowledgement is required');
    expect(fixture.nativeElement.querySelector('.error-summary[tabindex="-1"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.error-summary a[href="#email"]')).toBeTruthy();
  });

  it('applies route-specific descriptions and noindex only to sensitive public routes', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/platform');
    await fixture.whenStable();
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toContain(
      'discovery-to-review',
    );
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe(
      'Platform — MAKH Trading',
    );
    expect(
      document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
    ).toContain('discovery-to-review');
    expect(document.querySelector('meta[name="twitter:title"]')?.getAttribute('content')).toBe(
      'Platform — MAKH Trading',
    );
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'index,follow',
    );

    await router.navigateByUrl('/request-access');
    await fixture.whenStable();
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex,nofollow',
    );
  });

  it.each([
    '/',
    '/platform',
    '/security',
    '/status',
    '/about',
    '/legal/risk',
    '/privacy',
    '/request-access',
    '/sign-in',
  ])('has no automated WCAG A or AA axe violations on %s', async (path) => {
    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl(path);
    await fixture.whenStable();

    const results = await axe.run(fixture.nativeElement, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
      rules: {
        // jsdom has no layout engine, so contrast remains part of the retained real-browser matrix.
        'color-contrast': { enabled: false },
      },
    });

    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        targets: violation.nodes.flatMap((node) => node.target),
      })),
    ).toEqual([]);
  });
});
