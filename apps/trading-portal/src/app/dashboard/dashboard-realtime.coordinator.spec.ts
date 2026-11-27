import { TestBed } from '@angular/core/testing';
import { ScannerRecoverySource } from '../scanner/scanner-api-snapshot.service';
import { ScannerDelta } from '../scanner/scanner-realtime.service';
import {
  SCANNER_REALTIME_ENABLED,
  ScannerTransport,
  ScannerTransportCallbacks,
} from '../scanner/scanner-signalr.transport';
import { DashboardRealtimeCoordinator } from './dashboard-realtime.coordinator';
import { DashboardService } from './dashboard.service';

class FakeTransport extends ScannerTransport {
  callbacks?: ScannerTransportCallbacks;
  starts = 0;
  stops = 0;
  override async start(callbacks: ScannerTransportCallbacks): Promise<void> {
    this.starts++;
    this.callbacks = callbacks;
  }
  override async stop(): Promise<void> {
    this.stops++;
  }
}

class FakeRecovery extends ScannerRecoverySource {
  calls = 0;
  sequence = 70;
  error: unknown = null;
  override async loadLatest() {
    this.calls++;
    if (this.error) throw this.error;
    return {
      streamSequence: this.sequence,
      run: {
        runId: 'run-70',
        presetName: 'Low float momentum',
        presetVersion: 1,
        calculationVersion: 'v1',
        asOf: '2026-10-05T12:00:00Z',
        snapshotHash: 'a'.repeat(64),
        quality: 'Complete' as const,
        candidates: [],
      },
    };
  }
}

class FakeDashboard {
  loads = 0;
  suspensions: { state: string; message: string }[] = [];
  async load(): Promise<void> {
    this.loads++;
  }
  suspend(state: string, message: string): void {
    this.suspensions.push({ state, message });
  }
}

describe('DashboardRealtimeCoordinator', () => {
  let coordinator: DashboardRealtimeCoordinator;
  let transport: FakeTransport;
  let recovery: FakeRecovery;
  let dashboard: FakeDashboard;

  beforeEach(() => {
    transport = new FakeTransport();
    recovery = new FakeRecovery();
    dashboard = new FakeDashboard();
    TestBed.configureTestingModule({
      providers: [
        DashboardRealtimeCoordinator,
        { provide: SCANNER_REALTIME_ENABLED, useValue: true },
        { provide: ScannerTransport, useValue: transport },
        { provide: ScannerRecoverySource, useValue: recovery },
        { provide: DashboardService, useValue: dashboard },
      ],
    });
    coordinator = TestBed.inject(DashboardRealtimeCoordinator);
  });

  afterEach(async () => coordinator.stop());

  it('establishes an authoritative sequence before loading the dashboard', async () => {
    await coordinator.start();
    expect(transport.starts).toBe(1);
    expect(recovery.calls).toBe(1);
    expect(dashboard.loads).toBe(1);
    expect(dashboard.suspensions.at(-1)?.message).toContain('authoritative scanner sequence');
  });

  it('refreshes the dashboard for the next sequenced update and ignores duplicates', async () => {
    await coordinator.start();
    transport.callbacks?.delta(delta(71));
    transport.callbacks?.delta(delta(71));
    await Promise.resolve();
    expect(dashboard.loads).toBe(2);
    expect(recovery.calls).toBe(1);
  });

  it('recovers from a sequence gap before showing another snapshot', async () => {
    await coordinator.start();
    recovery.sequence = 75;
    transport.callbacks?.delta(delta(74));
    await Promise.resolve();
    await Promise.resolve();
    expect(recovery.calls).toBe(2);
    expect(dashboard.loads).toBe(2);
    expect(dashboard.suspensions.some((item) => item.message.includes('Sequence gap'))).toBe(true);
  });

  it('hides content while disconnected and recovers after reconnect', async () => {
    await coordinator.start();
    transport.callbacks?.reconnecting();
    expect(dashboard.suspensions.at(-1)?.state).toBe('Stale');
    expect(dashboard.suspensions.at(-1)?.message).toContain('hidden');
    transport.callbacks?.reconnected();
    await Promise.resolve();
    await Promise.resolve();
    expect(recovery.calls).toBe(2);
  });

  it('preserves denial when authoritative recovery is forbidden', async () => {
    recovery.error = { status: 403 };
    await coordinator.start();
    expect(dashboard.loads).toBe(0);
    expect(dashboard.suspensions.at(-1)).toEqual({
      state: 'Denied',
      message: 'Your session cannot recover this account dashboard.',
    });
  });

  function delta(sequence: number): ScannerDelta {
    return {
      eventId: `event-${sequence}`,
      eventType: 'scanner.updated',
      schemaVersion: 1,
      stream: 'scanner:account:00000000000000000000000000000001',
      sequence,
      runId: `run-${sequence}`,
      supersedesRunId: null,
      correctionReason: null,
      asOf: '2026-10-05T12:00:00Z',
      upserts: [],
      removals: [],
    };
  }
});
