import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'makh-about-page',
  imports: [RouterLink],
  template: `
    <article class="public-page">
      <header class="page-hero">
        <p class="page-eyebrow">About MAKH</p>
        <h1>Built for disciplined self-directed trading.</h1>
        <p class="page-lede">
          MAKH is being developed as a risk-controlled workspace combining market-data screening,
          evidence provenance, explicit risk evaluation, broker integration and audit-ready review.
        </p>
      </header>
      <section aria-labelledby="audience-title">
        <h2 id="audience-title">Clear operating scope</h2>
        <div class="card-grid two-up">
          <article>
            <h3>Who it is for</h3>
            <p>
              Authorized account owners making their own decisions through supported brokers and
              data services within an approved operating jurisdiction.
            </p>
          </article>
          <article>
            <h3>Who it is not for</h3>
            <p>
              It is not a guarantee of performance, professional legal, tax or investment advice, or
              authority to manage third-party funds.
            </p>
          </article>
        </div>
      </section>
      <section class="boundary-panel" aria-labelledby="boundaries-title">
        <h2 id="boundaries-title">Operating boundaries</h2>
        <ul class="plain-list">
          <li>MAKH does not custody funds or securities.</li>
          <li>The broker remains authoritative for account and execution state.</li>
          <li>No scanner, social post or large price move is a recommendation.</li>
          <li>Controlled live use requires a separate documented approval.</li>
        </ul>
      </section>
      <section aria-labelledby="build-title">
        <h2 id="build-title">How we build</h2>
        <div class="principle-row">
          <span>Paper first</span><span>Fail closed</span><span>Centralize risk</span
          ><span>Reconcile truth</span><span>Preserve evidence</span>
        </div>
      </section>
      <nav class="page-actions" aria-label="About next steps">
        <a class="primary-link" routerLink="/platform">Explore the platform</a
        ><a routerLink="/request-access">Request access</a>
      </nav>
    </article>
  `,
})
export class AboutPage {}
