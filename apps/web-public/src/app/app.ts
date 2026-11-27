import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { Meta } from '@angular/platform-browser';
import { filter } from 'rxjs';

@Component({
  selector: 'makh-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly meta = inject(Meta);
  private readonly menuPanel = viewChild<ElementRef<HTMLElement>>('menuPanel');

  protected readonly menuOpen = signal(false);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.closeMenu(false);
      this.updateMetadata();
      this.document.getElementById('main-content')?.focus();
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
    if (this.menuOpen()) setTimeout(() => this.focusableMenuItems()[0]?.focus());
  }

  protected closeMenu(returnFocus = false): void {
    this.menuOpen.set(false);
    if (returnFocus) this.document.getElementById('menu-button')?.focus();
  }

  protected trapMenuFocus(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeMenu(true);
      return;
    }
    if (event.key !== 'Tab') return;
    const items = this.focusableMenuItems();
    if (items.length === 0) return;
    const first = items[0];
    const last = items.at(-1)!;
    if (event.shiftKey && this.document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && this.document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  @HostListener('window:resize', ['$event'])
  protected closeDesktopMenu(event: Event): void {
    if ((event.target as Window).innerWidth >= 768) this.closeMenu(false);
  }

  private focusableMenuItems(): HTMLElement[] {
    return Array.from(
      this.menuPanel()?.nativeElement.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      ) ?? [],
    );
  }

  private updateMetadata(): void {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    const description = route.snapshot.data['description'] as string | undefined;
    const robots = route.snapshot.data['robots'] as string | undefined;
    const title = route.snapshot.title;
    if (title) {
      this.meta.updateTag({ property: 'og:title', content: title });
      this.meta.updateTag({ name: 'twitter:title', content: title });
    }
    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({ name: 'twitter:description', content: description });
    }
    if (robots) this.meta.updateTag({ name: 'robots', content: robots });
  }
}
