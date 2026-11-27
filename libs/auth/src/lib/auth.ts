export type SessionMode = 'paper' | 'live';

export interface SessionSnapshot {
  readonly authenticated: boolean;
  readonly mode: SessionMode;
  readonly mfaFreshUntil: string | null;
}

export const anonymousPaperSession: SessionSnapshot = {
  authenticated: false,
  mode: 'paper',
  mfaFreshUntil: null,
};
