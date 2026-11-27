import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardPage } from './dashboard-page';

function response() {
  const now = new Date().toISOString();
  return {
    accountId: '00000000-0000-0000-0000-000000000001',
    snapshotId: 'synthetic-dashboard-current',
    asOf: now,
    mode: 'PAPER',
    accountLabel: 'Synthetic account · no broker connection',
    entryState: 'Locked',
    entryReason: 'Risk, broker and reconciliation authorities are not connected.',
    pnl: { realized: 42, unrealized: -18, total: 24, asOf: now, authority: 'Synthetic estimate' },
    risk: {
      policyVersion: 'synthetic-risk-policy-v1',
      dailyLossLimit: 200,
      consumedLossCapacity: 50,
      remainingLossCapacity: 150,
      openRisk: 0,
      buyingPower: null,
    },
    dependencies: [
      {
        name: 'Market data',
        state: 'Available',
        ageSeconds: 35,
        effect: 'Synthetic quote snapshot current.',
      },
      {
        name: 'Evidence',
        state: 'Available',
        ageSeconds: 62,
        effect: 'Synthetic evidence snapshot current.',
      },
      {
        name: 'Risk service',
        state: 'Unavailable',
        ageSeconds: null,
        effect: 'New entries remain blocked.',
      },
      {
        name: 'Broker',
        state: 'Unavailable',
        ageSeconds: null,
        effect: 'Orders and account truth unavailable.',
      },
      {
        name: 'Reconciliation',
        state: 'Unavailable',
        ageSeconds: null,
        effect: 'No authoritative position or order state.',
      },
    ],
    activity: { openPositions: 0, workingOrders: 0, reconciliationState: 'Not connected' },
    alerts: [
      {
        id: 'entry-lock',
        severity: 'Critical',
        title: 'New entries are locked',
        guidance: 'Do not create or submit an order.',
      },
      {
        id: 'broker-offline',
        severity: 'Warning',
        title: 'Broker state unavailable',
        guidance: 'Balances, positions and orders are not authoritative.',
      },
      {
        id: 'synthetic-only',
        severity: 'Information',
        title: 'Synthetic dashboard fixture',
        guidance: 'Values demonstrate layout and controls only.',
      },
    ],
    candidates: [
      {
        symbol: 'SYNB',
        gainPercent: 159,
        relativeVolume: 4.2,
        riskLabel: 'Extreme move · elevated risk',
      },
      {
        symbol: 'SYNA',
        gainPercent: 68,
        relativeVolume: 3.4,
        riskLabel: 'Review evidence and liquidity',
      },
    ],
    dataMode: 'Synthetic',
    reconciledBrokerTruth: false,
    createsTradingAuthority: false,
    canSubmitOrder: false,
  };
}

describe('DashboardPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function createPage() {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    const request = http.expectOne('/api/v1/dashboard');
    expect(request.request.withCredentials).toBe(true);
    return { fixture, request };
  }

  async function loadReady() {
    const { fixture, request } = createPage();
    request.flush(response());
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('hides account information while loading', () => {
    const { fixture, request } = createPage();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')).not.toBeNull();
    expect(element.textContent).toContain('Loading dashboard');
    expect(element.textContent).not.toContain('Daily P&L');
    request.flush(response());
  });

  it('places paper mode and entry lock before financial context', async () => {
    const fixture = await loadReady();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('PAPER — simulated account');
    expect(text).toContain('New entries are locked');
    expect(text.indexOf('New entries are locked')).toBeLessThan(text.indexOf('Daily P&L'));
  });

  it('labels pnl and account values as synthetic and unreconciled', async () => {
    const fixture = await loadReady();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Synthetic estimate · not reconciled broker truth');
    expect(text).toContain('Buying power');
    expect(text).toContain('Unavailable');
    expect(text).toContain('Not broker authoritative');
  });

  it('shows dependency effects and blocks authority-dependent operations', async () => {
    const fixture = await loadReady();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Risk service');
    expect(text).toContain('New entries remain blocked');
    expect(text).toContain('Broker');
    expect(text).toContain('Orders and account truth unavailable');
    expect(text).toContain('Reconciliation');
  });

  it('keeps candidate gain secondary and includes risk labels', async () => {
    const fixture = await loadReady();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.indexOf('Watch candidates')).toBeGreaterThan(text.indexOf('Connectivity'));
    expect(text).toContain('Candidate gain is secondary context');
    expect(text).toContain('Extreme move · elevated risk');
  });

  it.each([401, 403, 503])('fails closed for HTTP %s', async (status) => {
    const { fixture, request } = createPage();
    request.flush({}, { status, statusText: 'failure' });
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(element.textContent).toContain('No account information displayed');
    expect(element.textContent).not.toContain('Daily P&L');
  });

  it('rejects authority-bearing and unreconciled-contract violations', async () => {
    const { fixture, request } = createPage();
    request.flush({ ...response(), canSubmitOrder: true });
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('failed safety validation');
    expect(text).not.toContain('Daily P&L');
  });

  it('rejects stale snapshots and hides candidate and financial content', async () => {
    const stale = response();
    stale.asOf = new Date(Date.now() - 6 * 60_000).toISOString();
    stale.pnl.asOf = stale.asOf;
    const { fixture, request } = createPage();
    request.flush(stale);
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('snapshot is stale');
    expect(text).not.toContain('Daily P&L');
    expect(text).not.toContain('Watch candidates');
  });

  it.each([
    {
      name: 'duplicate dependency names',
      mutate: (value: ReturnType<typeof response>) => {
        value.dependencies = [...value.dependencies, { ...value.dependencies[0] }];
      },
    },
    {
      name: 'duplicate alert identifiers',
      mutate: (value: ReturnType<typeof response>) => {
        value.alerts = [...value.alerts, { ...value.alerts[0] }];
      },
    },
    {
      name: 'duplicate candidate symbols',
      mutate: (value: ReturnType<typeof response>) => {
        value.candidates = [...value.candidates, { ...value.candidates[0] }];
      },
    },
    {
      name: 'P&L observed after the dashboard snapshot',
      mutate: (value: ReturnType<typeof response>) => {
        value.pnl.asOf = new Date(Date.parse(value.asOf) + 1_000).toISOString();
      },
    },
    {
      name: 'negative open risk',
      mutate: (value: ReturnType<typeof response>) => {
        value.risk.openRisk = -1;
      },
    },
    {
      name: 'negative candidate relative volume',
      mutate: (value: ReturnType<typeof response>) => {
        value.candidates[0].relativeVolume = -1;
      },
    },
  ])('rejects $name and hides account content', async ({ mutate }) => {
    const invalid = response();
    mutate(invalid);
    const { fixture, request } = createPage();
    request.flush(invalid);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('failed safety validation');
    expect(element.textContent).not.toContain('Daily P&L');
    expect(element.textContent).not.toContain('Watch candidates');
  });

  it('rejects a future-dated snapshot and hides account content', async () => {
    const invalid = response();
    invalid.asOf = new Date(Date.now() + 31_000).toISOString();
    invalid.pnl.asOf = invalid.asOf;
    const { fixture, request } = createPage();
    request.flush(invalid);
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('snapshot is stale');
    expect(text).not.toContain('Daily P&L');
  });

  it('contains navigation only and no consequential controls', async () => {
    const fixture = await loadReady();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('form')).toBeNull();
    expect(element.textContent).not.toContain('Submit paper limit order');
    expect(element.textContent).not.toContain('Block new entries');
  });
});
