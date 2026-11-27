import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it } from 'vitest';
import { localUatAuthGuard } from './auth.guard';
import { LocalUatAuthService } from './local-uat-auth.service';

describe('localUatAuthGuard', () => {
  let auth: LocalUatAuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    auth = TestBed.inject(LocalUatAuthService);
  });

  it('redirects an anonymous deep link to login and preserves its return path', () => {
    const result = TestBed.runInInjectionContext(() =>
      localUatAuthGuard({} as never, { url: '/app/scanner' } as never),
    );

    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Fapp%2Fscanner',
    );
  });

  it('allows a current authenticated UAT session', async () => {
    await auth.register('UAT User', 'uat@example.com', 'UatPass!2026');
    auth.verifyEmail('uat@example.com', auth.pendingVerificationCode('uat@example.com') ?? '');
    await auth.login('uat@example.com', 'UatPass!2026');
    auth.verifyMfa('uat@example.com', auth.pendingMfaCode('uat@example.com') ?? '');

    const result = TestBed.runInInjectionContext(() =>
      localUatAuthGuard({} as never, { url: '/app' } as never),
    );

    expect(result).toBe(true);
  });
});
