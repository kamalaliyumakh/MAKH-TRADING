export type RealtimeConnectionState = 'disconnected' | 'connecting' | 'connected' | 'recovering';

export const requiresSnapshotRecovery = (lastSequence: number, nextSequence: number): boolean =>
  nextSequence !== lastSequence + 1;
