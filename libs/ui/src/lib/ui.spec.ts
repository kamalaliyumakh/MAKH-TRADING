import { TestBed } from '@angular/core/testing';

import { FoundationStatus } from './ui';

describe('FoundationStatus', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoundationStatus],
    }).compileComponents();
  });

  it('renders the supplied foundation status', () => {
    const fixture = TestBed.createComponent(FoundationStatus);
    fixture.componentRef.setInput('label', 'Paper foundation');
    fixture.componentRef.setInput('detail', 'No live connection');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Paper foundation');
    expect(fixture.nativeElement.textContent).toContain('No live connection');
  });
});
