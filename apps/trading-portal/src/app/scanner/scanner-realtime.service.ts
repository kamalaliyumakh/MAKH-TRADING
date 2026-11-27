import { Injectable, computed, inject, signal } from '@angular/core';
import {
  ScannerCandidateView,
  ScannerRunView,
  ScannerSnapshotService,
} from './scanner-snapshot.service';

export type RealtimeState = 'Connected' | 'Reconnecting' | 'Recovering' | 'Stale';
export type ScannerAvailability = 'Ready' | 'Loading' | 'Empty' | 'Denied' | 'Failed';
export type DeltaResult = 'Applied' | 'Duplicate' | 'RecoveryRequired';

export interface ScannerDelta {
  readonly eventId: string;
  readonly eventType: 'scanner.updated';
  readonly schemaVersion: 1;
  readonly stream: string;
  readonly sequence: number;
  readonly runId: string;
  readonly supersedesRunId: string | null;
  readonly correctionReason: string | null;
  readonly asOf: string;
  readonly upserts: readonly ScannerCandidateView[];
  readonly removals: readonly string[];
}

@Injectable({ providedIn: 'root' })
export class ScannerRealtimeService {
  private readonly snapshots = inject(ScannerSnapshotService);
  private readonly snapshotState = signal(this.snapshots.currentRun);
  private readonly connectionState = signal<RealtimeState>('Connected');
  private readonly appliedSequence = signal(204);
  private readonly recoveryReasonState = signal('');
  private readonly correctionReasonState = signal('');
  private readonly availabilityState = signal<ScannerAvailability>('Ready');

  readonly run = this.snapshotState.asReadonly();
  readonly state = this.connectionState.asReadonly();
  readonly lastSequence = this.appliedSequence.asReadonly();
  readonly recoveryReason = this.recoveryReasonState.asReadonly();
  readonly correctionReason = this.correctionReasonState.asReadonly();
  readonly availability = this.availabilityState.asReadonly();
  readonly isFresh = computed(() => this.connectionState() === 'Connected');

  applyDelta(delta: ScannerDelta): DeltaResult {
    if (!this.isCompatible(delta) || this.connectionState() !== 'Connected') {
      this.requireRecovery('The update could not be safely reconciled.');
      return 'RecoveryRequired';
    }

    const lastSequence = this.appliedSequence();
    if (delta.sequence <= lastSequence) return 'Duplicate';
    if (delta.sequence !== lastSequence + 1) {
      this.requireRecovery(`Sequence gap detected after ${lastSequence}.`);
      return 'RecoveryRequired';
    }

    const removals = new Set(delta.removals);
    const candidates = new Map(
      this.snapshotState()
        .candidates.filter((candidate) => !removals.has(candidate.securityId))
        .map((candidate) => [candidate.securityId, candidate]),
    );
    for (const candidate of delta.upserts) candidates.set(candidate.securityId, candidate);

    this.snapshotState.update((run) => ({
      ...run,
      runId: delta.runId,
      asOf: delta.asOf,
      candidates: this.orderCandidates([...candidates.values()]),
    }));
    this.availabilityState.set(candidates.size === 0 ? 'Empty' : 'Ready');
    if (delta.correctionReason) this.correctionReasonState.set(delta.correctionReason);
    this.appliedSequence.set(delta.sequence);
    return 'Applied';
  }

  connectionLost(): void {
    this.connectionState.set('Reconnecting');
    this.recoveryReasonState.set('Connection interrupted; displayed values may be stale.');
  }

  beginInitialLoad(): void {
    this.availabilityState.set('Loading');
    this.recoveryReasonState.set('Loading the authoritative scanner snapshot.');
  }

  accessDenied(): void {
    this.availabilityState.set('Denied');
    this.connectionState.set('Stale');
    this.recoveryReasonState.set('Scanner access is not authorized for this account.');
  }

  initialLoadFailed(): void {
    this.availabilityState.set('Failed');
    this.connectionState.set('Stale');
    this.recoveryReasonState.set('Scanner evidence is unavailable; retry is required.');
  }

  connectionRestored(): void {
    this.requireRecovery('Connection restored; authoritative snapshot required.');
  }

  replaceFromSnapshot(snapshot: ScannerRunView, streamSequence: number): void {
    if (!Number.isSafeInteger(streamSequence) || streamSequence < 0) {
      this.requireRecovery('Snapshot sequence was invalid.');
      return;
    }
    this.snapshotState.set(snapshot);
    this.appliedSequence.set(streamSequence);
    this.recoveryReasonState.set('');
    this.correctionReasonState.set('');
    this.availabilityState.set(snapshot.candidates.length === 0 ? 'Empty' : 'Ready');
    this.connectionState.set('Connected');
  }

  recoveryFailed(reason = 'Snapshot recovery failed; retry is required.'): void {
    if (this.availabilityState() === 'Loading') this.availabilityState.set('Failed');
    this.connectionState.set('Stale');
    this.recoveryReasonState.set(reason);
  }

  private isCompatible(delta: ScannerDelta): boolean {
    const correctionMetadataValid =
      (delta.supersedesRunId === null && delta.correctionReason === null) ||
      (delta.supersedesRunId !== null &&
        delta.supersedesRunId === this.snapshotState().runId &&
        typeof delta.correctionReason === 'string' &&
        delta.correctionReason.trim().length > 0 &&
        delta.correctionReason.length <= 500);
    const upsertIds = delta.upserts.map((candidate) => candidate.securityId);
    const removalIds = delta.removals;
    return (
      delta.eventType === 'scanner.updated' &&
      delta.schemaVersion === 1 &&
      (delta.stream === 'scanner:synthetic:low-float-momentum' ||
        delta.stream.startsWith('scanner:account:')) &&
      delta.runId.length > 0 &&
      Number.isSafeInteger(delta.sequence) &&
      delta.sequence >= 0 &&
      correctionMetadataValid &&
      new Set(upsertIds).size === upsertIds.length &&
      new Set(removalIds).size === removalIds.length &&
      !upsertIds.some((securityId) => removalIds.includes(securityId))
    );
  }

  private requireRecovery(reason: string): void {
    this.connectionState.set('Recovering');
    this.recoveryReasonState.set(reason);
  }

  private orderCandidates(candidates: ScannerCandidateView[]): ScannerCandidateView[] {
    return candidates.sort((left, right) => {
      if (left.rank === null && right.rank !== null) return 1;
      if (left.rank !== null && right.rank === null) return -1;
      if (left.rank !== null && right.rank !== null && left.rank !== right.rank)
        return left.rank - right.rank;
      return left.securityId.localeCompare(right.securityId);
    });
  }
}
