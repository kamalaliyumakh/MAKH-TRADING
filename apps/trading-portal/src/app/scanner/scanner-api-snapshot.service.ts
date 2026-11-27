import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ScannerRunView } from './scanner-snapshot.service';

interface PersistedScannerCandidate {
  readonly securityId: string;
  readonly symbol: string;
  readonly rank: number | null;
  readonly qualified: boolean;
  readonly extremeMoveRisk: boolean;
  readonly price: number | null;
  readonly gainPercent: number | null;
  readonly relativeVolume: number | null;
  readonly publicFloat: number | null;
  readonly spreadPercent: number | null;
  readonly dollarVolume: number | null;
  readonly exclusionReason: string;
}

interface PersistedScannerRun {
  readonly id: string;
  readonly presetVersionKey: string;
  readonly asOf: string;
  readonly inputSnapshotHash: string;
  readonly dataQuality: 'Complete' | 'Partial' | 'Failed';
  readonly streamSequence: number;
  readonly candidates: readonly PersistedScannerCandidate[];
}

export interface ScannerRecoverySnapshot {
  readonly run: ScannerRunView;
  readonly streamSequence: number;
}

export abstract class ScannerRecoverySource {
  abstract loadLatest(): Promise<ScannerRecoverySnapshot>;
}

@Injectable({ providedIn: 'root' })
export class ScannerApiSnapshotService extends ScannerRecoverySource {
  private readonly http = inject(HttpClient);

  override async loadLatest(): Promise<ScannerRecoverySnapshot> {
    const response = await firstValueFrom(
      this.http.get<PersistedScannerRun>('/api/v1/scanner/snapshot', { withCredentials: true }),
    );
    if (!Number.isSafeInteger(response.streamSequence) || response.streamSequence <= 0)
      throw new Error('Scanner snapshot sequence is invalid.');

    const [presetName, presetVersionText = '1'] = response.presetVersionKey.split(':');
    return {
      streamSequence: response.streamSequence,
      run: {
        runId: response.id,
        presetName,
        presetVersion: Number.parseInt(presetVersionText, 10) || 1,
        calculationVersion: response.presetVersionKey,
        asOf: response.asOf,
        snapshotHash: response.inputSnapshotHash,
        quality: response.dataQuality,
        candidates: response.candidates.map((candidate) => ({
          securityId: candidate.securityId,
          symbol: candidate.symbol,
          rank: candidate.rank,
          state: candidate.qualified ? 'Qualified' : 'Excluded',
          price: candidate.price,
          gainPercent: candidate.gainPercent,
          relativeVolume: candidate.relativeVolume,
          publicFloat: candidate.publicFloat,
          spreadPercent: candidate.spreadPercent,
          dollarVolume: candidate.dollarVolume,
          extremeMoveRisk: candidate.extremeMoveRisk,
          exclusionReason: candidate.exclusionReason,
        })),
      },
    };
  }
}
