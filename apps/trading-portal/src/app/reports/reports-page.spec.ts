import { TestBed } from '@angular/core/testing';
import { ReportsPage } from './reports-page';

describe('ReportsPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ReportsPage] }).compileComponents();
  });

  it('places report limitations before performance', () => {
    const fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.indexOf('Not a broker statement')).toBeLessThan(text.indexOf('Realized P&L'));
    expect(text).toContain('synthetic, unreconciled');
  });

  it('renders accessible trend and report dimensions', () => {
    const fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('svg[role="img"]')).not.toBeNull();
    expect(element.querySelectorAll('.strategies li')).toHaveLength(3);
    expect(element.querySelectorAll('.source-row:not(.header)')).toHaveLength(3);
  });

  it('shows partial quality and unknown adherence explicitly', () => {
    const fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Partial data');
    expect(text).toContain('1 breach · 2 unknown');
    expect(text).toContain('Fail-closed aggregation');
  });

  it('contains no forms or consequential controls', () => {
    const fixture = TestBed.createComponent(ReportsPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('form')).toBeNull();
  });
});
