import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { FoundationStatus } from '@makh/ui';
import { LocalUatAuthService } from './auth/local-uat-auth.service';

@Component({
  selector: 'makh-root',
  imports: [RouterOutlet, FoundationStatus],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly auth = inject(LocalUatAuthService);
  protected readonly authRoute = signal(true);

  constructor() {
    this.setRouteState(this.router.url);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) this.setRouteState(event.urlAfterRedirects);
    });
  }

  protected logout(): void {
    void this.auth.logout(this.router);
  }

  protected skipToContent(event: Event): void {
    event.preventDefault();
    document.getElementById('portal-content')?.focus();
  }

  private setRouteState(url: string): void {
    this.authRoute.set(
      url.startsWith('/login') ||
        url.startsWith('/register') ||
        url.startsWith('/verify-email') ||
        url.startsWith('/forgot-password') ||
        url.startsWith('/reset-password') ||
        url.startsWith('/two-factor'),
    );
  }
}
