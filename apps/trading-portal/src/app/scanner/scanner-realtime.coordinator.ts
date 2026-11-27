import { Injectable, Injector, inject } from '@angular/core';
import { ScannerRealtimeService } from './scanner-realtime.service';
import { ScannerRecoverySource } from './scanner-api-snapshot.service';
import {
  SCANNER_REALTIME_ENABLED,
  ScannerTransport,
  ScannerTransportCallbacks,
} from './scanner-signalr.transport';

@Injectable({ providedIn: 'root' })
export class ScannerRealtimeCoordinator {
  private readonly enabled = inject(SCANNER_REALTIME_ENABLED);
  private readonly injector = inject(Injector);
  private readonly realtime = inject(ScannerRealtimeService);
  private transport: ScannerTransport | null = null;
  private started = false;
  private recoveryGeneration = 0;

  async start(): Promise<void> {
    if (!this.enabled || this.started) return;
    this.started = true;
    this.transport = this.injector.get(ScannerTransport);
    const callbacks: ScannerTransportCallbacks = {
      delta: (delta) => {
        if (this.realtime.applyDelta(delta) === 'RecoveryRequired') void this.recover();
      },
      reconnecting: () => this.realtime.connectionLost(),
      reconnected: () => {
        this.realtime.connectionRestored();
        void this.recover();
      },
      closed: () => this.realtime.connectionLost(),
    };

    try {
      this.realtime.beginInitialLoad();
      await this.transport.start(callbacks);
      this.realtime.connectionRestored();
      await this.recover(true);
    } catch (error) {
      if (this.isAccessDenied(error)) this.realtime.accessDenied();
      else this.realtime.initialLoadFailed();
    }
  }

  async stop(): Promise<void> {
    if (!this.started) return;
    this.started = false;
    this.recoveryGeneration++;
    await this.transport?.stop();
    this.transport = null;
  }

  private async recover(initial = false): Promise<void> {
    const generation = ++this.recoveryGeneration;
    try {
      const snapshot = await this.injector.get(ScannerRecoverySource).loadLatest();
      if (this.started && generation === this.recoveryGeneration)
        this.realtime.replaceFromSnapshot(snapshot.run, snapshot.streamSequence);
    } catch (error) {
      if (this.started && generation === this.recoveryGeneration) {
        if (this.isAccessDenied(error)) this.realtime.accessDenied();
        else if (initial) this.realtime.initialLoadFailed();
        else this.realtime.recoveryFailed('Authoritative scanner snapshot recovery failed.');
      }
    }
  }

  private isAccessDenied(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('status' in error)) return false;
    const status = Number((error as { status: unknown }).status);
    return status === 401 || status === 403;
  }
}
