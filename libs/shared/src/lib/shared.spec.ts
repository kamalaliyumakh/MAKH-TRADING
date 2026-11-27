import { tradingModeLabel } from './shared';

describe('tradingModeLabel', () => {
  it('returns explicit non-color-only labels', () => {
    expect(tradingModeLabel('paper')).toBe('Paper mode');
    expect(tradingModeLabel('live')).toBe('Live mode');
  });
});
