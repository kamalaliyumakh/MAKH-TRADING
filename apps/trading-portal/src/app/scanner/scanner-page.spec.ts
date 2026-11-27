import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ScannerPage } from './scanner-page';
import { ScannerRealtimeService } from './scanner-realtime.service';

describe('ScannerPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScannerPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows versioned synthetic run context and safety boundary', () => {
    const fixture = TestBed.createComponent(ScannerPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Low float momentum v1');
    expect(text).toContain('scanner-calculation-v1');
    expect(text).toContain('Updates: Connected');
    expect(text).toContain('stream sequence 204');
    expect(text).toContain('not a recommendation');
    expect(text).toContain('can create, authorize, or submit an order');
  });

  it('defaults to qualified candidates in deterministic rank order', () => {
    const fixture = TestBed.createComponent(ScannerPage);
    fixture.detectChanges();
    const rows = [...(fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr')];
    expect(rows).toHaveLength(1);
    expect(rows[0].textContent).toContain('SYNB');
  });

  it('renders an explanatory qualification funnel and metric bars', () => {
    const fixture = TestBed.createComponent(ScannerPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.funnel li')).toHaveLength(6);
    expect(element.textContent).toContain('Candidate funnel');
    expect(element.textContent).toContain('do not measure trade quality');
    expect(element.querySelectorAll('.microbar')).toHaveLength(2);
  });

  it('exposes extreme movement as elevated risk and not a buy signal', () => {
    const fixture = TestBed.createComponent(ScannerPage);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Extreme move · elevated risk, not a buy signal',
    );
  });

  it('can filter to exclusions and preserves reasons', () => {
    const fixture = TestBed.createComponent(ScannerPage);
    fixture.componentInstance.setFilter('Excluded');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('SYNC');
    expect(text).toContain('SYND');
    expect(text).toContain('SYNA');
    expect(text).toContain('outside the 100%–600% preset range');
    expect(text).toContain('below the 3× preset minimum');
    expect(text).toContain('market input is stale');
  });

  it('does not render order submission controls', () => {
    const fixture = TestBed.createComponent(ScannerPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')).toBeNull();
    expect(element.textContent).not.toContain('Buy');
    expect(element.textContent).not.toContain('Submit order');
  });

  it('fails closed with explicit reconnecting, recovering and stale guidance', () => {
    const realtime = TestBed.inject(ScannerRealtimeService);
    const fixture = TestBed.createComponent(ScannerPage);

    realtime.connectionLost();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Existing values are retained as stale evidence; do not act on them.',
    );

    realtime.connectionRestored();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Live updates are paused while an authoritative snapshot is recovered.',
    );

    realtime.recoveryFailed();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Scanner evidence is stale and qualification must not be used.',
    );
  });

  it('renders correction provenance without creating an action control', () => {
    const realtime = TestBed.inject(ScannerRealtimeService);
    const current = realtime.run();
    realtime.applyDelta({
      eventId: 'correction-205',
      eventType: 'scanner.updated',
      schemaVersion: 1,
      stream: 'scanner:synthetic:low-float-momentum',
      sequence: 205,
      runId: 'corrected-run',
      supersedesRunId: current.runId,
      correctionReason: 'Vendor corrected the source snapshot.',
      asOf: '2026-09-29T12:00:00Z',
      upserts: [],
      removals: [],
    });
    const fixture = TestBed.createComponent(ScannerPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('Corrected snapshot');
    expect(element.textContent).toContain('Vendor corrected the source snapshot.');
    expect(element.querySelector('.correction')?.getAttribute('role')).toBe('status');
    expect(element.querySelector('button')).toBeNull();
  });

  it('hides candidate evidence for loading, denied and failed availability', () => {
    const realtime = TestBed.inject(ScannerRealtimeService);
    const fixture = TestBed.createComponent(ScannerPage);

    realtime.beginInitialLoad();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Loading authoritative scanner evidence',
    );
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();

    realtime.accessDenied();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Scanner access denied');
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();

    realtime.beginInitialLoad();
    realtime.initialLoadFailed();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Scanner unavailable');
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();
  });

  it('renders an authoritative empty state without a candidate table', () => {
    const realtime = TestBed.inject(ScannerRealtimeService);
    realtime.replaceFromSnapshot({ ...realtime.run(), candidates: [] }, 300);
    const fixture = TestBed.createComponent(ScannerPage);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'authoritative scanner snapshot contains no candidates',
    );
    expect((fixture.nativeElement as HTMLElement).querySelector('table')).toBeNull();
  });
});
