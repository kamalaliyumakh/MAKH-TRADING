import { Injectable } from '@angular/core';

export type HealthState = 'Available' | 'Degraded' | 'Unavailable';

export interface DashboardSnapshot {
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
    readonly buyingPower: number | null;
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
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  readonly snapshot: DashboardSnapshot = {
    snapshotId: 'synthetic-dashboard-20260812-1500',
    asOf: '2026-08-12T15:00:00Z',
    mode: 'PAPER',
    accountLabel: 'Synthetic account · no broker connection',
    entryState: 'Locked',
    entryReason: 'Risk, broker and reconciliation authorities are not connected.',
    pnl: {
      realized: 42,
      unrealized: -18,
      total: 24,
      asOf: '2026-08-12T15:00:00Z',
      authority: 'Synthetic estimate',
    },
    risk: {
      policyVersion: 'synthetic-risk-policy-v1',
      dailyLossLimit: 200,
      consumedLossCapacity: 50,
      remainingLossCapacity: 150,
      openRisk: 0,
      buyingPower: null,
    },
    dependencies: [
      {
        name: 'Market data',
        state: 'Available',
        ageSeconds: 35,
        effect: 'Synthetic quote snapshot current.',
      },
      {
        name: 'Evidence',
        state: 'Available',
        ageSeconds: 62,
        effect: 'Synthetic evidence snapshot current.',
      },
      {
        name: 'Risk service',
        state: 'Unavailable',
        ageSeconds: null,
        effect: 'New entries remain blocked.',
      },
      {
        name: 'Broker',
        state: 'Unavailable',
        ageSeconds: null,
        effect: 'Orders and account truth unavailable.',
      },
      {
        name: 'Reconciliation',
        state: 'Unavailable',
        ageSeconds: null,
        effect: 'No authoritative position or order state.',
      },
    ],
    activity: { openPositions: 0, workingOrders: 0, reconciliationState: 'Not connected' },
    alerts: [
      {
        id: 'entry-lock',
        severity: 'Critical',
        title: 'New entries are locked',
        guidance: 'Do not create or submit an order.',
      },
      {
        id: 'broker-offline',
        severity: 'Warning',
        title: 'Broker state unavailable',
        guidance: 'Balances, positions and orders are not authoritative.',
      },
      {
        id: 'synthetic-only',
        severity: 'Information',
        title: 'Synthetic dashboard fixture',
        guidance: 'Values demonstrate layout and controls only.',
      },
    ],
    candidates: [
      {
        symbol: 'SYNB',
        gainPercent: 159,
        relativeVolume: 4.2,
        riskLabel: 'Extreme move · elevated risk',
      },
      {
        symbol: 'SYNA',
        gainPercent: 68,
        relativeVolume: 3.4,
        riskLabel: 'Review evidence and liquidity',
      },
    ],
  };
}
