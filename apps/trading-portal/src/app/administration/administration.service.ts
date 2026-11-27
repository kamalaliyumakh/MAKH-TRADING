import { Injectable } from '@angular/core';

export interface AdministrationSnapshot {
  readonly snapshotId: string;
  readonly generatedAt: string;
  readonly access: readonly {
    readonly role: string;
    readonly scope: string;
    readonly users: number;
    readonly review: 'Current' | 'Due soon';
    readonly coverage: number;
  }[];
  readonly configurations: readonly {
    readonly name: string;
    readonly version: string;
    readonly state: 'Configured' | 'Unavailable' | 'Draft';
    readonly detail: string;
  }[];
  readonly audit: readonly {
    readonly sequence: number;
    readonly action: string;
    readonly actor: string;
    readonly at: string;
    readonly result: 'Applied' | 'Denied';
    readonly reason: string;
  }[];
}

@Injectable({ providedIn: 'root' })
export class AdministrationService {
  readonly snapshot: AdministrationSnapshot = {
    snapshotId: 'synthetic-admin-20260820-01',
    generatedAt: '2026-08-20T15:20:00Z',
    access: [
      {
        role: 'Operations administrator',
        scope: 'Provider and calendar configuration',
        users: 2,
        review: 'Current',
        coverage: 100,
      },
      {
        role: 'Risk administrator',
        scope: 'Risk-policy lifecycle only',
        users: 1,
        review: 'Due soon',
        coverage: 82,
      },
      {
        role: 'Auditor',
        scope: 'Read-only diagnostics and evidence',
        users: 2,
        review: 'Current',
        coverage: 100,
      },
    ],
    configurations: [
      {
        name: 'Identity directory',
        version: 'Not connected',
        state: 'Unavailable',
        detail: 'User lifecycle and revocation unavailable',
      },
      {
        name: 'Market calendar',
        version: 'synthetic-cal-v2',
        state: 'Configured',
        detail: 'Illustrative U.S. session calendar',
      },
      {
        name: 'Market provider',
        version: 'provider-draft-v1',
        state: 'Draft',
        detail: 'Safe reference only; no credential material',
      },
      {
        name: 'Risk policy',
        version: 'synthetic-risk-v1',
        state: 'Configured',
        detail: 'Read-only policy metadata',
      },
    ],
    audit: [
      {
        sequence: 104,
        action: 'Provider reference reviewed',
        actor: 'Synthetic operator',
        at: '2026-08-20T15:02:00Z',
        result: 'Applied',
        reason: 'Quarterly configuration review',
      },
      {
        sequence: 103,
        action: 'Risk policy mutation',
        actor: 'Synthetic operator',
        at: '2026-08-20T14:41:00Z',
        result: 'Denied',
        reason: 'Role lacks risk-policy permission',
      },
      {
        sequence: 102,
        action: 'Calendar version reviewed',
        actor: 'Synthetic operator',
        at: '2026-08-20T13:26:00Z',
        result: 'Applied',
        reason: 'Session-boundary verification',
      },
    ],
  };
}
