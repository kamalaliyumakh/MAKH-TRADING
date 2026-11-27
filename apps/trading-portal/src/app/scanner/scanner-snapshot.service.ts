import { Injectable } from '@angular/core';

export type ScannerQuality = 'Complete' | 'Partial' | 'Failed';
export type CandidateState = 'Qualified' | 'Excluded';

export interface ScannerCandidateView {
  readonly securityId: string;
  readonly symbol: string;
  readonly rank: number | null;
  readonly state: CandidateState;
  readonly price: number | null;
  readonly gainPercent: number | null;
  readonly relativeVolume: number | null;
  readonly publicFloat: number | null;
  readonly spreadPercent: number | null;
  readonly dollarVolume: number | null;
  readonly extremeMoveRisk: boolean;
  readonly exclusionReason: string;
}

export interface ScannerRunView {
  readonly runId: string;
  readonly presetName: string;
  readonly presetVersion: number;
  readonly calculationVersion: string;
  readonly asOf: string;
  readonly snapshotHash: string;
  readonly quality: ScannerQuality;
  readonly candidates: readonly ScannerCandidateView[];
}

@Injectable({ providedIn: 'root' })
export class ScannerSnapshotService {
  readonly currentRun: ScannerRunView = {
    runId: 'synthetic-run-20260812-1500',
    presetName: 'Low float momentum',
    presetVersion: 1,
    calculationVersion: 'scanner-calculation-v1',
    asOf: '2026-08-12T15:00:00Z',
    snapshotHash: '7fc9e4e83113f7086e312ba091f5dc63387674f960063145903005fa69c6c6a8',
    quality: 'Partial',
    candidates: [
      {
        securityId: 'synthetic-001',
        symbol: 'SYNB',
        rank: 1,
        state: 'Qualified',
        price: 5.18,
        gainPercent: 159,
        relativeVolume: 4.2,
        publicFloat: 420_000,
        spreadPercent: 0.58,
        dollarVolume: 2_780_000,
        extremeMoveRisk: true,
        exclusionReason: '',
      },
      {
        securityId: 'synthetic-002',
        symbol: 'SYNA',
        rank: null,
        state: 'Excluded',
        price: 4.36,
        gainPercent: 68,
        relativeVolume: 3.4,
        publicFloat: 385_000,
        spreadPercent: 0.41,
        dollarVolume: 1_940_000,
        extremeMoveRisk: false,
        exclusionReason: 'Gain is outside the 100%–600% preset range.',
      },
      {
        securityId: 'synthetic-003',
        symbol: 'SYNC',
        rank: null,
        state: 'Excluded',
        price: 6.12,
        gainPercent: 112,
        relativeVolume: 2.6,
        publicFloat: 490_000,
        spreadPercent: 1.16,
        dollarVolume: 1_310_000,
        extremeMoveRisk: true,
        exclusionReason: 'Relative volume is below the 3× preset minimum.',
      },
      {
        securityId: 'synthetic-004',
        symbol: 'SYND',
        rank: null,
        state: 'Excluded',
        price: null,
        gainPercent: null,
        relativeVolume: null,
        publicFloat: 310_000,
        spreadPercent: null,
        dollarVolume: null,
        extremeMoveRisk: false,
        exclusionReason: 'Required market input is stale; qualification stopped.',
      },
    ],
  };
}
