import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScannerRecoverySource } from '../scanner/scanner-api-snapshot.service';
import { ScannerDelta } from '../scanner/scanner-realtime.service';
import {
  SCANNER_REALTIME_ENABLED,
  ScannerTransport,
  ScannerTransportCallbacks,
} from '../scanner/scanner-signalr.transport';
import { SymbolWorkspaceRealtimeCoordinator } from './symbol-workspace-realtime.coordinator';
import { SymbolWorkspaceService } from './symbol-workspace.service';

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
  sequence = 40;
  error: unknown = null;

  override async loadLatest() {
    this.calls++;
    if (this.error) throw this.error;
    return {
      streamSequence: this.sequence,
      run: {
        runId: 'run-40',
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

class FakeWorkspace {
  readonly workspace = signal<{ securityId: string } | null>({
    securityId: '91000000-0000-0000-0000-000000000001',
  });
  readonly loads: string[] = [];
  readonly suspensions: { state: string; message: string }[] = [];

  async load(symbol: string): Promise<void> {
    this.loads.push(symbol);
  }

  suspend(state: string, message: string): void {
    this.workspace.set(null);
    this.suspensions.push({ state, message });
  }
}

describe('SymbolWorkspaceRealtimeCoordinator', () => {
  let coordinator: SymbolWorkspaceRealtimeCoordinator;
  let transport: FakeTransport;
  let recovery: FakeRecovery;
  let workspace: FakeWorkspace;

  beforeEach(() => {
    transport = new FakeTransport();
    recovery = new FakeRecovery();
    workspace = new FakeWorkspace();
    TestBed.configureTestingModule({
      providers: [
        SymbolWorkspaceRealtimeCoordinator,
        { provide: SCANNER_REALTIME_ENABLED, useValue: true },
        { provide: ScannerTransport, useValue: transport },
        { provide: ScannerRecoverySource, useValue: recovery },
        { provide: SymbolWorkspaceService, useValue: workspace },
      ],
    });
    coordinator = TestBed.inject(SymbolWorkspaceRealtimeCoordinator);
  });

  afterEach(async () => coordinator.stop());

  it('establishes an authoritative sequence before loading the symbol snapshot', async () => {
    await coordinator.start('synb');
    expect(transport.starts).toBe(1);
    expect(recovery.calls).toBe(1);
    expect(workspace.loads).toEqual(['SYNB']);
    expect(workspace.suspensions.at(-1)?.message).toContain('authoritative scanner sequence');
  });

  it('reloads the symbol snapshot for the next relevant update', async () => {
    await coordinator.start('SYNB');
    transport.callbacks?.delta(delta(41, 'SYNB'));
    await Promise.resolve();
    expect(workspace.loads).toEqual(['SYNB', 'SYNB']);
    expect(recovery.calls).toBe(1);
  });

  it('recovers from a sequence gap before accepting more updates', async () => {
    await coordinator.start('SYNB');
    recovery.sequence = 45;
    transport.callbacks?.delta(delta(44, 'SYNB'));
    await Promise.resolve();
    await Promise.resolve();
    expect(recovery.calls).toBe(2);
    expect(workspace.loads).toEqual(['SYNB', 'SYNB']);
    expect(workspace.suspensions.some((item) => item.message.includes('Sequence gap'))).toBe(true);
  });

  it('hides content while disconnected and recovers after reconnect', async () => {
    await coordinator.start('SYNB');
    transport.callbacks?.reconnecting();
    expect(workspace.suspensions.at(-1)?.state).toBe('Stale');
    expect(workspace.suspensions.at(-1)?.message).toContain('hidden');
    transport.callbacks?.reconnected();
    await Promise.resolve();
    await Promise.resolve();
    expect(recovery.calls).toBe(2);
  });

  it('fails closed when authoritative recovery is denied', async () => {
    recovery.error = { status: 403 };
    await coordinator.start('SYNB');
    expect(workspace.loads).toEqual([]);
    expect(workspace.suspensions.at(-1)).toEqual({
      state: 'Denied',
      message: 'Your session cannot recover this workspace.',
    });
  });

  function delta(sequence: number, symbol: string): ScannerDelta {
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
      removals: [],
      upserts: [
        {
          securityId: '91000000-0000-0000-0000-000000000001',
          symbol,
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
      ],
    };
  }
});
