import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'makh-platform-page',
  imports: [RouterLink],
  template: `
    <article class="public-page">
      <header class="page-hero">
        <p class="page-eyebrow">Platform workflow</p>
        <h1>One accountable path from market signal to broker outcome.</h1>
        <p class="page-lede">
          MAKH separates discovery, evidence, risk authority and execution so no signal or
          social-media claim becomes an order by itself.
        </p>
      </header>
      <section aria-labelledby="flow-title">
        <h2 id="flow-title">Five controlled stages</h2>
        <ol class="stage-grid">
          <li>
            <strong>1 · Discover</strong>
            <p>
              Screen an approved universe using transparent, versioned price, relative-volume,
              float, spread and liquidity criteria.
            </p>
          </li>
          <li>
            <strong>2 · Verify</strong>
            <p>
              Review timestamped issuer communications, filings and approved news. Social attention
              cannot confirm a catalyst alone.
            </p>
          </li>
          <li>
            <strong>3 · Evaluate</strong>
            <p>
              Build a proposal with entry, quantity and exit plan; apply current account, exposure,
              liquidity, loss and health limits.
            </p>
          </li>
          <li>
            <strong>4 · Submit</strong>
            <p>
              Only an eligible proposal may be submitted to a supported regulated broker after
              explicit user intent.
            </p>
          </li>
          <li>
            <strong>5 · Reconcile and review</strong>
            <p>
              Track acknowledgements, partial fills, cancellation, protection and mismatches, then
              preserve the decision and outcome.
            </p>
          </li>
        </ol>
      </section>
      <section class="boundary-panel" aria-labelledby="boundary-title">
        <h2 id="boundary-title">Know the trust boundary</h2>
        <div class="card-grid">
          <article>
            <h3>MAKH</h3>
            <p>Organizes research, evaluates policy and reconciles reported state.</p>
          </article>
          <article>
            <h3>Data providers</h3>
            <p>
              Supply market, reference and evidence data subject to freshness, corrections and
              rights.
            </p>
          </article>
          <article>
            <h3>Regulated broker</h3>
            <p>
              Remains authoritative for accepted orders, executions, positions and buying power.
            </p>
          </article>
        </div>
      </section>
      <section class="paper-panel" aria-labelledby="paper-title">
        <h2 id="paper-title">Paper first by design</h2>
        <p>
          MAKH must prove safety, reconciliation and review workflows in paper trading before any
          separately authorized, limited-capital live use.
        </p>
      </section>
      <nav class="page-actions" aria-label="Platform next steps">
        <a class="primary-link" routerLink="/request-access">Request access</a
        ><a routerLink="/legal/risk">Read risk disclosures</a>
      </nav>
    </article>
  `,
})
export class PlatformPage {}
