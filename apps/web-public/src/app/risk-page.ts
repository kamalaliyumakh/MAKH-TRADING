import { DOCUMENT } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { legalDocuments } from './legal-documents';

@Component({
  selector: 'makh-risk-page',
  imports: [RouterLink],
  template: `
    <article class="public-page legal-page">
      <header class="page-hero">
        <p class="page-eyebrow">Legal and risk</p>
        <h1>Trading and product risk disclosures</h1>
        <p class="page-lede">
          Read these disclosures before using MAKH. They cannot cover every market, legal, tax,
          technology or personal circumstance. Obtain qualified professional advice where
          appropriate.
        </p>
        <dl class="document-meta" aria-label="Document information">
          <div>
            <dt>Document</dt>
            <dd>{{ document.documentId }}</dd>
          </div>
          <div>
            <dt>Version</dt>
            <dd>{{ document.version }}</dd>
          </div>
          <div>
            <dt>Review date</dt>
            <dd>{{ document.reviewedOn }}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{{ document.status }}</dd>
          </div>
        </dl>
      </header>

      <nav class="contents" aria-label="Risk disclosure contents">
        <strong>On this page</strong><a href="#market-loss">Market loss</a
        ><a href="#execution">Liquidity and execution</a><a href="#stops">Stops, gaps and halts</a
        ><a href="#data-social">Data and social risk</a
        ><a href="#technology">Technology and broker</a><a href="#paper">Paper limitations</a
        ><a href="#responsibility">Self-directed responsibility</a>
      </nav>

      <section id="market-loss">
        <h2>Market loss and exceptional moves</h2>
        <p>
          Trading can result in partial or total loss of capital. Low-priced and low-float
          securities may move rapidly and can be more vulnerable to volatility, illiquidity, limited
          public information and manipulation.
        </p>
        <p>
          A reported gain between 100% and 600% is an exceptional-movement and heightened-risk
          signal. It is not a recommendation, a valuation conclusion or a promise of continued
          appreciation.
        </p>
      </section>
      <section id="execution">
        <h2>Liquidity, spreads and execution</h2>
        <p>
          Displayed prices may not be executable. Spreads can widen, available depth can disappear,
          and orders may be rejected, delayed or partially filled. A marketable-limit order limits
          price but does not guarantee execution.
        </p>
      </section>
      <section id="stops">
        <h2>Stops, gaps and trading halts</h2>
        <p>
          A stop or protective order does not guarantee an exit at its trigger price. Gaps,
          volatility, halts, thin liquidity, provider outages and broker limitations can produce
          losses larger than a planned stop.
        </p>
      </section>
      <section id="data-social">
        <h2>Market data, evidence and social manipulation</h2>
        <p>
          Quotes, float, volume, news, filings and social indicators may be delayed, incomplete,
          corrected, unavailable or defined differently by providers. Social activity may be
          inaccurate, manipulated or unrelated to issuer fundamentals; it cannot verify a catalyst
          or authorize an order.
        </p>
      </section>
      <section id="technology">
        <h2>Technology, connectivity and broker authority</h2>
        <p>
          Network, software, identity, market-data and broker services can fail. MAKH may block new
          entries when critical state is stale or unknown. The broker remains authoritative for
          accepted orders, executions, live positions and buying power.
        </p>
      </section>
      <section id="paper">
        <h2>Paper and historical-result limitations</h2>
        <p>
          Paper trading, backtests, simulations and historical analysis do not reproduce all
          live-market conditions. Simulated fills, liquidity, fees and slippage may differ
          materially from live execution, and past or simulated results do not predict future
          outcomes.
        </p>
      </section>
      <section id="responsibility">
        <h2>Self-directed use and no guarantee</h2>
        <p>
          You remain responsible for your decisions, account security, broker agreements, taxes and
          compliance with laws applicable to you. MAKH does not custody funds or securities and does
          not promise profit, loss prevention, uninterrupted service or execution at a displayed
          price.
        </p>
        <aside class="draft-notice">
          <strong>Legal completion required.</strong> Governing entity, jurisdiction, eligibility,
          liability, dispute, tax and final effective-date language require qualified approval
          before publication.
        </aside>
      </section>

      <section class="source-note" aria-labelledby="resources-title">
        <h2 id="resources-title">Independent investor resources</h2>
        <p>
          These official resources provide general education and do not approve MAKH or replace
          professional advice.
        </p>
        <ul>
          <li>
            <a href="https://www.sec.gov/about/reports-publications/investorpubsmicrocapstock"
              >U.S. SEC: Microcap Stock — A Guide for Investors</a
            >
          </li>
          <li>
            <a
              href="https://www.finra.org/investors/insights/stop-orders-factors-consider-during-volatile-markets"
              >FINRA: Stop Orders During Volatile Markets</a
            >
          </li>
          <li>
            <a
              href="https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/social-media-stock-scams"
              >Investor.gov: Social Media and Stock Tip Scams</a
            >
          </li>
        </ul>
      </section>

      <nav class="page-actions" aria-label="Risk page actions">
        <button type="button" (click)="printPage()">Print this draft</button
        ><a routerLink="/">Return home</a>
      </nav>
      <p class="consent-boundary">
        This public informational page does not record acceptance. Versioned acknowledgement will
        occur only in an approved authenticated onboarding flow where required.
      </p>
    </article>
  `,
})
export class RiskPage {
  private readonly browserDocument = inject(DOCUMENT);
  protected readonly document = legalDocuments.risk;

  protected printPage(): void {
    this.browserDocument.defaultView?.print();
  }
}
