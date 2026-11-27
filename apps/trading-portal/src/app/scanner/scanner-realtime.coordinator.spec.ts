import { TestBed } from '@angular/core/testing';
import { ScannerRealtimeCoordinator } from './scanner-realtime.coordinator';
import { ScannerRealtimeService, ScannerDelta } from './scanner-realtime.service';
import { ScannerRecoverySnapshot, ScannerRecoverySource } from './scanner-api-snapshot.service';
import {
  SCANNER_REALTIME_ENABLED,
  ScannerTransport,
  ScannerTransportCallbacks,
} from './scanner-signalr.transport';

describe('ScannerRealtimeCoordinator', () => {
  let coordinator: ScannerRealtimeCoordinator;
  let realtime: ScannerRealtimeService;
  let transport: FakeTransport;
  let recovery: FakeRecovery;

  beforeEach(() => {
    transport = new FakeTransport();
    recovery = new FakeRecovery();
    TestBed.configureTestingModule({
      providers: [
        { provide: SCANNER_REALTIME_ENABLED, useValue: true },
        { provide: ScannerTransport, useValue: transport },
        { provide: ScannerRecoverySource, useValue: recovery },
      ],
    });
    coordinator = TestBed.inject(ScannerRealtimeCoordinator);
    realtime = TestBed.inject(ScannerRealtimeService);
  });

  it('subscribes and replaces synthetic state with an authoritative initial snapshot', async () => {
    await coordinator.start();

    expect(transport.startCalls).toBe(1);
    expect(recovery.calls).toBe(1);
    expect(realtime.state()).toBe('Connected');
    expect(realtime.lastSequence()).toBe(300);
    expect(realtime.run().runId).toBe('authoritative-run');
    expect(realtime.availability()).toBe('Empty');
  });

  it('recovers from a sequence gap before accepting more deltas', async () => {
    await coordinator.start();
    transport.emitDelta(delta(303));
    await Promise.resolve();

    expect(recovery.calls).toBe(2);
    expect(realtime.state()).toBe('Connected');
    expect(realtime.lastSequence()).toBe(300);
  });

  it('requires snapshot replacement after reconnection', async () => {
    await coordinator.start();
    transport.reconnecting();
    expect(realtime.state()).toBe('Reconnecting');

    transport.reconnected();
    await Promise.resolve();

    expect(recovery.calls).toBe(2);
    expect(realtime.state()).toBe('Connected');
  });

  it('remains stale when reconnect snapshot recovery fails', async () => {
    await coordinator.start();
    recovery.fail = true;
    transport.reconnected();
    await Promise.resolve();

    expect(realtime.state()).toBe('Stale');
    expect(realtime.recoveryReason()).toContain('snapshot recovery failed');
  });

  it('fails closed when authoritative snapshot access is denied', async () => {
    recovery.errorStatus = 403;
    await coordinator.start();

    expect(realtime.state()).toBe('Stale');
    expect(realtime.availability()).toBe('Denied');
    expect(realtime.recoveryReason()).toContain('not authorized');
  });

  function delta(sequence: number): ScannerDelta {
    return {
      eventId: `event-${sequence}`,
      eventType: 'scanner.updated',
      schemaVersion: 1,
      stream: 'scanner:account:11111111111111111111111111111111',
      sequence,
      runId: `run-${sequence}`,
      supersedesRunId: null,
      correctionReason: null,
      asOf: '2026-09-16T12:00:00Z',
      upserts: [],
      removals: [],
    };
  }
});

class FakeTransport extends ScannerTransport {
  callbacks: ScannerTransportCallbacks | null = null;
  startCalls = 0;

  override async start(callbacks: ScannerTransportCallbacks): Promise<void> {
    this.callbacks = callbacks;
    this.startCalls++;
  }

  override async stop(): Promise<void> {}
  emitDelta(delta: ScannerDelta): void {
    this.callbacks?.delta(delta);
  }
  reconnecting(): void {
    this.callbacks?.reconnecting();
  }
  reconnected(): void {
    this.callbacks?.reconnected();
  }
}

class FakeRecovery extends ScannerRecoverySource {
  calls = 0;
  fail = false;
  errorStatus: number | null = null;

  override async loadLatest(): Promise<ScannerRecoverySnapshot> {
    this.calls++;
    if (this.errorStatus) throw { status: this.errorStatus };
    if (this.fail) throw new Error('unavailable');
    return {
      streamSequence: 300,
      run: {
        runId: 'authoritative-run',
        presetName: 'Low float momentum',
        presetVersion: 1,
        calculationVersion: 'dddd:1',
        asOf: '2026-09-16T12:00:00Z',
        snapshotHash: 'a'.repeat(64),
        quality: 'Complete',
        candidates: [],
      },
    };
  }
}
