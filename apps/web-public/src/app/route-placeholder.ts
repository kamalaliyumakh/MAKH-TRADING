import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'makh-route-placeholder',
  imports: [RouterLink],
  template: `
    <section>
      <p class="eyebrow">Local foundation preview</p>
      <h1>{{ title }}</h1>
      <p>
        This route is reserved for its approved implementation work package. No external service or
        live capability is connected.
      </p>
      <a routerLink="/">Return home</a>
    </section>
  `,
  styles: `
    :host {
      display: block;
      width: min(calc(100% - 2rem), var(--makh-content-max));
      margin-inline: auto;
    }
    section {
      max-width: 48rem;
      padding-block: clamp(4rem, 10vw, 8rem);
    }
    .eyebrow {
      color: var(--makh-color-brand-blue);
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }
    h1 {
      margin: 0;
      color: var(--makh-color-brand-navy);
      font-size: clamp(2.4rem, 7vw, 4.5rem);
    }
    p {
      color: var(--makh-color-neutral-700);
      font-size: var(--makh-text-lg);
      line-height: 1.6;
    }
    a {
      color: var(--makh-color-brand-blue);
      font-weight: 750;
    }
  `,
})
export class RoutePlaceholder {
  private readonly document = inject(DOCUMENT);
  protected readonly title =
    this.document.location?.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => segment.replaceAll('-', ' '))
      .join(' / ') || 'Page';
}
