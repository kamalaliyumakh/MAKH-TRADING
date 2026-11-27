import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TradingPage } from './trading-page';

describe('TradingPage', () => {
  const accountId = '00000000-0000-4000-8000-000000000001';
  const session = { subject: 'owner-subject', roles: ['Owner'], accountMode: 'paper', accountId };
  const overview = {
    accountId,
    asOf: new Date().toISOString(),
    reconciliation: 'Mismatch',
    entryLocked: true,
    orders: [
      {
        id: 'SYN-1042',
        symbol: 'SYNB',
        side: 'Buy',
        quantity: 100,
        filled: 40,
        limitPrice: 5.25,
        state: 'Partially filled',
        updatedAt: new Date().toISOString(),
      },
    ],
    positions: [
      {
        symbol: 'SYNB',
        quantity: 40,
        averageCost: 5.21,
        mark: 5.42,
        realizedPnl: 0,
        unrealizedPnl: 8.4,
        protection: 'Under-protected',
      },
    ],
    evidenceSha256: 'a'.repeat(64),
    isAuthoritative: false,
    canSubmit: false,
    createsTradingAuthority: false,
  };
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradingPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  const render = () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne(`/api/v1/trading/accounts/${accountId}/overview`).flush(overview);
    fixture.detectChanges();
    return fixture;
  };

  const flushReview = (fixture: ReturnType<typeof render>, overrides: object = {}) => {
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne('/auth/csrf').flush({ token: 'csrf-test-token' });
    const request = http.expectOne('/api/v1/trading/orders/review');
    request.flush({
      requestId: request.request.body.requestId,
      accountId,
      symbol: 'SYNB',
      side: 'Buy',
      quantity: 100,
      limitPrice: 5.25,
      stopPrice: 4.75,
      estimatedNotional: 525,
      mode: 'PAPER',
      authority: 'Synthetic review only',
      entryLocked: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 2 * 60_000).toISOString(),
      evidenceSha256: 'b'.repeat(64),
      canSubmit: false,
      createsTradingAuthority: false,
      mutatesTradingState: false,
      ...overrides,
    });
    fixture.detectChanges();
    return request;
  };

  it('places paper mode and reconciliation lock before the order ticket', () => {
    const fixture = render();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('PAPER · simulated only');
    expect(text.indexOf('New entries are locked')).toBeLessThan(text.indexOf('Order ticket'));
  });

  it('requires review and never enables submission', () => {
    const fixture = render();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'No order is created at this step',
    );
    fixture.componentInstance.review();
    const request = flushReview(fixture);
    fixture.detectChanges();
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-test-token');
    const submit = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).find((button) => button.textContent?.includes('Submit'));
    expect(submit?.disabled).toBe(true);
    expect(fixture.componentInstance.trading.canSubmit()).toBe(false);
  });

  it('enforces configured price and quantity guardrails', () => {
    const fixture = render();
    const page = fixture.componentInstance;
    page.ticket.patchValue({ quantity: 500001, limitPrice: 2.99 });
    expect(page.ticket.invalid).toBe(true);
  });

  it('labels orders positions and pnl as synthetic non-authority', () => {
    const fixture = render();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Not broker authoritative');
    expect(text).toContain('P&L is a timestamped synthetic estimate');
    expect(text).toContain('Under-protected');
  });

  it('fails closed and clears synthetic evidence for invalid account context', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush({ ...session, accountMode: 'live' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('paper-account context is invalid');
    expect(fixture.componentInstance.trading.accountId()).toBeNull();
    expect(fixture.componentInstance.trading.orders()).toEqual([]);
    expect(fixture.componentInstance.trading.positions()).toEqual([]);
    fixture.componentInstance.trading.preview({
      symbol: 'SYNB',
      side: 'Buy',
      quantity: 100,
      limitPrice: 5.25,
      stopPrice: 4.75,
    });
    expect(fixture.componentInstance.trading.confirmation()).toBeNull();
  });

  it('fails closed when the protected session is unavailable', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush({}, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('paper-account context is unavailable');
    expect(fixture.componentInstance.trading.reconciliation()).toBe('Unknown');
  });

  it('rejects a cross-account or authority-bearing overview', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne(`/api/v1/trading/accounts/${accountId}/overview`).flush({
      ...overview,
      accountId: '00000000-0000-4000-8000-000000000002',
      canSubmit: true,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('overview evidence is invalid');
    expect(fixture.componentInstance.trading.accountId()).toBeNull();
    expect(fixture.componentInstance.trading.orders()).toEqual([]);
  });

  it('rejects stale or malformed order evidence', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne(`/api/v1/trading/accounts/${accountId}/overview`).flush({
      ...overview,
      asOf: new Date(Date.now() - 6 * 60_000).toISOString(),
      orders: [{ ...overview.orders[0], filled: 101 }],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('overview evidence is invalid');
    expect(fixture.componentInstance.trading.positions()).toEqual([]);
  });

  it('rejects duplicate order identities and clears the account timestamp', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne(`/api/v1/trading/accounts/${accountId}/overview`).flush({
      ...overview,
      orders: [overview.orders[0], { ...overview.orders[0] }],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('overview evidence is invalid');
    expect(fixture.componentInstance.trading.asOf()).toBeNull();
    expect(fixture.componentInstance.trading.orders()).toEqual([]);
  });

  it('validates position economics and renders the backend as-of timestamp', () => {
    const fixture = render();
    expect(fixture.nativeElement.textContent).toContain(`As of ${overview.asOf}`);

    fixture.componentInstance.trading.loadContext();
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne(`/api/v1/trading/accounts/${accountId}/overview`).flush({
      ...overview,
      positions: [{ ...overview.positions[0], mark: Number.NaN }],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('overview evidence is invalid');
    expect(fixture.componentInstance.trading.positions()).toEqual([]);
  });

  it('rejects unknown order states and oversized response collections', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne(`/api/v1/trading/accounts/${accountId}/overview`).flush({
      ...overview,
      orders: Array.from({ length: 1_001 }, (_, index) => ({
        ...overview.orders[0],
        id: `SYN-${index}`,
        state: index === 1_000 ? 'Executable' : 'Pending',
      })),
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('overview evidence is invalid');
    expect(fixture.componentInstance.trading.orders()).toEqual([]);
  });

  it('rejects position evidence whose unrealized pnl is not arithmetically coherent', () => {
    const fixture = TestBed.createComponent(TradingPage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne(`/api/v1/trading/accounts/${accountId}/overview`).flush({
      ...overview,
      positions: [{ ...overview.positions[0], unrealizedPnl: 9.4 }],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('overview evidence is invalid');
    expect(fixture.componentInstance.trading.positions()).toEqual([]);
  });

  it('rejects an invalid draft before making any review request', () => {
    const fixture = render();
    fixture.componentInstance.trading.preview({
      symbol: 'SYNB',
      side: 'Buy',
      quantity: 500_001,
      limitPrice: 5.25,
      stopPrice: Number.NaN,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('intent is invalid');
    expect(fixture.componentInstance.trading.confirmation()).toBeNull();
    expect(fixture.componentInstance.trading.canSubmit()).toBe(false);
  });

  it('rejects authority-bearing order-review evidence', () => {
    const fixture = render();
    fixture.componentInstance.review();
    flushReview(fixture, { entryLocked: false, canSubmit: true, evidenceSha256: 'unsafe' });

    expect(fixture.nativeElement.textContent).toContain('review evidence is invalid');
    expect(fixture.componentInstance.trading.confirmation()).toBeNull();
    expect(fixture.componentInstance.trading.canSubmit()).toBe(false);
  });

  it('rejects an expired order-review window', () => {
    const fixture = render();
    fixture.componentInstance.review();
    flushReview(fixture, {
      createdAt: new Date(Date.now() - 3 * 60_000).toISOString(),
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });

    expect(fixture.nativeElement.textContent).toContain('review evidence is invalid');
    expect(fixture.componentInstance.trading.confirmation()).toBeNull();
  });

  it('stops review when session account changes before csrf', () => {
    const fixture = render();
    fixture.componentInstance.review();
    http.expectOne('/api/v1/session').flush({
      ...session,
      accountId: '00000000-0000-4000-8000-000000000002',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('context changed or was revoked');
    expect(fixture.componentInstance.trading.accountId()).toBeNull();
    expect(fixture.componentInstance.trading.orders()).toEqual([]);
  });
});
