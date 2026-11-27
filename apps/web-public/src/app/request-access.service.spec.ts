import { TestBed } from '@angular/core/testing';
import { AccessRequest, RequestAccessService } from './request-access.service';

const validRequest = (overrides: Partial<AccessRequest> = {}): AccessRequest => ({
  name: 'Local Test User',
  email: 'tester@example.invalid',
  country: 'NG',
  experience: '',
  intendedUse: 'research',
  contactPreference: '',
  consent: true,
  website: '',
  ...overrides,
});

describe('RequestAccessService', () => {
  let service: RequestAccessService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestAccessService);
  });

  it('deduplicates normalized emails without changing the reference', async () => {
    const accepted = await service.submit(validRequest());
    const duplicate = await service.submit(
      validRequest({ email: '  TESTER@EXAMPLE.INVALID  ', name: 'Another local name' }),
    );

    if (accepted.state === 'unavailable')
      throw new Error('First request was unexpectedly throttled.');
    expect(accepted.state).toBe('accepted');
    expect(duplicate).toEqual({ state: 'duplicate', referenceId: accepted.referenceId });
  });

  it('screens a populated honeypot without consuming the request limit', async () => {
    const screened = await service.submit(validRequest({ website: 'bot.example' }));
    const first = await service.submit(validRequest({ email: 'one@example.invalid' }));
    const second = await service.submit(validRequest({ email: 'two@example.invalid' }));
    const third = await service.submit(validRequest({ email: 'three@example.invalid' }));

    expect(screened.state).toBe('accepted');
    expect([first.state, second.state, third.state]).toEqual(['accepted', 'accepted', 'accepted']);
  });

  it('fails temporarily after three submissions in the local window', async () => {
    await service.submit(validRequest({ email: 'one@example.invalid' }));
    await service.submit(validRequest({ email: 'two@example.invalid' }));
    await service.submit(validRequest({ email: 'three@example.invalid' }));

    await expect(service.submit(validRequest({ email: 'four@example.invalid' }))).resolves.toEqual({
      state: 'unavailable',
      retryAfterSeconds: 60,
    });
  });
});
