import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export type EvidenceTrust = 'Primary' | 'Attributed' | 'Low trust';
export type SymbolWorkspaceState =
  'Loading' | 'Ready' | 'Unknown' | 'Denied' | 'Unavailable' | 'Stale' | 'Invalid';

export interface PricePointView {
  readonly time: string;
  readonly price: number;
}

export interface EvidenceItemView {
  readonly id: string;
  readonly kind: 'SEC filing' | 'Issuer announcement' | 'News' | 'Social attention';
  readonly headline: string;
  readonly source: string;
  readonly trust: EvidenceTrust;
  readonly observedAt: string;
  readonly limitation: string;
  readonly catalystVerified: boolean;
}

export interface SymbolWorkspaceView {
  readonly securityId: string;
  readonly symbol: string;
  readonly companyName: string;
  readonly venueMic: string;
  readonly tradability: 'Review only' | 'Unavailable';
  readonly asOf: string;
  readonly quote: {
    readonly bid: number;
    readonly ask: number;
    readonly last: number;
    readonly ageSeconds: number;
    readonly state: 'Current' | 'Stale';
  };
  readonly metrics: {
    readonly gainPercent: number;
    readonly relativeVolume: number;
    readonly publicFloat: number;
    readonly spreadPercent: number;
    readonly dollarVolume: number;
    readonly extremeMoveRisk: boolean;
  };
  readonly pricePoints: readonly PricePointView[];
  readonly evidenceSnapshotHash: string;
  readonly evidence: readonly EvidenceItemView[];
  readonly thesis: {
    readonly summary: string;
    readonly catalystStatus: 'Not verified' | 'Verified';
    readonly invalidation: string;
    readonly exitPlan: string;
  };
  readonly dataMode: 'Synthetic';
  readonly createsTradingAuthority: false;
  readonly canSubmitOrder: false;
}

const trustRank: Readonly<Record<EvidenceTrust, number>> = {
  Primary: 3,
  Attributed: 2,
  'Low trust': 1,
};
const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const hashPattern = /^[0-9a-f]{64}$/;
const symbolPattern = /^[A-Z0-9.-]{1,10}$/;
const chartTimePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

@Injectable({ providedIn: 'root' })
export class SymbolWorkspaceService {
  private readonly http = inject(HttpClient);
  private requestVersion = 0;

  readonly workspace = signal<SymbolWorkspaceView | null>(null);
  readonly state = signal<SymbolWorkspaceState>('Loading');
  readonly message = signal('Loading the read-only symbol workspace.');

  suspend(state: 'Loading' | 'Stale' | 'Denied' | 'Unavailable', message: string): void {
    ++this.requestVersion;
    this.workspace.set(null);
    this.state.set(state);
    this.message.set(message);
  }

  async load(rawSymbol: string): Promise<void> {
    const version = ++this.requestVersion;
    const symbol = rawSymbol.trim().toUpperCase();
    this.workspace.set(null);
    this.state.set('Loading');
    this.message.set('Loading the read-only symbol workspace.');

    if (!symbolPattern.test(symbol)) {
      this.setFailure('Invalid', 'The symbol address is invalid. Return to the scanner.');
      return;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<unknown>(`/api/v1/symbols/${encodeURIComponent(symbol)}/workspace`, {
          withCredentials: true,
        }),
      );
      if (version !== this.requestVersion) return;
      if (!isWorkspace(response, symbol)) {
        this.setFailure(
          'Invalid',
          'The workspace response failed safety validation. No market or evidence data is shown.',
        );
        return;
      }
      if (response.quote.state === 'Stale' || response.quote.ageSeconds > 120) {
        this.setFailure(
          'Stale',
          'The quote is stale. Return to the scanner and wait for a current snapshot.',
        );
        return;
      }
      this.workspace.set(response);
      this.state.set('Ready');
      this.message.set('Read-only synthetic workspace loaded.');
    } catch (error: unknown) {
      if (version !== this.requestVersion) return;
      if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
        this.setFailure(
          'Denied',
          'Your session cannot access this workspace. Sign in and try again.',
        );
      } else if (error instanceof HttpErrorResponse && error.status === 404) {
        this.setFailure('Unknown', 'That symbol is not available in the candidate scanner.');
      } else {
        this.setFailure(
          'Unavailable',
          'The workspace service is unavailable. No market or evidence data is shown.',
        );
      }
    }
  }

  private setFailure(state: Exclude<SymbolWorkspaceState, 'Loading' | 'Ready'>, message: string) {
    this.workspace.set(null);
    this.state.set(state);
    this.message.set(message);
  }
}

function isWorkspace(value: unknown, requestedSymbol: string): value is SymbolWorkspaceView {
  if (!isRecord(value)) return false;
  return (
    value['symbol'] === requestedSymbol &&
    value['dataMode'] === 'Synthetic' &&
    value['createsTradingAuthority'] === false &&
    value['canSubmitOrder'] === false &&
    isString(value['securityId']) &&
    guidPattern.test(value['securityId']) &&
    isString(value['companyName']) &&
    isString(value['venueMic']) &&
    ['Review only', 'Unavailable'].includes(String(value['tradability'])) &&
    isIsoDate(value['asOf']) &&
    isQuote(value['quote']) &&
    isMetrics(value['metrics']) &&
    Array.isArray(value['pricePoints']) &&
    value['pricePoints'].length >= 2 &&
    value['pricePoints'].length <= 500 &&
    isPriceSeries(value['pricePoints']) &&
    isString(value['evidenceSnapshotHash']) &&
    hashPattern.test(value['evidenceSnapshotHash']) &&
    Array.isArray(value['evidence']) &&
    value['evidence'].length > 0 &&
    value['evidence'].length <= 100 &&
    value['evidence'].every(isEvidence) &&
    hasUniqueEvidenceIds(value['evidence']) &&
    isEvidenceCurrent(value['evidence'], value['asOf']) &&
    isTrustOrdered(value['evidence']) &&
    isThesis(value['thesis'])
  );
}

function isQuote(value: unknown): boolean {
  return (
    isRecord(value) &&
    isFiniteNumber(value['bid']) &&
    isFiniteNumber(value['ask']) &&
    isFiniteNumber(value['last']) &&
    value['bid'] >= 0 &&
    value['ask'] >= value['bid'] &&
    value['last'] >= 0 &&
    isFiniteNumber(value['ageSeconds']) &&
    value['ageSeconds'] >= 0 &&
    (value['state'] === 'Current' || value['state'] === 'Stale')
  );
}

function isMetrics(value: unknown): boolean {
  return (
    isRecord(value) &&
    ['gainPercent', 'relativeVolume', 'publicFloat', 'spreadPercent', 'dollarVolume'].every((key) =>
      isFiniteNumber(value[key]),
    ) &&
    isFiniteNumber(value['publicFloat']) &&
    value['publicFloat'] >= 0 &&
    isFiniteNumber(value['relativeVolume']) &&
    value['relativeVolume'] >= 0 &&
    isFiniteNumber(value['spreadPercent']) &&
    value['spreadPercent'] >= 0 &&
    isFiniteNumber(value['dollarVolume']) &&
    value['dollarVolume'] >= 0 &&
    value['extremeMoveRisk'] === true
  );
}

function isPricePoint(value: unknown): boolean {
  return (
    isRecord(value) &&
    isString(value['time']) &&
    chartTimePattern.test(value['time']) &&
    isFiniteNumber(value['price']) &&
    value['price'] >= 0
  );
}

function isPriceSeries(items: readonly unknown[]): boolean {
  if (!items.every(isPricePoint)) return false;
  const times = items.map((item) => (item as PricePointView).time);
  return times.every((time, index) => index === 0 || times[index - 1] < time);
}

function isEvidence(value: unknown): value is EvidenceItemView {
  return (
    isRecord(value) &&
    ['id', 'headline', 'source', 'limitation'].every((key) => isString(value[key])) &&
    ['SEC filing', 'Issuer announcement', 'News', 'Social attention'].includes(
      String(value['kind']),
    ) &&
    ['Primary', 'Attributed', 'Low trust'].includes(String(value['trust'])) &&
    isIsoDate(value['observedAt']) &&
    value['catalystVerified'] === false
  );
}

function isTrustOrdered(items: readonly EvidenceItemView[]): boolean {
  return items.every(
    (item, index) => index === 0 || trustRank[items[index - 1].trust] >= trustRank[item.trust],
  );
}

function hasUniqueEvidenceIds(items: readonly EvidenceItemView[]): boolean {
  return new Set(items.map((item) => item.id)).size === items.length;
}

function isEvidenceCurrent(items: readonly EvidenceItemView[], asOf: unknown): boolean {
  if (!isString(asOf)) return false;
  const snapshotTime = Date.parse(asOf);
  return items.every((item) => Date.parse(item.observedAt) <= snapshotTime);
}

function isThesis(value: unknown): boolean {
  return (
    isRecord(value) &&
    ['summary', 'invalidation', 'exitPlan'].every((key) => isString(value[key])) &&
    value['catalystStatus'] === 'Not verified'
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
