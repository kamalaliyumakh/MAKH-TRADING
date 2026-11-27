import { Injectable, Injector, inject } from '@angular/core';
import { ScannerRecoverySource } from '../scanner/scanner-api-snapshot.service';
import { ScannerDelta } from '../scanner/scanner-realtime.service';
import {
  SCANNER_REALTIME_ENABLED,
  ScannerTransport,
  ScannerTransportCallbacks,
} from '../scanner/scanner-signalr.transport';
import { DashboardService } from './dashboard.service';

@Injectable({ providedIn: 'root' })
export class DashboardRealtimeCoordinator {
  private readonly enabled = inject(SCANNER_REALTIME_ENABLED);
  private readonly injector = inject(Injector);
  private readonly dashboard = inject(DashboardService);
  private transport: ScannerTransport | null = null;
  private sequence: number | null = null;
  private started = false;
  private recoveryGeneration = 0;

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    if (!this.enabled) {
      await this.dashboard.load();
      return;
    }

    this.transport = this.injector.get(ScannerTransport);
    const callbacks: ScannerTransportCallbacks = {
      delta: (delta) => this.receive(delta),
      reconnecting: () =>
        this.dashboard.suspend(
          'Stale',
          'Live updates were interrupted. Account information is hidden until recovery completes.',
        ),
      reconnected: () => void this.recover('Connection restored; recovering the latest dashboard.'),
      closed: () =>
        this.dashboard.suspend(
          'Stale',
          'Live updates are disconnected. Account information is hidden until recovery completes.',
        ),
    };

    try {
      await this.transport.start(callbacks);
      await this.recover('Loading the authoritative scanner sequence and dashboard snapshot.');
    } catch (error) {
      this.fail(error, 'Real-time dashboard startup failed.');
    }
  }

  async stop(): Promise<void> {
    if (!this.started) return;
    this.started = false;
    this.recoveryGeneration++;
    this.sequence = null;
    await this.transport?.stop();
    this.transport = null;
  }

  private receive(delta: ScannerDelta): void {
    if (!this.started || this.sequence === null) return;
    if (!this.isCompatible(delta)) {
      void this.recover('An incompatible update was rejected; recovering the latest dashboard.');
      return;
    }
    if (delta.sequence <= this.sequence) return;
    if (delta.sequence !== this.sequence + 1) {
      void this.recover(
        `Sequence gap detected after ${this.sequence}; recovering the latest dashboard.`,
      );
      return;
    }
    this.sequence = delta.sequence;
    void this.dashboard.load();
  }

  private async recover(message: string): Promise<void> {
    const generation = ++this.recoveryGeneration;
    this.dashboard.suspend('Loading', message);
    try {
      const snapshot = await this.injector.get(ScannerRecoverySource).loadLatest();
      if (!this.started || generation !== this.recoveryGeneration) return;
      this.sequence = snapshot.streamSequence;
      await this.dashboard.load();
    } catch (error) {
      if (this.started && generation === this.recoveryGeneration)
        this.fail(error, 'Authoritative dashboard recovery failed.');
    }
  }

  private fail(error: unknown, fallback: string): void {
    if (this.isAccessDenied(error)) {
      this.dashboard.suspend('Denied', 'Your session cannot recover this account dashboard.');
    } else {
      this.dashboard.suspend('Unavailable', `${fallback} No account information is shown.`);
    }
  }

  private isCompatible(delta: ScannerDelta): boolean {
    return (
      delta.eventType === 'scanner.updated' &&
      delta.schemaVersion === 1 &&
      Number.isSafeInteger(delta.sequence) &&
      delta.sequence > 0 &&
      (delta.stream === 'scanner:synthetic:low-float-momentum' ||
        delta.stream.startsWith('scanner:account:'))
    );
  }

  private isAccessDenied(error: unknown): boolean {
    if (typeof error !== 'object' || error === null || !('status' in error)) return false;
    const status = Number((error as { status: unknown }).status);
    return status === 401 || status === 403;
  }
}
