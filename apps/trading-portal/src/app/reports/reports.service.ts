import { Injectable } from '@angular/core';

export interface ReportingSnapshot {
  readonly dataMode: 'synthetic';
  readonly isAuthoritative: false;
  readonly isBrokerStatement: false;
  readonly canSubmitOrder: false;
  readonly reportId: string;
  readonly tradingDate: string;
  readonly generatedAt: string;
  readonly quality: 'Partial';
  readonly totals: {
    readonly executions: number;
    readonly quantity: number;
    readonly gross: number;
    readonly fees: number;
    readonly realizedPnl: number;
  };
  readonly pnlTrend: readonly number[];
  readonly strategies: readonly {
    readonly name: string;
    readonly executions: number;
    readonly realizedPnl: number;
  }[];
  readonly adherence: {
    readonly passed: number;
    readonly breached: number;
    readonly unknown: number;
  };
  readonly sources: readonly {
    readonly name: string;
    readonly quality: 'Complete' | 'Partial';
    readonly accepted: number;
    readonly rejected: number;
    readonly ageMinutes: number;
  }[];
  readonly evidenceHash: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsService {
  readonly snapshot: ReportingSnapshot = {
    dataMode: 'synthetic',
    isAuthoritative: false,
    isBrokerStatement: false,
    canSubmitOrder: false,
    reportId: 'synthetic-daily-20260820',
    tradingDate: '2026-08-20T00:00:00Z',
    generatedAt: '2026-08-20T15:10:00Z',
    quality: 'Partial',
    totals: { executions: 7, quantity: 1250, gross: 6187.5, fees: 8.75, realizedPnl: 34.2 },
    pnlTrend: [-8, -3, 5, 2, 18, 13, 27, 34.2],
    strategies: [
      { name: 'Momentum', executions: 4, realizedPnl: 28.4 },
      { name: 'Pullback', executions: 2, realizedPnl: 9.1 },
      { name: 'Opening range', executions: 1, realizedPnl: -3.3 },
    ],
    adherence: { passed: 16, breached: 1, unknown: 2 },
    sources: [
      {
        name: 'Synthetic executions',
        quality: 'Complete',
        accepted: 7,
        rejected: 0,
        ageMinutes: 4,
      },
      {
        name: 'Synthetic risk decisions',
        quality: 'Complete',
        accepted: 19,
        rejected: 0,
        ageMinutes: 5,
      },
      {
        name: 'Synthetic market data',
        quality: 'Partial',
        accepted: 124,
        rejected: 3,
        ageMinutes: 11,
      },
    ],
    evidenceHash: '98f7f45508624115bf94b73ea13c403e64113d85f62ea781bb1cd8b902e7b41c',
  };
}
