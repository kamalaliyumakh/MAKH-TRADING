import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { SymbolWorkspacePage } from './symbol-workspace-page';

const workspaceResponse = {
  securityId: '2d6e4a5c-40f6-4f15-8c73-f408c02e2d5a',
  symbol: 'SYNB',
  companyName: 'Synthetic Biotech B',
  venueMic: 'XNAS',
  tradability: 'Review only',
  asOf: '2026-10-05T12:00:00Z',
  quote: { bid: 5.16, ask: 5.19, last: 5.18, ageSeconds: 35, state: 'Current' },
  metrics: {
    gainPercent: 159,
    relativeVolume: 4.2,
    publicFloat: 420_000,
    spreadPercent: 0.58,
    dollarVolume: 2_780_000,
    extremeMoveRisk: true,
  },
  pricePoints: [
    { time: '14:30', price: 3.12 },
    { time: '14:35', price: 3.48 },
    { time: '14:40', price: 4.1 },
    { time: '14:45', price: 4.72 },
    { time: '14:50', price: 4.44 },
    { time: '14:55', price: 5.02 },
    { time: '15:00', price: 5.18 },
  ],
  evidenceSnapshotHash: '85e5b850f770c7a8b581eec9790bc4f2f29525da38eea8667a3613d9e1a95107',
  evidence: [
    {
      id: 'filing-1',
      kind: 'SEC filing',
      headline: 'Synthetic current report filed for workspace testing',
      source: 'Synthetic SEC fixture · accession 0000000000-26-000001',
      trust: 'Primary',
      observedAt: '2026-10-05T11:42:00Z',
      limitation:
        'Primary-source evidence is eligible for review but is not a verification decision.',
      catalystVerified: false,
    },
    {
      id: 'news-1',
      kind: 'News',
      headline: 'Synthetic publisher reports a material company update',
      source: 'Synthetic attributed publisher',
      trust: 'Attributed',
      observedAt: '2026-10-05T11:47:00Z',
      limitation: 'Publisher attribution does not establish completeness or trading relevance.',
      catalystVerified: false,
    },
    {
      id: 'social-1',
      kind: 'Social attention',
      headline: 'Attention increased 240% in the current aggregate window',
      source: 'Synthetic aggregate · no posts or user identifiers retained',
      trust: 'Low trust',
      observedAt: '2026-10-05T11:58:00Z',
      limitation:
        'Manipulation risk elevated. Social attention is not proof of a catalyst or a buy signal.',
      catalystVerified: false,
    },
  ],
  thesis: {
    summary: 'Draft only: unusual volume and a primary-source filing warrant review.',
    catalystStatus: 'Not verified',
    invalidation:
      'Reject the thesis if the filing is unrelated, the quote becomes stale, or liquidity deteriorates.',
    exitPlan:
      'No approved exit plan. A complete risk-bounded plan is required before proposal creation.',
  },
  dataMode: 'Synthetic',
  createsTradingAuthority: false,
  canSubmitOrder: false,
};

describe('SymbolWorkspacePage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SymbolWorkspacePage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ symbol: 'SYNB' }) } },
        },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function createPage() {
    const fixture = TestBed.createComponent(SymbolWorkspacePage);
    fixture.detectChanges();
    const request = http.expectOne('/api/v1/symbols/SYNB/workspace');
    expect(request.request.withCredentials).toBe(true);
    return { fixture, request };
  }

  async function loadReady() {
    const { fixture, request } = createPage();
    request.flush(workspaceResponse);
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('shows a non-authoritative loading state before the API responds', () => {
    const { fixture, request } = createPage();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')).not.toBeNull();
    expect(element.textContent).toContain('Loading symbol workspace');
    expect(element.textContent).not.toContain('$5.18');
    request.flush(workspaceResponse);
  });

  it('shows canonical security, quote age and scanner evidence after validation', async () => {
    const fixture = await loadReady();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('SYNB · Synthetic Biotech B');
    expect(text).toContain('XNAS · Review only');
    expect(text).toContain('Current quote · 35s old');
    expect(text).toContain('4.2× · passes 3×');
    expect(text).toContain('420,000 · below 500,000');
  });

  it('renders an accessible price trace with synthetic-data disclosure', async () => {
    const fixture = await loadReady();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('svg[role="img"] title')?.textContent).toContain('SYNB');
    expect(element.querySelector('polyline')?.getAttribute('points')).toBeTruthy();
    expect(element.querySelector('polygon.chart-area')?.getAttribute('points')).toBeTruthy();
    expect(element.querySelector('svg circle')).not.toBeNull();
    expect(element.textContent).toContain('not executable market data');
  });

  it('orders primary evidence before social attention and keeps catalyst unverified', async () => {
    const fixture = await loadReady();
    const items = [...(fixture.nativeElement as HTMLElement).querySelectorAll('.evidence-item')];
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toContain('Primary');
    expect(items[2].textContent).toContain('Low trust');
    expect(items[2].textContent).toContain('not proof of a catalyst or a buy signal');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Catalyst: Not verified');
  });

  it('shows thesis invalidation and an unavailable proposal workflow', async () => {
    const fixture = await loadReady();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Thesis and invalidation');
    expect(text).toContain('No approved exit plan');
    expect(text).toContain('Risk service is not connected');
    expect(text).toContain('Proposal creation and submission are disabled');
  });

  it.each([
    { status: 404, phrase: 'not available in the candidate scanner' },
    { status: 403, phrase: 'session cannot access this workspace' },
    { status: 503, phrase: 'workspace service is unavailable' },
  ])('fails closed for HTTP $status', async ({ status, phrase }) => {
    const { fixture, request } = createPage();
    request.flush({}, { status, statusText: 'failure' });
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(element.textContent).toContain(phrase);
    expect(element.textContent).not.toContain('Synthetic Biotech B');
    expect(element.querySelector('.evidence-item')).toBeNull();
  });

  it('rejects a response that grants trading authority', async () => {
    const { fixture, request } = createPage();
    request.flush({ ...workspaceResponse, createsTradingAuthority: true });
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('failed safety validation');
    expect(element.textContent).not.toContain('Synthetic Biotech B');
  });

  it('rejects a stale quote without showing market or evidence content', async () => {
    const { fixture, request } = createPage();
    request.flush({ ...workspaceResponse, quote: { ...workspaceResponse.quote, ageSeconds: 121 } });
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('quote is stale');
    expect(element.textContent).not.toContain('Synthetic Biotech B');
    expect(element.querySelector('.evidence-item')).toBeNull();
  });

  it.each([
    {
      name: 'duplicate evidence identifiers',
      response: {
        ...workspaceResponse,
        evidence: [
          workspaceResponse.evidence[0],
          { ...workspaceResponse.evidence[1], id: 'filing-1' },
        ],
      },
    },
    {
      name: 'evidence observed after the workspace snapshot',
      response: {
        ...workspaceResponse,
        evidence: [
          workspaceResponse.evidence[0],
          { ...workspaceResponse.evidence[1], observedAt: '2026-10-05T12:01:00Z' },
        ],
      },
    },
    {
      name: 'negative chart prices',
      response: {
        ...workspaceResponse,
        pricePoints: [workspaceResponse.pricePoints[0], { time: '14:35', price: -1 }],
      },
    },
    {
      name: 'out-of-order chart observations',
      response: {
        ...workspaceResponse,
        pricePoints: [workspaceResponse.pricePoints[1], workspaceResponse.pricePoints[0]],
      },
    },
    {
      name: 'negative relative volume',
      response: {
        ...workspaceResponse,
        metrics: { ...workspaceResponse.metrics, relativeVolume: -1 },
      },
    },
  ])('rejects $name and hides the unsafe payload', async ({ response }) => {
    const { fixture, request } = createPage();
    request.flush(response);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('failed safety validation');
    expect(element.textContent).not.toContain('Synthetic Biotech B');
    expect(element.querySelector('.evidence-item')).toBeNull();
  });

  it('contains no order submission control in any ready state', async () => {
    const fixture = await loadReady();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('form')).toBeNull();
    expect(element.textContent).not.toContain('Submit paper limit order');
  });
});
