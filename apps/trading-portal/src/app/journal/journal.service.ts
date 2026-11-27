import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface JournalEntryView {
  readonly entryId: string;
  readonly symbol: string;
  readonly side: 'Long' | 'Short';
  readonly state: 'Draft' | 'Reviewed' | 'Archived';
  readonly openedAt: string;
  readonly thesis: string;
  readonly outcome: string;
  readonly resultPercent: number | null;
  readonly tags: readonly string[];
  readonly evidenceCount: number;
}

export interface JournalSnapshot {
  readonly accountId: string;
  readonly userId: string;
  readonly snapshotId: string;
  readonly asOf: string;
  readonly entries: readonly JournalEntryView[];
  readonly dataMode: 'Synthetic';
  readonly containsPersonalNotes: false;
  readonly isReadOnly: true;
  readonly createsTradingAuthority: false;
  readonly canChangeRisk: false;
  readonly canSubmitOrder: false;
}

export type JournalLoadState = 'Loading' | 'Ready' | 'Denied' | 'Unavailable' | 'Stale' | 'Invalid';

const guidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const emptyGuidPattern = /^0{8}-0{4}-0{4}-0{4}-0{12}$/i;
const symbolPattern = /^[A-Z0-9.-]{1,10}$/;

@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly http = inject(HttpClient);
  private requestVersion = 0;

  readonly snapshot = signal<JournalSnapshot | null>(null);
  readonly state = signal<JournalLoadState>('Loading');
  readonly message = signal('Loading your account- and user-scoped journal snapshot.');

  async load(): Promise<void> {
    const version = ++this.requestVersion;
    this.snapshot.set(null);
    this.state.set('Loading');
    this.message.set('Loading your account- and user-scoped journal snapshot.');
    try {
      const response = await firstValueFrom(
        this.http.get<unknown>('/api/v1/journal', { withCredentials: true }),
      );
      if (version !== this.requestVersion) return;
      if (!isJournalSnapshot(response)) {
        this.fail(
          'Invalid',
          'The journal response failed safety validation. No records are shown.',
        );
        return;
      }
      const age = Date.now() - Date.parse(response.asOf);
      if (age < -30_000 || age > 15 * 60_000) {
        this.fail('Stale', 'The journal snapshot is stale. No records are shown.');
        return;
      }
      this.snapshot.set(response);
      this.state.set('Ready');
      this.message.set('Read-only synthetic journal loaded.');
    } catch (error: unknown) {
      if (version !== this.requestVersion) return;
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        this.fail('Denied', 'Your session cannot access this journal.');
      } else {
        this.fail('Unavailable', 'The journal service is unavailable. No records are shown.');
      }
    }
  }

  private fail(state: Exclude<JournalLoadState, 'Loading' | 'Ready'>, message: string): void {
    this.snapshot.set(null);
    this.state.set(state);
    this.message.set(message);
  }
}

function isJournalSnapshot(value: unknown): value is JournalSnapshot {
  if (!isRecord(value)) return false;
  if (
    !isGuid(value['accountId']) ||
    !isGuid(value['userId']) ||
    !isString(value['snapshotId']) ||
    !isIsoDate(value['asOf']) ||
    value['dataMode'] !== 'Synthetic' ||
    value['containsPersonalNotes'] !== false ||
    value['isReadOnly'] !== true ||
    value['createsTradingAuthority'] !== false ||
    value['canChangeRisk'] !== false ||
    value['canSubmitOrder'] !== false ||
    !Array.isArray(value['entries']) ||
    value['entries'].length > 100 ||
    !value['entries'].every((entry) => isJournalEntry(entry, value['asOf']))
  ) {
    return false;
  }
  const ids = value['entries'].map((entry) => (entry as Record<string, unknown>)['entryId']);
  return new Set(ids).size === ids.length;
}

function isJournalEntry(value: unknown, asOf: unknown): boolean {
  return (
    isRecord(value) &&
    isGuid(value['entryId']) &&
    isString(value['symbol']) &&
    symbolPattern.test(value['symbol']) &&
    (value['side'] === 'Long' || value['side'] === 'Short') &&
    ['Draft', 'Reviewed', 'Archived'].includes(String(value['state'])) &&
    isIsoDate(value['openedAt']) &&
    Date.parse(value['openedAt']) <= Date.parse(String(asOf)) &&
    isString(value['thesis']) &&
    value['thesis'].length <= 4_000 &&
    isString(value['outcome']) &&
    value['outcome'].length <= 4_000 &&
    (value['resultPercent'] === null || isFiniteNumber(value['resultPercent'])) &&
    isLifecycleCoherent(value['state'], value['resultPercent']) &&
    Array.isArray(value['tags']) &&
    value['tags'].length <= 20 &&
    value['tags'].every(isNormalizedTag) &&
    new Set(value['tags']).size === value['tags'].length &&
    Number.isSafeInteger(value['evidenceCount']) &&
    Number(value['evidenceCount']) >= 0 &&
    Number(value['evidenceCount']) <= 10_000
  );
}

function isLifecycleCoherent(state: unknown, resultPercent: unknown): boolean {
  return state === 'Draft' ? resultPercent === null : isFiniteNumber(resultPercent);
}

function isNormalizedTag(value: unknown): value is string {
  return isString(value) && /^[a-z0-9][a-z0-9-]{0,39}$/.test(value);
}

function isGuid(value: unknown): value is string {
  return typeof value === 'string' && guidPattern.test(value) && !emptyGuidPattern.test(value);
}

function isIsoDate(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
