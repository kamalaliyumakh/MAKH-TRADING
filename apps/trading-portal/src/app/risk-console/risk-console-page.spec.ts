import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RiskConsolePage } from './risk-console-page';

const testAccountId = '00000000-0000-4000-8000-000000000001';
const session = {
  subject: 'owner-subject',
  roles: ['Owner'],
  accountMode: 'paper',
  accountId: testAccountId,
};

const overview = {
  accountId: testAccountId,
  policyVersion: 'synthetic-policy-v1',
  asOf: new Date().toISOString(),
  entryLocked: true,
  reconciliationHealthy: false,
  limits: [
    {
      code: 'daily-loss',
      label: 'Daily loss',
      used: 350,
      limit: 1000,
      remaining: 650,
      exceeded: false,
      unit: 'USD',
    },
  ],
  activePauses: [
    {
      pauseId: 'PAUSE-ACCOUNT',
      scope: 0,
      scopeReference: testAccountId,
      effectiveFrom: new Date(Date.now() - 2 * 60_000).toISOString(),
      reason: 'Review',
      evidenceSha256: 'b'.repeat(64),
    },
  ],
  openBreaches: [
    {
      breachId: 'BR-SYN-204',
      severity: 0,
      rule: 'Reconciliation state',
      state: 'Open - entry locked',
      detectedAt: new Date(Date.now() - 60_000).toISOString(),
      evidenceSha256: 'c'.repeat(64),
    },
  ],
  canMutateRisk: false,
  createsTradingAuthority: false,
  evidenceSha256: 'd'.repeat(64),
};

describe('RiskConsolePage', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RiskConsolePage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  const render = (response: object = overview) => {
    const fixture = TestBed.createComponent(RiskConsolePage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne(`/api/v1/risk/accounts/${testAccountId}/overview`).flush(response);
    fixture.detectChanges();
    return fixture;
  };

  it('places fail-closed state before capacity', () => {
    const text = render().nativeElement.textContent as string;
    expect(text.indexOf('Risk state is fail-closed')).toBeLessThan(
      text.indexOf('Limits and remaining capacity'),
    );
  });
  it('renders the authenticated overview response', () => {
    const text = render().nativeElement.textContent as string;
    expect(text).toContain('synthetic-policy-v1');
    expect(text).toContain('Daily loss');
    expect(text).toContain('Active pauses');
    expect(text).toContain('BR-SYN-204');
  });
  it('fails closed and clears stale evidence when the API is unavailable', () => {
    const fixture = TestBed.createComponent(RiskConsolePage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush(session);
    http
      .expectOne(`/api/v1/risk/accounts/${testAccountId}/overview`)
      .flush({ title: 'Unavailable' }, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Authenticated risk context is unavailable',
    );
    expect(fixture.componentInstance.risk.entryBlocked()).toBe(true);
    expect(fixture.componentInstance.risk.limits()).toEqual([]);
  });
  it('fails closed before a risk read when session account context is invalid', () => {
    const fixture = TestBed.createComponent(RiskConsolePage);
    fixture.detectChanges();
    http.expectOne('/api/v1/session').flush({ ...session, accountId: 'not-an-account-id' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Authenticated risk context is unavailable',
    );
    expect(fixture.componentInstance.risk.accountId()).toBeNull();
    expect(fixture.componentInstance.risk.entryBlocked()).toBe(true);
  });
  it('rejects an overview for a different account', () => {
    const fixture = render({ ...overview, accountId: '00000000-0000-4000-8000-000000000002' });
    expect(fixture.nativeElement.textContent).toContain('Risk overview evidence is invalid');
    expect(fixture.componentInstance.risk.accountId()).toBeNull();
    expect(fixture.componentInstance.risk.entryBlocked()).toBe(true);
  });
  it('rejects an authority-bearing or malformed overview response', () => {
    const fixture = render({ ...overview, entryLocked: false, canMutateRisk: true });
    expect(fixture.nativeElement.textContent).toContain('Risk overview evidence is invalid');
    expect(fixture.componentInstance.risk.entryBlocked()).toBe(true);
    expect(fixture.componentInstance.risk.limits()).toEqual([]);
  });
  it('rejects a stale overview and clears its evidence', () => {
    const fixture = render({ ...overview, asOf: new Date(Date.now() - 6 * 60_000).toISOString() });
    expect(fixture.nativeElement.textContent).toContain('Risk overview evidence is invalid');
    expect(fixture.componentInstance.risk.limits()).toEqual([]);
    expect(fixture.componentInstance.risk.accountId()).toBeNull();
  });
  it('rejects inconsistent capacity or tampered evidence', () => {
    const fixture = render({
      ...overview,
      limits: [{ ...overview.limits[0], remaining: 999 }],
      evidenceSha256: 'tampered',
    });
    expect(fixture.nativeElement.textContent).toContain('Risk overview evidence is invalid');
    expect(fixture.componentInstance.risk.limits()).toEqual([]);
  });
  it('rejects duplicate pause identities or contradictory reconciliation health', () => {
    const fixture = render({
      ...overview,
      reconciliationHealthy: true,
      activePauses: [overview.activePauses[0], { ...overview.activePauses[0] }],
    });
    expect(fixture.nativeElement.textContent).toContain('Risk overview evidence is invalid');
    expect(fixture.componentInstance.risk.pauses()).toEqual([]);
    expect(fixture.componentInstance.risk.entryBlocked()).toBe(true);
  });
  it('separates block cancel and liquidate confirmations', () => {
    const fixture = render();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Review Block');
    expect(element.textContent).toContain('Review Cancel');
    expect(element.textContent).toContain('Review Liquidate');
    fixture.componentInstance.review('Liquidate');
    fixture.detectChanges();
    expect(element.textContent).toContain('Liquidate confirmation preview');
  });
  it('never enables a consequential action', () => {
    const fixture = render();
    fixture.componentInstance.review('Block');
    fixture.detectChanges();
    const buttons = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'));
    expect(buttons.find((button) => button.textContent?.includes('Confirm Block'))?.disabled).toBe(
      true,
    );
    expect(fixture.componentInstance.risk.canMutateRisk()).toBe(false);
  });
  it('requests a CSRF-protected action-specific impact preview', () => {
    const fixture = render();
    fixture.componentInstance.review('Liquidate');
    fixture.componentInstance.reason.set('Synthetic incident containment review');
    fixture.componentInstance.requestPreview('Liquidate');

    http.expectOne('/api/v1/session').flush(session);
    http.expectOne('/auth/csrf').flush({ token: 'csrf-test-token' });
    const request = http.expectOne('/api/v1/risk/containment/preview');
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('X-CSRF-TOKEN')).toBe('csrf-test-token');
    expect(request.request.body.action).toBe(2);
    expect(request.request.body.accountId).toBe(testAccountId);
    const createdAt = new Date().toISOString();
    request.flush({
      commandId: request.request.body.commandId,
      accountId: testAccountId,
      action: 2,
      policyVersion: 'synthetic-policy-v1',
      entryLocked: true,
      reconciliationRequired: true,
      finalConfirmationEnabled: false,
      reason: request.request.body.reason,
      correlationId: request.request.body.correlationId,
      createdAt,
      impact: {
        openOrdersAffected: 3,
        positionsAffected: 2,
        estimatedGrossNotional: 8400,
        currency: 'USD',
        dataAsOf: createdAt,
        source: 'synthetic-read-model',
        warnings: ['Liquidation may partially fill.'],
        evidenceSha256: 'b'.repeat(64),
        isAuthoritative: false,
        canExecute: false,
      },
      evidenceSha256: 'a'.repeat(64),
      createsTradingAuthority: false,
      mutatesTradingState: false,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('3 open orders affected');
    expect(fixture.nativeElement.textContent).toContain('2 positions affected');
    expect(fixture.nativeElement.textContent).toContain('Liquidation may partially fill');
  });
  it('accepts a fully bound block preview without a reconciliation requirement', () => {
    const fixture = render();
    fixture.componentInstance.review('Block');
    fixture.componentInstance.reason.set('Synthetic incident containment review');
    fixture.componentInstance.requestPreview('Block');
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne('/auth/csrf').flush({ token: 'csrf-test-token' });
    const request = http.expectOne('/api/v1/risk/containment/preview');
    const createdAt = new Date().toISOString();
    request.flush({
      commandId: request.request.body.commandId,
      accountId: testAccountId,
      action: 0,
      policyVersion: 'synthetic-policy-v1',
      entryLocked: true,
      reconciliationRequired: false,
      finalConfirmationEnabled: false,
      reason: request.request.body.reason,
      correlationId: request.request.body.correlationId,
      createdAt,
      impact: {
        openOrdersAffected: 0,
        positionsAffected: 0,
        estimatedGrossNotional: 0,
        currency: 'USD',
        dataAsOf: createdAt,
        source: 'synthetic-read-model',
        warnings: ['Entry lock is already fail-closed.'],
        evidenceSha256: 'b'.repeat(64),
        isAuthoritative: false,
        canExecute: false,
      },
      evidenceSha256: 'a'.repeat(64),
      createsTradingAuthority: false,
      mutatesTradingState: false,
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.risk.containmentPreview()?.action).toBe(0);
    expect(fixture.componentInstance.risk.containmentPreview()?.reconciliationRequired).toBe(false);
  });
  it('rejects containment evidence that is not bound to the exact request', () => {
    const fixture = render();
    fixture.componentInstance.reason.set('Synthetic incident containment review');
    fixture.componentInstance.requestPreview('Cancel');
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne('/auth/csrf').flush({ token: 'csrf-test-token' });
    const request = http.expectOne('/api/v1/risk/containment/preview');
    const createdAt = new Date().toISOString();
    request.flush({
      commandId: crypto.randomUUID(),
      accountId: testAccountId,
      action: 1,
      policyVersion: 'synthetic-policy-v1',
      entryLocked: true,
      reconciliationRequired: true,
      finalConfirmationEnabled: false,
      reason: request.request.body.reason,
      correlationId: request.request.body.correlationId,
      createdAt,
      impact: {
        openOrdersAffected: 3,
        positionsAffected: 0,
        estimatedGrossNotional: 0,
        currency: 'USD',
        dataAsOf: createdAt,
        source: 'synthetic-read-model',
        warnings: ['Cancellation may be delayed.'],
        evidenceSha256: 'b'.repeat(64),
        isAuthoritative: false,
        canExecute: false,
      },
      evidenceSha256: 'a'.repeat(64),
      createsTradingAuthority: false,
      mutatesTradingState: false,
    });
    fixture.detectChanges();

    expect(fixture.componentInstance.risk.previewError()).toContain(
      'Containment preview evidence is invalid',
    );
    expect(fixture.componentInstance.risk.containmentPreview()).toBeNull();
  });
  it('rejects oversized or temporally invalid overview evidence', () => {
    const fixture = render({
      ...overview,
      limits: Array.from({ length: 1_001 }, (_, index) => ({
        ...overview.limits[0],
        code: `limit-${index}`,
      })),
      activePauses: [
        { ...overview.activePauses[0], effectiveFrom: new Date(Date.now() + 60_000).toISOString() },
      ],
    });

    expect(fixture.nativeElement.textContent).toContain('Risk overview evidence is invalid');
    expect(fixture.componentInstance.risk.limits()).toEqual([]);
  });
  it('rejects unsafe reason content before any preview request', () => {
    const fixture = render();
    fixture.componentInstance.risk.preview('Block', 'rotate secret before containment');
    fixture.detectChanges();

    expect(fixture.componentInstance.risk.previewError()).toContain(
      'reason of at least 10 characters',
    );
    expect(fixture.componentInstance.risk.containmentPreview()).toBeNull();
  });
  it('rejects unsafe containment preview evidence and retains entry lock', () => {
    const fixture = render();
    fixture.componentInstance.review('Block');
    fixture.componentInstance.reason.set('Synthetic incident containment review');
    fixture.componentInstance.requestPreview('Block');
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne('/auth/csrf').flush({ token: 'csrf-test-token' });
    http.expectOne('/api/v1/risk/containment/preview').flush({
      action: 0,
      policyVersion: 'synthetic-policy-v1',
      entryLocked: false,
      finalConfirmationEnabled: true,
      impact: { isAuthoritative: true, canExecute: true, warnings: [] },
      evidenceSha256: 'unsafe',
      createsTradingAuthority: true,
      mutatesTradingState: true,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Containment preview evidence is invalid');
    expect(fixture.componentInstance.risk.entryBlocked()).toBe(true);
    expect(fixture.componentInstance.risk.containmentPreview()).toBeNull();
  });
  it('rejects malformed nested impact evidence', () => {
    const fixture = render();
    fixture.componentInstance.review('Liquidate');
    fixture.componentInstance.reason.set('Synthetic incident containment review');
    fixture.componentInstance.requestPreview('Liquidate');
    http.expectOne('/api/v1/session').flush(session);
    http.expectOne('/auth/csrf').flush({ token: 'csrf-test-token' });
    http.expectOne('/api/v1/risk/containment/preview').flush({
      action: 2,
      policyVersion: 'synthetic-policy-v1',
      entryLocked: true,
      reconciliationRequired: true,
      finalConfirmationEnabled: false,
      impact: {
        openOrdersAffected: -1,
        positionsAffected: 2.5,
        estimatedGrossNotional: Number.NaN,
        currency: 'BTC',
        source: 'unknown',
        warnings: [''],
        isAuthoritative: false,
        canExecute: false,
      },
      evidenceSha256: 'a'.repeat(64),
      createsTradingAuthority: false,
      mutatesTradingState: false,
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Containment preview evidence is invalid');
    expect(fixture.componentInstance.risk.containmentPreview()).toBeNull();
    expect(fixture.componentInstance.risk.entryBlocked()).toBe(true);
  });
  it('fails closed when the account changes before preview', () => {
    const fixture = render();
    fixture.componentInstance.reason.set('Synthetic incident containment review');
    fixture.componentInstance.requestPreview('Block');
    http.expectOne('/api/v1/session').flush({
      ...session,
      accountId: '00000000-0000-4000-8000-000000000002',
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('risk context changed or was revoked');
    expect(fixture.componentInstance.risk.accountId()).toBeNull();
    expect(fixture.componentInstance.risk.limits()).toEqual([]);
    expect(fixture.componentInstance.risk.entryBlocked()).toBe(true);
  });
  it('fails closed when the session is revoked before preview', () => {
    const fixture = render();
    fixture.componentInstance.reason.set('Synthetic incident containment review');
    fixture.componentInstance.requestPreview('Cancel');
    http
      .expectOne('/api/v1/session')
      .flush({ title: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('risk context changed or was revoked');
    expect(fixture.componentInstance.risk.policyVersion()).toBe('Unavailable');
    expect(fixture.componentInstance.risk.containmentPreview()).toBeNull();
  });
});
