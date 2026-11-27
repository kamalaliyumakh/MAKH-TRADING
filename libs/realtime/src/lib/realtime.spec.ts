import { requiresSnapshotRecovery } from './realtime';

describe('requiresSnapshotRecovery', () => {
  it('detects a sequence gap', () => {
    expect(requiresSnapshotRecovery(41, 42)).toBe(false);
    expect(requiresSnapshotRecovery(41, 43)).toBe(true);
  });
});
