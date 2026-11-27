import { isApiProblem } from './api-client';

describe('isApiProblem', () => {
  it('accepts an RFC 9457-compatible minimum shape', () => {
    expect(isApiProblem({ type: 'about:blank', title: 'Denied', status: 403 })).toBe(true);
    expect(isApiProblem({ title: 'Denied' })).toBe(false);
  });
});
