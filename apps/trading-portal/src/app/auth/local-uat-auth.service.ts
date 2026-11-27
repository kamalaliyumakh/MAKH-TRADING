import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

interface LocalUatAccount {
  readonly name: string;
  readonly email: string;
  readonly passwordDigest: string;
  readonly verified: boolean;
  readonly verificationCode: string;
  readonly resetCode?: string;
}

const accountKey = 'makh.uat.account';
const sessionKey = 'makh.uat.session';
const mfaKey = 'makh.uat.mfa';
const sessionLifetimeMs = 30 * 60 * 1000;
const mfaLifetimeMs = 5 * 60 * 1000;

interface LocalUatSession {
  readonly authenticated: true;
  readonly expiresAt: number;
}

interface LocalUatMfaChallenge {
  readonly email: string;
  readonly code: string;
  readonly expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class LocalUatAuthService {
  isAuthenticated(): boolean {
    const raw = sessionStorage.getItem(sessionKey);
    if (!raw) return false;

    try {
      const session = JSON.parse(raw) as LocalUatSession;
      if (session.authenticated === true && session.expiresAt > Date.now()) return true;
    } catch {
      // Invalid local UAT state fails closed.
    }

    sessionStorage.removeItem(sessionKey);
    return false;
  }

  async register(name: string, email: string, password: string): Promise<void> {
    const account: LocalUatAccount = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordDigest: await this.digest(password),
      verified: false,
      verificationCode: this.createVerificationCode(),
    };
    sessionStorage.setItem(accountKey, JSON.stringify(account));
  }

  async login(email: string, password: string): Promise<boolean> {
    const raw = sessionStorage.getItem(accountKey);
    if (!raw) return false;

    const account = JSON.parse(raw) as LocalUatAccount;
    const matches =
      account.verified === true &&
      account.email === email.trim().toLowerCase() &&
      account.passwordDigest === (await this.digest(password));
    if (matches)
      sessionStorage.setItem(
        mfaKey,
        JSON.stringify({
          email: account.email,
          code: this.createVerificationCode(),
          expiresAt: Date.now() + mfaLifetimeMs,
        } satisfies LocalUatMfaChallenge),
      );
    return matches;
  }

  pendingMfaCode(email: string): string | null {
    const challenge = this.readMfaChallenge();
    return challenge && challenge.email === email.trim().toLowerCase() ? challenge.code : null;
  }

  verifyMfa(email: string, code: string): boolean {
    const challenge = this.readMfaChallenge();
    if (
      !challenge ||
      challenge.email !== email.trim().toLowerCase() ||
      challenge.code !== code.trim()
    ) {
      return false;
    }

    const session: LocalUatSession = {
      authenticated: true,
      expiresAt: Date.now() + sessionLifetimeMs,
    };
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    sessionStorage.removeItem(mfaKey);
    return true;
  }

  pendingVerificationCode(email: string): string | null {
    const account = this.readAccount();
    return account && account.email === email.trim().toLowerCase() && !account.verified
      ? account.verificationCode
      : null;
  }

  verifyEmail(email: string, code: string): boolean {
    const account = this.readAccount();
    if (
      !account ||
      account.email !== email.trim().toLowerCase() ||
      account.verified ||
      account.verificationCode !== code.trim()
    ) {
      return false;
    }

    sessionStorage.setItem(
      accountKey,
      JSON.stringify({ ...account, verified: true, verificationCode: '' }),
    );
    return true;
  }

  startPasswordReset(email: string): string | null {
    const account = this.readAccount();
    if (!account || account.email !== email.trim().toLowerCase() || !account.verified) return null;

    const resetCode = this.createVerificationCode();
    sessionStorage.setItem(accountKey, JSON.stringify({ ...account, resetCode }));
    sessionStorage.removeItem(sessionKey);
    sessionStorage.removeItem(mfaKey);
    return resetCode;
  }

  pendingPasswordResetCode(email: string): string | null {
    const account = this.readAccount();
    return account && account.email === email.trim().toLowerCase() && account.verified
      ? (account.resetCode ?? null)
      : null;
  }

  async resetPassword(email: string, code: string, password: string): Promise<boolean> {
    const account = this.readAccount();
    if (
      !account ||
      account.email !== email.trim().toLowerCase() ||
      !account.verified ||
      !account.resetCode ||
      account.resetCode !== code.trim() ||
      password.length < 8
    ) {
      return false;
    }

    sessionStorage.setItem(
      accountKey,
      JSON.stringify({
        ...account,
        passwordDigest: await this.digest(password),
        resetCode: undefined,
      }),
    );
    sessionStorage.removeItem(sessionKey);
    sessionStorage.removeItem(mfaKey);
    return true;
  }

  logout(router: Router): Promise<boolean> {
    sessionStorage.removeItem(sessionKey);
    sessionStorage.removeItem(mfaKey);
    return router.navigate(['/login']);
  }

  private async digest(value: string): Promise<string> {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }

  private readAccount(): LocalUatAccount | null {
    const raw = sessionStorage.getItem(accountKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as LocalUatAccount;
    } catch {
      sessionStorage.removeItem(accountKey);
      return null;
    }
  }

  private createVerificationCode(): string {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return String((value[0] ?? 0) % 1_000_000).padStart(6, '0');
  }

  private readMfaChallenge(): LocalUatMfaChallenge | null {
    const raw = sessionStorage.getItem(mfaKey);
    if (!raw) return null;
    try {
      const challenge = JSON.parse(raw) as LocalUatMfaChallenge;
      if (challenge.expiresAt > Date.now()) return challenge;
    } catch {
      // Invalid local UAT MFA state fails closed.
    }
    sessionStorage.removeItem(mfaKey);
    return null;
  }
}
