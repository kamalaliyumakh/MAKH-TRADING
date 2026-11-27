import { TestBed } from '@angular/core/testing';
import { JournalPage } from './journal-page';

describe('JournalPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [JournalPage] }).compileComponents();
  });

  it('presents process review before outcome metrics', () => {
    const fixture = TestBed.createComponent(JournalPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Review decisions, evidence and discipline—not just outcomes.');
    expect(text.indexOf('Journal entry is disabled')).toBeLessThan(
      text.indexOf('Positive outcomes'),
    );
  });

  it('shows lifecycle, evidence and incomplete-review states', () => {
    const fixture = TestBed.createComponent(JournalPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Draft');
    expect(text).toContain('Reviewed');
    expect(text).toContain('Archived');
    expect(text).toContain('Awaiting outcome review');
    expect(text).toContain('evidence links');
  });

  it('keeps the workspace read-only and non-authoritative', () => {
    const fixture = TestBed.createComponent(JournalPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('form')).toBeNull();
    expect(element.textContent).toContain('Synthetic, non-authoritative and non-executable');
  });

  it('renders review and result visualizations accessibly', () => {
    const fixture = TestBed.createComponent(JournalPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.ring[role="img"]')?.getAttribute('aria-label')).toContain(
      'percent',
    );
    expect(element.querySelectorAll('.result-bar')).toHaveLength(3);
  });
});
