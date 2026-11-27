export type TradingMode = 'paper' | 'live';

export const tradingModeLabel = (mode: TradingMode): string =>
  mode === 'paper' ? 'Paper mode' : 'Live mode';
