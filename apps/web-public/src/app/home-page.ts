import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FoundationStatus } from '@makh/ui';

@Component({
  selector: 'makh-home-page',
  imports: [RouterLink, FoundationStatus],
  template: `
    <section class="hero">
      <div>
        <p class="eyebrow">Risk-controlled market research</p>
        <h1>Evidence first. Risk before every order.</h1>
        <p class="lede">
          MAKH is being built for self-directed paper trading before any separately approved live
          pilot. Scanner momentum never authorizes a trade by itself.
        </p>
        <div class="actions">
          <a class="primary" routerLink="/request-access">Request access</a>
          <a class="secondary" routerLink="/platform">Explore the platform</a>
        </div>
      </div>
      <aside class="product-preview" aria-label="Synthetic product preview">
        <div class="preview-header">
          <div><span class="preview-mark">M</span><strong>Market pulse</strong></div>
          <span class="paper-pill">PAPER</span>
        </div>
        <div class="quote-row">
          <div><small>SYNB · synthetic</small><strong>$5.42</strong></div>
          <span>+159.0%</span>
        </div>
        <svg
          class="hero-chart"
          viewBox="0 0 520 190"
          role="img"
          aria-labelledby="hero-chart-title hero-chart-desc"
        >
          <title id="hero-chart-title">Synthetic intraday price preview</title>
          <desc id="hero-chart-desc">
            An illustrative rising price line with substantial volatility. It is not market data.
          </desc>
          <defs>
            <linearGradient id="hero-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stop-color="#22c7a9" stop-opacity=".3" />
              <stop offset="1" stop-color="#22c7a9" stop-opacity="0" />
            </linearGradient>
          </defs>
          <g class="chart-grid"><path d="M0 35H520M0 95H520M0 155H520" /></g>
          <path
            class="chart-area"
            d="M0 158L42 148L76 153L112 128L150 138L190 102L230 112L270 72L310 91L352 42L392 61L430 29L470 48L520 18V190H0Z"
          />
          <path
            class="chart-line"
            d="M0 158L42 148L76 153L112 128L150 138L190 102L230 112L270 72L310 91L352 42L392 61L430 29L470 48L520 18"
          />
        </svg>
        <div class="preview-metrics">
          <div><small>Relative volume</small><strong>4.2×</strong></div>
          <div><small>Public float</small><strong>420k</strong></div>
          <div><small>Risk state</small><strong>Entry locked</strong></div>
        </div>
        <p class="preview-note">Illustrative interface · no recommendation or live data</p>
      </aside>
    </section>
    <section class="status" aria-label="Preview status">
      <makh-foundation-status
        label="Public application preview"
        detail="No account connection, recommendation, or live trading is available."
      />
    </section>
    <section class="content-section" aria-labelledby="workflow-title">
      <p class="eyebrow">Accountable workflow</p>
      <h2 id="workflow-title">From attention to reviewed outcome</h2>
      <ol class="workflow-list">
        <li>
          <strong>Discover</strong><span>Screen a defined universe with versioned criteria.</span>
        </li>
        <li>
          <strong>Verify</strong><span>Check filings and approved news with provenance.</span>
        </li>
        <li>
          <strong>Evaluate</strong><span>Apply current exposure, liquidity and loss limits.</span>
        </li>
        <li>
          <strong>Submit</strong><span>Send only an eligible proposal to a supported broker.</span>
        </li>
        <li>
          <strong>Review</strong
          ><span>Reconcile broker truth and preserve the decision record.</span>
        </li>
      </ol>
    </section>
    <section class="content-section" aria-labelledby="principles-title">
      <p class="eyebrow">Risk-first principles</p>
      <h2 id="principles-title">Controls are part of the product</h2>
      <div class="card-grid three-up">
        <article>
          <h3>Evidence</h3>
          <p>A candidate stays separate from verified issuer, filing and news evidence.</p>
        </article>
        <article>
          <h3>Hard limits</h3>
          <p>Risk policy is evaluated centrally before an eligible order can proceed.</p>
        </article>
        <article>
          <h3>Broker truth</h3>
          <p>
            The broker remains authoritative for orders, executions, positions and buying power.
          </p>
        </article>
      </div>
    </section>
    <section class="risk-panel" aria-labelledby="home-risk-title">
      <p class="eyebrow">Elevated-risk signal</p>
      <h2 id="home-risk-title">A 100%–600% move is not a recommendation.</h2>
      <p>
        Large gains can coincide with extreme volatility, thin liquidity, wide spreads, halts,
        manipulation and losses beyond a planned stop. They do not promise another gain.
      </p>
      <a routerLink="/legal/risk">Read the trading risk disclosures</a>
    </section>
    <section class="content-section faq" aria-labelledby="faq-title">
      <p class="eyebrow">Common questions</p>
      <h2 id="faq-title">Before requesting access</h2>
      <details>
        <summary>Does MAKH recommend stocks?</summary>
        <p>
          No. Candidates and rankings support self-directed research; they are not recommendations
          or buy signals.
        </p>
      </details>
      <details>
        <summary>Does MAKH hold funds or securities?</summary>
        <p>
          No. A supported regulated broker remains responsible for the brokerage account and
          authoritative execution state.
        </p>
      </details>
      <details>
        <summary>Can I trade live immediately?</summary>
        <p>
          No. The platform is designed for paper-first validation. Controlled live use requires
          separate authorization.
        </p>
      </details>
    </section>
  `,
  styles: `
    :host {
      display: block;
      width: min(calc(100% - 2rem), var(--makh-content-max));
      margin-inline: auto;
    }
    .hero {
      display: grid;
      grid-template-columns: minmax(0, 7fr) minmax(18rem, 5fr);
      gap: clamp(2rem, 7vw, 6rem);
      padding-block: clamp(4rem, 10vw, 8rem);
      align-items: center;
    }
    .eyebrow {
      margin: 0 0 var(--makh-space-4);
      color: var(--makh-color-brand-blue);
      font-size: var(--makh-text-sm);
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      max-width: 13ch;
      margin: 0;
      color: var(--makh-color-brand-navy);
      font-size: clamp(2.5rem, 7vw, 5.5rem);
      line-height: 0.98;
      letter-spacing: -0.05em;
    }
    .lede {
      max-width: 42rem;
      margin-block: var(--makh-space-6) 0;
      color: var(--makh-color-neutral-700);
      font-size: clamp(1.05rem, 2vw, 1.25rem);
      line-height: 1.65;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--makh-space-3);
      margin-top: var(--makh-space-8);
    }
    .actions a {
      display: inline-flex;
      min-height: var(--makh-control-default);
      align-items: center;
      justify-content: center;
      border-radius: var(--makh-radius-md);
      padding-inline: var(--makh-space-5);
      font-weight: 750;
      text-decoration: none;
    }
    .primary {
      color: var(--makh-color-neutral-0);
      background: var(--makh-color-brand-blue);
    }
    .secondary {
      border: 1px solid var(--makh-color-neutral-300);
      color: var(--makh-color-brand-navy);
      background: var(--makh-color-neutral-0);
    }
    .status {
      max-width: 42rem;
      padding-bottom: var(--makh-space-8);
    }
    .content-section,
    .risk-panel {
      padding-block: var(--makh-space-16);
    }
    h2 {
      max-width: 18ch;
      margin: 0 0 var(--makh-space-8);
      color: var(--makh-color-brand-navy);
      font-size: clamp(2rem, 4vw, 3.25rem);
      line-height: 1.08;
    }
    .workflow-list {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: var(--makh-space-4);
      padding: 0;
      list-style: none;
      counter-reset: workflow;
    }
    .workflow-list li,
    article {
      display: grid;
      gap: var(--makh-space-3);
      padding: var(--makh-space-5);
      border: 1px solid var(--makh-color-neutral-100);
      border-radius: var(--makh-radius-lg);
      background: var(--makh-color-neutral-0);
    }
    .workflow-list span,
    article p,
    .risk-panel p,
    details p {
      color: var(--makh-color-neutral-700);
      line-height: 1.6;
    }
    .card-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--makh-space-4);
    }
    article h3,
    article p {
      margin: 0;
    }
    .risk-panel {
      margin-block: var(--makh-space-8);
      padding-inline: clamp(1.5rem, 5vw, 4rem);
      border-radius: var(--makh-radius-lg);
      background: var(--makh-color-warning-surface);
    }
    .risk-panel a {
      color: var(--makh-color-brand-blue);
      font-weight: 750;
    }
    details {
      max-width: 52rem;
      padding-block: var(--makh-space-4);
      border-bottom: 1px solid var(--makh-color-neutral-300);
    }
    summary {
      cursor: pointer;
      color: var(--makh-color-brand-navy);
      font-weight: 750;
    }
    @media (max-width: 47.99rem) {
      .hero {
        grid-template-columns: 1fr;
        padding-block: var(--makh-space-16);
      }
      h1 {
        font-size: clamp(2.4rem, 13vw, 4rem);
      }
      .workflow-list,
      .card-grid {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class HomePage {}
