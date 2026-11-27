import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { JournalPage } from './journal-page';

function response() {
  const now = new Date().toISOString();
  return {
    accountId: '00000000-0000-0000-0000-000000000001',
    userId: '00000000-0000-0000-0000-000000000002',
    snapshotId: 'synthetic-journal-current',
    asOf: now,
    entries: [
      {
        entryId: '61000000-0000-0000-0000-000000000001',
        symbol: 'TRKA',
        side: 'Long',
        state: 'Reviewed',
        openedAt: new Date(Date.now() - 86_400_000).toISOString(),
        thesis: 'Verified primary-source catalyst supported review.',
        outcome: 'Exited according to the synthetic plan.',
        resultPercent: 18.4,
        tags: ['catalyst', 'reviewed'],
        evidenceCount: 3,
      },
      {
        entryId: '61000000-0000-0000-0000-000000000002',
        symbol: 'XCUR',
        side: 'Long',
        state: 'Reviewed',
        openedAt: new Date(Date.now() - 43_200_000).toISOString(),
        thesis: 'Liquidity remained acceptable during review.',
        outcome: 'Synthetic invalidation was respected.',
        resultPercent: -4.6,
        tags: ['invalidation', 'reviewed'],
        evidenceCount: 2,
      },
      {
        entryId: '61000000-0000-0000-0000-000000000003',
        symbol: 'SYNB',
        side: 'Long',
        state: 'Draft',
        openedAt: new Date(Date.now() - 21_600_000).toISOString(),
        thesis: 'Extreme expansion requires evidence and risk review.',
        outcome: 'Outcome review is pending. No execution authority exists.',
        resultPercent: null,
        tags: ['draft', 'synthetic'],
        evidenceCount: 3,
      },
      {
        entryId: '61000000-0000-0000-0000-000000000004',
        symbol: 'DFLI',
        side: 'Long',
        state: 'Archived',
        openedAt: new Date(Date.now() - 172_800_000).toISOString(),
        thesis: 'Synthetic earnings momentum was recorded.',
        outcome: 'Archived after review.',
        resultPercent: 7.2,
        tags: ['archived', 'earnings'],
        evidenceCount: 2,
      },
    ],
    dataMode: 'Synthetic',
    containsPersonalNotes: false,
    isReadOnly: true,
    createsTradingAuthority: false,
    canChangeRisk: false,
    canSubmitOrder: false,
  };
}

describe('JournalPage', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JournalPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function createPage() {
    const fixture = TestBed.createComponent(JournalPage);
    fixture.detectChanges();
    const request = http.expectOne('/api/v1/journal');
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

  it('hides every record and metric while loading', () => {
    const { fixture, request } = createPage();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="status"]')).not.toBeNull();
    expect(element.textContent).toContain('Loading journal');
    expect(element.textContent).not.toContain('Positive outcomes');
    expect(element.textContent).not.toContain('TRKA');
    request.flush(response());
  });

  it('presents process review before outcome metrics', async () => {
    const fixture = await loadReady();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Review decisions, evidence and discipline—not just outcomes.');
    expect(text.indexOf('Journal entry is disabled')).toBeLessThan(
      text.indexOf('Positive outcomes'),
    );
  });

  it('shows scoped lifecycle, evidence and incomplete-review states', async () => {
    const fixture = await loadReady();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Draft');
    expect(text).toContain('Reviewed');
    expect(text).toContain('Archived');
    expect(text).toContain('Outcome review is pending');
    expect(text).toContain('evidence links');
  });

  it('keeps the workspace read-only and non-authoritative', async () => {
    const fixture = await loadReady();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('form')).toBeNull();
    expect(element.textContent).toContain('Synthetic, non-authoritative and non-executable');
  });

  it('renders review and result visualizations accessibly', async () => {
    const fixture = await loadReady();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.ring[role="img"]')?.getAttribute('aria-label')).toContain(
      'percent',
    );
    expect(element.querySelectorAll('.result-bar')).toHaveLength(3);
  });

  it.each([401, 403, 503])('fails closed for HTTP %s', async (status) => {
    const { fixture, request } = createPage();
    request.flush({}, { status, statusText: 'failure' });
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(element.textContent).toContain('Journal records unavailable');
    expect(element.textContent).not.toContain('Positive outcomes');
    expect(element.textContent).not.toContain('TRKA');
  });

  it('rejects authority-bearing responses and hides every record', async () => {
    const { fixture, request } = createPage();
    request.flush({ ...response(), canSubmitOrder: true });
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('failed safety validation');
    expect(text).not.toContain('TRKA');
  });

  it('rejects invalid scope and duplicate entry identities', async () => {
    const invalid = response();
    invalid.entries = [...invalid.entries, invalid.entries[0]];
    const { fixture, request } = createPage();
    request.flush(invalid);
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'failed safety validation',
    );
  });

  it('rejects stale snapshots and hides every record', async () => {
    const stale = response();
    stale.asOf = new Date(Date.now() - 16 * 60_000).toISOString();
    const { fixture, request } = createPage();
    request.flush(stale);
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('snapshot is stale');
    expect(text).not.toContain('TRKA');
  });

  it.each([
    {
      name: 'duplicate tags',
      mutate: (value: ReturnType<typeof response>) => {
        value.entries[0].tags = ['reviewed', 'reviewed'];
      },
    },
    {
      name: 'non-normalized tags',
      mutate: (value: ReturnType<typeof response>) => {
        value.entries[0].tags = ['Reviewed'];
      },
    },
    {
      name: 'a draft with a numeric result',
      mutate: (value: ReturnType<typeof response>) => {
        value.entries[2].resultPercent = 1;
      },
    },
    {
      name: 'a reviewed entry without a numeric result',
      mutate: (value: ReturnType<typeof response>) => {
        value.entries[0].resultPercent = null;
      },
    },
    {
      name: 'an unbounded evidence count',
      mutate: (value: ReturnType<typeof response>) => {
        value.entries[0].evidenceCount = 10_001;
      },
    },
  ])('rejects $name and hides every record', async ({ mutate }) => {
    const invalid = response();
    mutate(invalid);
    const { fixture, request } = createPage();
    request.flush(invalid);
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('failed safety validation');
    expect(text).not.toContain('TRKA');
  });

  it('rejects a materially future snapshot and hides every record', async () => {
    const invalid = response();
    invalid.asOf = new Date(Date.now() + 31_000).toISOString();
    const { fixture, request } = createPage();
    request.flush(invalid);
    await fixture.whenStable();
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('snapshot is stale');
    expect(text).not.toContain('TRKA');
  });
});
