import { Injectable } from '@angular/core';

export interface JournalEntryView {
  readonly id: string;
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

@Injectable({ providedIn: 'root' })
export class JournalService {
  readonly snapshotId = 'synthetic-journal-20260820-01';
  readonly asOf = '2026-08-20T14:30:00Z';
  readonly entries: readonly JournalEntryView[] = [
    {
      id: 'journal-004',
      symbol: 'SYNB',
      side: 'Long',
      state: 'Draft',
      openedAt: '2026-08-20T13:45:00Z',
      thesis:
        'Synthetic continuation study after elevated relative volume; catalyst remains unverified.',
      outcome: 'Awaiting outcome review',
      resultPercent: null,
      tags: ['momentum', 'extreme-move'],
      evidenceCount: 3,
    },
    {
      id: 'journal-003',
      symbol: 'SYNA',
      side: 'Long',
      state: 'Reviewed',
      openedAt: '2026-08-19T15:10:00Z',
      thesis: 'Synthetic liquidity and breakout-discipline study.',
      outcome: 'Exit discipline followed; spread widened into the close.',
      resultPercent: 3.8,
      tags: ['breakout', 'process-win'],
      evidenceCount: 4,
    },
    {
      id: 'journal-002',
      symbol: 'SYNC',
      side: 'Long',
      state: 'Reviewed',
      openedAt: '2026-08-18T14:05:00Z',
      thesis: 'Synthetic pullback entry study with predefined invalidation.',
      outcome: 'Invalidation respected after volume faded.',
      resultPercent: -1.7,
      tags: ['pullback', 'risk-control'],
      evidenceCount: 2,
    },
    {
      id: 'journal-001',
      symbol: 'SYND',
      side: 'Long',
      state: 'Archived',
      openedAt: '2026-08-15T13:32:00Z',
      thesis: 'Synthetic opening-range observation.',
      outcome: 'No follow-through; archived after review.',
      resultPercent: 0.6,
      tags: ['opening-range'],
      evidenceCount: 2,
    },
  ];
}
