import { TestBed } from '@angular/core/testing';
import { ScannerRealtimeService, ScannerDelta } from './scanner-realtime.service';

describe('ScannerRealtimeService', () => {
  let service: ScannerRealtimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScannerRealtimeService);
  });

  function delta(sequence: number): ScannerDelta {
    return {
      eventId: `event-${sequence}`,
      eventType: 'scanner.updated',
      schemaVersion: 1,
      stream: 'scanner:synthetic:low-float-momentum',
      sequence,
      runId: service.run().runId,
      supersedesRunId: null,
      correctionReason: null,
      asOf: `2026-08-12T15:00:${sequence - 200}.000Z`,
      upserts: [{ ...service.run().candidates[1], price: 4.48 }],
      removals: [],
    };
  }

  it('applies the next sequenced delta', () => {
    expect(service.applyDelta(delta(205))).toBe('Applied');
    expect(service.lastSequence()).toBe(205);
    expect(service.run().candidates.find((candidate) => candidate.symbol === 'SYNA')?.price).toBe(
      4.48,
    );
  });

  it('ignores duplicate delivery without changing state', () => {
    expect(service.applyDelta(delta(204))).toBe('Duplicate');
    expect(service.state()).toBe('Connected');
  });

  it('marks the view for recovery when a sequence gap occurs', () => {
    expect(service.applyDelta(delta(207))).toBe('RecoveryRequired');
    expect(service.state()).toBe('Recovering');
    expect(service.recoveryReason()).toContain('Sequence gap');
  });

  it('stops applying deltas while recovery is required', () => {
    service.applyDelta(delta(207));
    expect(service.applyDelta(delta(205))).toBe('RecoveryRequired');
    expect(service.lastSequence()).toBe(204);
  });

  it('requires an authoritative snapshot after reconnect', () => {
    service.connectionLost();
    expect(service.state()).toBe('Reconnecting');
    service.connectionRestored();
    expect(service.state()).toBe('Recovering');
  });

  it('resumes only after a valid snapshot replacement', () => {
    service.connectionLost();
    service.connectionRestored();
    service.replaceFromSnapshot(service.run(), 300);
    expect(service.state()).toBe('Connected');
    expect(service.lastSequence()).toBe(300);
    expect(service.recoveryReason()).toBe('');
  });

  it('remains stale when snapshot recovery fails', () => {
    service.connectionLost();
    service.recoveryFailed('Synthetic snapshot unavailable.');
    expect(service.state()).toBe('Stale');
    expect(service.isFresh()).toBe(false);
  });

  it('models loading, denied and failed availability without exposing readiness', () => {
    service.beginInitialLoad();
    expect(service.availability()).toBe('Loading');

    service.accessDenied();
    expect(service.availability()).toBe('Denied');
    expect(service.isFresh()).toBe(false);

    service.beginInitialLoad();
    service.initialLoadFailed();
    expect(service.availability()).toBe('Failed');
    expect(service.isFresh()).toBe(false);
  });

  it('applies an append-only correction against the current run and removes omitted securities', () => {
    const current = service.run();
    const removed = current.candidates[0];
    const correction: ScannerDelta = {
      ...delta(205),
      runId: 'corrected-run',
      supersedesRunId: current.runId,
      correctionReason: 'Vendor corrected the source snapshot.',
      upserts: [{ ...current.candidates[1], price: 4.48 }],
      removals: [removed.securityId],
    };

    expect(service.applyDelta(correction)).toBe('Applied');
    expect(service.run().runId).toBe('corrected-run');
    expect(service.correctionReason()).toBe('Vendor corrected the source snapshot.');
    expect(
      service.run().candidates.some((candidate) => candidate.securityId === removed.securityId),
    ).toBe(false);
  });

  it('clears correction evidence only after authoritative snapshot replacement', () => {
    const current = service.run();
    service.applyDelta({
      ...delta(205),
      runId: 'corrected-run',
      supersedesRunId: current.runId,
      correctionReason: 'Vendor correction.',
    });
    expect(service.correctionReason()).toBe('Vendor correction.');

    service.replaceFromSnapshot(service.run(), 300);
    expect(service.correctionReason()).toBe('');
  });

  it('requires recovery for mismatched correction lineage or ambiguous deltas', () => {
    expect(
      service.applyDelta({
        ...delta(205),
        supersedesRunId: 'wrong-base-run',
        correctionReason: 'Correction',
      }),
    ).toBe('RecoveryRequired');

    service.replaceFromSnapshot(service.run(), 204);
    const candidate = service.run().candidates[0];
    expect(
      service.applyDelta({
        ...delta(205),
        upserts: [candidate],
        removals: [candidate.securityId],
      }),
    ).toBe('RecoveryRequired');
  });
});
