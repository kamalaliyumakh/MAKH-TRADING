import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type HealthState = 'Available' | 'Degraded' | 'Unavailable';
export type DashboardState = 'Loading' | 'Ready' | 'Denied' | 'Unavailable' | 'Stale' | 'Invalid';

export interface DashboardSnapshot {
  readonly accountId: string;
  readonly snapshotId: string;
  readonly asOf: string;
  readonly mode: 'PAPER';
  readonly accountLabel: string;
  readonly entryState: 'Locked';
  readonly entryReason: string;
  readonly pnl: {
    readonly realized: number;
    readonly unrealized: number;
    readonly total: number;
    readonly asOf: string;
    readonly authority: 'Synthetic estimate';
  };
  readonly risk: {
    readonly policyVersion: string;
    readonly dailyLossLimit: number;
    readonly consumedLossCapacity: number;
    readonly remainingLossCapacity: number;
    readonly openRisk: number;
    readonly buyingPower: null;
  };
  readonly dependencies: readonly {
    readonly name: string;
    readonly state: HealthState;
    readonly ageSeconds: number | null;
    readonly effect: string;
  }[];
  readonly activity: {
    readonly openPositions: number;
    readonly workingOrders: number;
    readonly reconciliationState: 'Not connected';
  };
  readonly alerts: readonly {
    readonly id: string;
    readonly severity: 'Critical' | 'Warning' | 'Information';
    readonly title: string;
    readonly guidance: string;
  }[];
  readonly candidates: readonly {
    readonly symbol: string;
    readonly gainPercent: number;
    readonly relativeVolume: number;
    readonly riskLabel: string;
  }[];
  readonly dataMode: 'Synthetic';
  readonly reconciledBrokerTruth: false;
  readonly createsTradingAuthority: false;
  readonly canSubmitOrder: false;
}

const guidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private requestVersion = 0;

  readonly snapshot = signal<DashboardSnapshot | null>(null);
  readonly state = signal<DashboardState>('Loading');
  readonly message = signal('Loading the account-scoped dashboard snapshot.');

  suspend(state: 'Loading' | 'Stale' | 'Denied' | 'Unavailable', message: string): void {
    ++this.requestVersion;
    this.snapshot.set(null);
    this.state.set(state);
    this.message.set(message);
  }

  async load(): Promise<void> {
    const version = ++this.requestVersion;
    this.snapshot.set(null);
    this.state.set('Loading');
    this.message.set('Loading the account-scoped dashboard snapshot.');
    try {
      const response = await firstValueFrom(
        this.http.get<unknown>('/api/v1/dashboard', { withCredentials: true }),
      );
      if (version !== this.requestVersion) return;
      if (!isDashboardSnapshot(response)) {
        this.fail(
          'Invalid',
          'The dashboard response failed safety validation. No account information is shown.',
        );
        return;
      }
      if (isStale(response)) {
        this.fail('Stale', 'The dashboard snapshot is stale. No account information is shown.');
        return;
      }
      this.snapshot.set(response);
      this.state.set('Ready');
      this.message.set('Read-only synthetic dashboard loaded.');
    } catch (error: unknown) {
      if (version !== this.requestVersion) return;
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        this.fail('Denied', 'Your session cannot access this account dashboard.');
      } else {
        this.fail(
          'Unavailable',
          'The dashboard service is unavailable. No account information is shown.',
        );
      }
    }
  }

  private fail(state: Exclude<DashboardState, 'Loading' | 'Ready'>, message: string): void {
    this.snapshot.set(null);
    this.state.set(state);
    this.message.set(message);
  }
}

function isDashboardSnapshot(value: unknown): value is DashboardSnapshot {
  if (!isRecord(value)) return false;
  return (
    isString(value['accountId']) &&
    guidPattern.test(value['accountId']) &&
    isString(value['snapshotId']) &&
    isIsoDate(value['asOf']) &&
    value['mode'] === 'PAPER' &&
    value['entryState'] === 'Locked' &&
    value['dataMode'] === 'Synthetic' &&
    value['reconciledBrokerTruth'] === false &&
    value['createsTradingAuthority'] === false &&
    value['canSubmitOrder'] === false &&
    isString(value['accountLabel']) &&
    isString(value['entryReason']) &&
    isPnl(value['pnl']) &&
    isRisk(value['risk']) &&
    Array.isArray(value['dependencies']) &&
    value['dependencies'].length >= 3 &&
    value['dependencies'].length <= 20 &&
    value['dependencies'].every(isDependency) &&
    hasUniqueStrings(value['dependencies'], 'name') &&
    requiredAuthoritiesUnavailable(value['dependencies']) &&
    isActivity(value['activity']) &&
    Array.isArray(value['alerts']) &&
    value['alerts'].length <= 50 &&
    value['alerts'].some(isCriticalEntryLock) &&
    value['alerts'].every(isAlert) &&
    hasUniqueStrings(value['alerts'], 'id') &&
    Array.isArray(value['candidates']) &&
    value['candidates'].length <= 100 &&
    value['candidates'].every(isCandidate) &&
    hasUniqueStrings(value['candidates'], 'symbol') &&
    isPnlCurrent(value['pnl'], value['asOf'])
  );
}

function isPnl(value: unknown): boolean {
  return (
    isRecord(value) &&
    ['realized', 'unrealized', 'total'].every((key) => isFiniteNumber(value[key])) &&
    isFiniteNumber(value['realized']) &&
    isFiniteNumber(value['unrealized']) &&
    isFiniteNumber(value['total']) &&
    Math.abs(value['realized'] + value['unrealized'] - value['total']) < 0.000001 &&
    isIsoDate(value['asOf']) &&
    value['authority'] === 'Synthetic estimate'
  );
}

function isRisk(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value['policyVersion']) &&
    ['dailyLossLimit', 'consumedLossCapacity', 'remainingLossCapacity', 'openRisk'].every((key) =>
      isFiniteNumber(value[key]),
    ) &&
    isFiniteNumber(value['dailyLossLimit']) &&
    isFiniteNumber(value['consumedLossCapacity']) &&
    isFiniteNumber(value['remainingLossCapacity']) &&
    value['dailyLossLimit'] >= 0 &&
    value['consumedLossCapacity'] >= 0 &&
    value['remainingLossCapacity'] >= 0 &&
    isFiniteNumber(value['openRisk']) &&
    value['openRisk'] >= 0 &&
    Math.abs(
      value['consumedLossCapacity'] + value['remainingLossCapacity'] - value['dailyLossLimit'],
    ) < 0.000001 &&
    value['buyingPower'] === null
  );
}

function isDependency(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value['name']) &&
    ['Available', 'Degraded', 'Unavailable'].includes(String(value['state'])) &&
    (value['ageSeconds'] === null ||
      (Number.isSafeInteger(value['ageSeconds']) && Number(value['ageSeconds']) >= 0)) &&
    isString(value['effect'])
  );
}

function requiredAuthoritiesUnavailable(items: readonly unknown[]): boolean {
  return ['Risk service', 'Broker', 'Reconciliation'].every((name) =>
    items.some(
      (item) => isRecord(item) && item['name'] === name && item['state'] === 'Unavailable',
    ),
  );
}

function isActivity(value: unknown): boolean {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value['openPositions']) &&
    Number(value['openPositions']) >= 0 &&
    Number(value['openPositions']) <= 1_000_000 &&
    Number.isSafeInteger(value['workingOrders']) &&
    Number(value['workingOrders']) >= 0 &&
    Number(value['workingOrders']) <= 1_000_000 &&
    value['reconciliationState'] === 'Not connected'
  );
}

function isAlert(value: unknown): boolean {
  return (
    isRecord(value) &&
    ['id', 'title', 'guidance'].every((key) => isString(value[key])) &&
    ['Critical', 'Warning', 'Information'].includes(String(value['severity']))
  );
}

function isCriticalEntryLock(value: unknown): boolean {
  return isRecord(value) && value['id'] === 'entry-lock' && value['severity'] === 'Critical';
}

function isCandidate(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value['symbol']) &&
    /^[A-Z0-9.-]{1,10}$/.test(value['symbol']) &&
    isFiniteNumber(value['gainPercent']) &&
    isFiniteNumber(value['relativeVolume']) &&
    value['relativeVolume'] >= 0 &&
    isString(value['riskLabel'])
  );
}

function hasUniqueStrings(items: readonly unknown[], key: string): boolean {
  const values = items.map((item) => (isRecord(item) ? item[key] : null));
  return values.every(isString) && new Set(values).size === values.length;
}

function isPnlCurrent(pnl: unknown, asOf: unknown): boolean {
  return (
    isRecord(pnl) &&
    isIsoDate(pnl['asOf']) &&
    isIsoDate(asOf) &&
    Date.parse(pnl['asOf'] as string) <= Date.parse(asOf as string)
  );
}

function isStale(snapshot: DashboardSnapshot): boolean {
  const age = Date.now() - Date.parse(snapshot.asOf);
  return (
    age < -30_000 ||
    age > 5 * 60_000 ||
    snapshot.dependencies.some((item) => item.ageSeconds != null && item.ageSeconds > 120)
  );
}

function isIsoDate(value: unknown): boolean {
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
