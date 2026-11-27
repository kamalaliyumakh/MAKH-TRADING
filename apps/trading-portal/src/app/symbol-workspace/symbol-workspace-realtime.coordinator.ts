import { Injectable, Injector, inject } from '@angular/core';
import { ScannerRecoverySource } from '../scanner/scanner-api-snapshot.service';
import { ScannerDelta } from '../scanner/scanner-realtime.service';
import {
  SCANNER_REALTIME_ENABLED,
  ScannerTransport,
  ScannerTransportCallbacks,
} from '../scanner/scanner-signalr.transport';
import { SymbolWorkspaceService } from './symbol-workspace.service';

@Injectable({ providedIn: 'root' })
export class SymbolWorkspaceRealtimeCoordinator {
  private readonly enabled = inject(SCANNER_REALTIME_ENABLED);
  private readonly injector = inject(Injector);
  private readonly workspace = inject(SymbolWorkspaceService);
  private transport: ScannerTransport | null = null;
  private symbol = '';
  private sequence: number | null = null;
  private started = false;
  private recoveryGeneration = 0;

  async start(symbol: string): Promise<void> {
    if (this.started) return;
    this.started = true;
    this.symbol = symbol.trim().toUpperCase();
    if (!this.enabled) {
      await this.workspace.load(this.symbol);
      return;
    }

    this.transport = this.injector.get(ScannerTransport);
    const callbacks: ScannerTransportCallbacks = {
      delta: (delta) => this.receive(delta),
      reconnecting: () =>
        this.workspace.suspend(
          'Stale',
          'Live updates were interrupted. Workspace content is hidden until recovery completes.',
        ),
      reconnected: () => void this.recover('Connection restored; recovering the latest snapshot.'),
      closed: () =>
        this.workspace.suspend(
          'Stale',
          'Live updates are disconnected. Workspace content is hidden until recovery completes.',
        ),
    };

    try {
      await this.transport.start(callbacks);
      await this.recover('Loading the authoritative scanner sequence and symbol snapshot.');
    } catch (error) {
      this.fail(error, 'Real-time workspace startup failed.');
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
      void this.recover('An incompatible update was rejected; recovering the latest snapshot.');
      return;
    }
    if (delta.sequence <= this.sequence) return;
    if (delta.sequence !== this.sequence + 1) {
      void this.recover(
        `Sequence gap detected after ${this.sequence}; recovering the latest snapshot.`,
      );
      return;
    }

    this.sequence = delta.sequence;
    const securityId = this.workspace.workspace()?.securityId;
    const affectsSymbol = delta.upserts.some((candidate) => candidate.symbol === this.symbol);
    const removesSecurity = securityId ? delta.removals.includes(securityId) : false;
    if (affectsSymbol || removesSecurity) void this.workspace.load(this.symbol);
  }

  private async recover(message: string): Promise<void> {
    const generation = ++this.recoveryGeneration;
    this.workspace.suspend('Loading', message);
    try {
      const snapshot = await this.injector.get(ScannerRecoverySource).loadLatest();
      if (!this.started || generation !== this.recoveryGeneration) return;
      this.sequence = snapshot.streamSequence;
      await this.workspace.load(this.symbol);
    } catch (error) {
      if (this.started && generation === this.recoveryGeneration)
        this.fail(error, 'Authoritative workspace recovery failed.');
    }
  }

  private fail(error: unknown, fallback: string): void {
    if (this.isAccessDenied(error)) {
      this.workspace.suspend('Denied', 'Your session cannot recover this workspace.');
    } else {
      this.workspace.suspend('Unavailable', `${fallback} No market or evidence data is shown.`);
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
