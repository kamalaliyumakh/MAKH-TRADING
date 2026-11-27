import { anonymousPaperSession } from './auth';

describe('anonymousPaperSession', () => {
  it('cannot imply an authenticated live session', () => {
    expect(anonymousPaperSession).toEqual({
      authenticated: false,
      mode: 'paper',
      mfaFreshUntil: null,
    });
  });
});
