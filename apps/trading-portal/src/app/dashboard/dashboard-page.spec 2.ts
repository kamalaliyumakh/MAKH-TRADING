import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('places paper mode and entry lock before financial context', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('PAPER — simulated account');
    expect(text).toContain('New entries are locked');
    expect(text.indexOf('New entries are locked')).toBeLessThan(text.indexOf('Daily P&L'));
  });

  it('labels pnl and account values as synthetic and unreconciled', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Synthetic estimate · not reconciled broker truth');
    expect(text).toContain('Buying power');
    expect(text).toContain('Unavailable');
    expect(text).toContain('Not broker authoritative');
  });

  it('shows dependency effects and blocks authority-dependent operations', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Risk service');
    expect(text).toContain('New entries remain blocked');
    expect(text).toContain('Broker');
    expect(text).toContain('Orders and account truth unavailable');
    expect(text).toContain('Reconciliation');
  });

  it('keeps candidate gain secondary and includes risk labels', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.indexOf('Watch candidates')).toBeGreaterThan(text.indexOf('Connectivity'));
    expect(text).toContain('Candidate gain is secondary context');
    expect(text).toContain('Extreme move · elevated risk');
  });

  it('contains navigation only and no consequential controls', () => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('form')).toBeNull();
    expect(element.textContent).not.toContain('Submit paper limit order');
    expect(element.textContent).not.toContain('Block new entries');
  });
});
