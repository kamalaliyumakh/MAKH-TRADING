import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renders a clearly locked paper foundation', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Paper mode · Foundation only');
    expect(compiled.textContent).toContain('Entry locked');
    expect(compiled.textContent).toContain('risk authority');
  });

  it('moves keyboard focus to portal content without navigating', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const skipLink = compiled.querySelector<HTMLAnchorElement>('.skip-link')!;
    const main = compiled.querySelector<HTMLElement>('#portal-content')!;

    skipLink.click();

    expect(document.activeElement).toBe(main);
  });
});
