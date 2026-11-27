import { TestBed } from '@angular/core/testing';
import { AdministrationPage } from './administration-page';

describe('AdministrationPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AdministrationPage] }).compileComponents();
  });

  it('places the privileged boundary before configuration state', () => {
    const fixture = TestBed.createComponent(AdministrationPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.indexOf('Privileged changes are disabled')).toBeLessThan(
      text.indexOf('Configuration registry'),
    );
    expect(text).toContain('fresh MFA');
  });

  it('shows separated roles and review coverage', () => {
    const fixture = TestBed.createComponent(AdministrationPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.roles section')).toHaveLength(3);
    expect(element.textContent).toContain('Operations administrator');
    expect(element.textContent).toContain('Risk administrator');
    expect(element.textContent).toContain('Auditor');
  });

  it('exposes unavailable configuration and denied audit evidence', () => {
    const fixture = TestBed.createComponent(AdministrationPage);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Identity directory');
    expect(text).toContain('Unavailable');
    expect(text).toContain('Denied');
    expect(text).toContain('Role lacks risk-policy permission');
  });

  it('is read-only and contains no privileged controls', () => {
    const fixture = TestBed.createComponent(AdministrationPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('button')).toBeNull();
    expect(element.querySelector('form')).toBeNull();
    expect(element.textContent).toContain(
      'No credentials, mutations, identity authority or trading authority',
    );
  });
});
