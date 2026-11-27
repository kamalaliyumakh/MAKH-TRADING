import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalUatAuthService } from './local-uat-auth.service';

describe('LocalUatAuthService', () => {
  let service: LocalUatAuthService;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalUatAuthService);
  });

  it('starts anonymous', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('requires email verification before matching UAT credentials can authenticate', async () => {
    await service.register('UAT User', 'uat@example.com', 'UatPass!2026');

    await expect(service.login('uat@example.com', 'UatPass!2026')).resolves.toBe(false);
    const code = service.pendingVerificationCode('uat@example.com');
    expect(code).toMatch(/^\d{6}$/);
    expect(service.verifyEmail('uat@example.com', '000000')).toBe(false);
    expect(service.verifyEmail('uat@example.com', code ?? '')).toBe(true);
    await expect(service.login('uat@example.com', 'wrong-password')).resolves.toBe(false);
    await expect(service.login('UAT@EXAMPLE.COM', 'UatPass!2026')).resolves.toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    const mfaCode = service.pendingMfaCode('uat@example.com');
    expect(mfaCode).toMatch(/^\d{6}$/);
    expect(service.verifyMfa('uat@example.com', '000000')).toBe(false);
    expect(service.verifyMfa('uat@example.com', mfaCode ?? '')).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });

  it('clears the authenticated session on logout', async () => {
    await service.register('UAT User', 'uat@example.com', 'UatPass!2026');
    service.verifyEmail(
      'uat@example.com',
      service.pendingVerificationCode('uat@example.com') ?? '',
    );
    await service.login('uat@example.com', 'UatPass!2026');
    service.verifyMfa('uat@example.com', service.pendingMfaCode('uat@example.com') ?? '');
    const router = { navigate: vi.fn().mockResolvedValue(true) } as unknown as Router;

    await service.logout(router);

    expect(service.isAuthenticated()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('fails closed and clears an expired or malformed session', async () => {
    sessionStorage.setItem(
      'makh.uat.session',
      JSON.stringify({ authenticated: true, expiresAt: Date.now() - 1 }),
    );
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('makh.uat.session')).toBeNull();

    sessionStorage.setItem('makh.uat.session', 'not-json');
    expect(service.isAuthenticated()).toBe(false);
    expect(sessionStorage.getItem('makh.uat.session')).toBeNull();
  });

  it('resets a verified account password and invalidates the active session', async () => {
    await service.register('UAT User', 'uat@example.com', 'OldPass!2026');
    service.verifyEmail(
      'uat@example.com',
      service.pendingVerificationCode('uat@example.com') ?? '',
    );
    await service.login('uat@example.com', 'OldPass!2026');
    service.verifyMfa('uat@example.com', service.pendingMfaCode('uat@example.com') ?? '');

    const resetCode = service.startPasswordReset('uat@example.com');
    expect(resetCode).toMatch(/^\d{6}$/);
    expect(service.isAuthenticated()).toBe(false);
    await expect(service.resetPassword('uat@example.com', '000000', 'NewPass!2026')).resolves.toBe(
      false,
    );
    await expect(
      service.resetPassword('uat@example.com', resetCode ?? '', 'NewPass!2026'),
    ).resolves.toBe(true);
    await expect(service.login('uat@example.com', 'OldPass!2026')).resolves.toBe(false);
    await expect(service.login('uat@example.com', 'NewPass!2026')).resolves.toBe(true);
    expect(
      service.verifyMfa('uat@example.com', service.pendingMfaCode('uat@example.com') ?? ''),
    ).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
  });
});
