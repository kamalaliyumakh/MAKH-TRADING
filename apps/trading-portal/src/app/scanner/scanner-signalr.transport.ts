import { Injectable, InjectionToken } from '@angular/core';
import type { HubConnection } from '@microsoft/signalr';
import { ScannerDelta } from './scanner-realtime.service';

interface ScannerEventEnvelope {
  readonly eventId: string;
  readonly eventType: 'scanner.updated';
  readonly schemaVersion: 1;
  readonly stream: string;
  readonly sequence: number;
  readonly occurredAt: string;
  readonly publishedAt: string;
  readonly payload: {
    readonly runId: string;
    readonly supersedesRunId: string | null;
    readonly correctionReason: string | null;
    readonly asOf: string;
    readonly upserts: readonly {
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
    }[];
    readonly removals: readonly string[];
  };
}

export interface ScannerTransportCallbacks {
  readonly delta: (delta: ScannerDelta) => void;
  readonly reconnecting: () => void;
  readonly reconnected: () => void;
  readonly closed: () => void;
}

export abstract class ScannerTransport {
  abstract start(callbacks: ScannerTransportCallbacks): Promise<void>;
  abstract stop(): Promise<void>;
}

export const SCANNER_REALTIME_ENABLED = new InjectionToken<boolean>('SCANNER_REALTIME_ENABLED', {
  providedIn: 'root',
  factory: () => false,
});

@Injectable({ providedIn: 'root' })
export class ScannerSignalRTransport extends ScannerTransport {
  private connection: HubConnection | null = null;

  override async start(callbacks: ScannerTransportCallbacks): Promise<void> {
    if (this.connection) return;
    const { HubConnectionBuilder, LogLevel } = await import('@microsoft/signalr');
    const connection = new HubConnectionBuilder()
      .withUrl('/hubs/trading-v1', { withCredentials: true })
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000])
      .configureLogging(LogLevel.Warning)
      .build();

    connection.on('scanner.updated', (envelope: ScannerEventEnvelope) =>
      callbacks.delta({
        eventId: envelope.eventId,
        eventType: envelope.eventType,
        schemaVersion: envelope.schemaVersion,
        stream: envelope.stream,
        sequence: envelope.sequence,
        runId: envelope.payload.runId,
        supersedesRunId: envelope.payload.supersedesRunId,
        correctionReason: envelope.payload.correctionReason,
        asOf: envelope.payload.asOf,
        removals: envelope.payload.removals,
        upserts: envelope.payload.upserts.map((candidate) => ({
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
      }),
    );
    connection.onreconnecting(callbacks.reconnecting);
    connection.onreconnected(callbacks.reconnected);
    connection.onclose(callbacks.closed);
    this.connection = connection;

    try {
      await connection.start();
      await connection.invoke('SubscribeScannerUpdates');
    } catch (error) {
      this.connection = null;
      await connection.stop();
      throw error;
    }
  }

  override async stop(): Promise<void> {
    const connection = this.connection;
    this.connection = null;
    if (connection) await connection.stop();
  }
}
