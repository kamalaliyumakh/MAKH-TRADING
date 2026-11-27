import { Injectable } from '@angular/core';

export interface AccessRequest {
  name: string;
  email: string;
  country: string;
  experience: string;
  intendedUse: string;
  contactPreference: string;
  consent: boolean;
  website: string;
}

export type AccessRequestResult =
  | { state: 'accepted' | 'duplicate'; referenceId: string }
  | { state: 'unavailable'; retryAfterSeconds: number };

/**
 * Local preview boundary for the future public lead-capture API.
 * It deliberately sends no network request and retains no form payload outside this service instance.
 */
@Injectable({ providedIn: 'root' })
export class RequestAccessService {
  /** Stores only irreversible lookup digests, never submitted email addresses. */
  private readonly references = new Map<string, string>();
  private readonly attempts: number[] = [];

  async submit(request: AccessRequest): Promise<AccessRequestResult> {
    await Promise.resolve();

    if (request.website.trim()) {
      return { state: 'accepted', referenceId: this.createReference('screened') };
    }

    const now = Date.now();
    const windowStart = now - 60_000;
    while (this.attempts.length && this.attempts[0] < windowStart) {
      this.attempts.shift();
    }
    if (this.attempts.length >= 3) {
      return { state: 'unavailable', retryAfterSeconds: 60 };
    }
    this.attempts.push(now);

    const key = await this.createLookupDigest(request.email);
    const existing = this.references.get(key);
    if (existing) {
      return { state: 'duplicate', referenceId: existing };
    }

    const referenceId = this.createReference(key);
    this.references.set(key, referenceId);
    return { state: 'accepted', referenceId };
  }

  private async createLookupDigest(email: string): Promise<string> {
    const normalized = email.trim().toLowerCase();
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalized));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }

  private createReference(value: string): string {
    let hash = 2166136261;
    for (const character of `${value}:${new Date().toISOString().slice(0, 10)}`) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return `MAKH-${(hash >>> 0).toString(36).toUpperCase().padStart(7, '0')}`;
  }
}
