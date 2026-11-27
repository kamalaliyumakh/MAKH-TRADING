import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'makh-status-page',
  imports: [RouterLink],
  template: `
    <article class="public-page">
      <header class="page-hero">
        <p class="page-eyebrow">Service status</p>
        <h1>MAKH service status</h1>
        <p class="page-lede">
          Public availability will appear here after approved monitoring is connected.
          Account-specific broker, market-data and reconciliation state belongs only in the
          authorized portal.
        </p>
      </header>
      <section class="status-summary" aria-labelledby="summary-title">
        <div>
          <p class="status-label">Preview state</p>
          <h2 id="summary-title">Monitoring not connected</h2>
        </div>
        <p class="status-time"><strong>Timestamp:</strong> static local build</p>
      </section>
      <section aria-labelledby="components-title">
        <h2 id="components-title">Public components</h2>
        <ul class="component-list">
          <li>
            <span><strong>Public web</strong><small>Local preview only</small></span
            ><span class="state neutral">Not publicly monitored</span>
          </li>
          <li>
            <span><strong>Authentication</strong><small>Provider disabled</small></span
            ><span class="state neutral">Not connected</span>
          </li>
          <li>
            <span><strong>API</strong><small>No public environment</small></span
            ><span class="state neutral">Not connected</span>
          </li>
          <li>
            <span><strong>Market data</strong><small>No approved provider feed</small></span
            ><span class="state neutral">Not connected</span>
          </li>
          <li>
            <span
              ><strong>Broker connectivity</strong><small>No account or adapter active</small></span
            ><span class="state neutral">Not connected</span>
          </li>
        </ul>
      </section>
      <section class="boundary-panel" aria-labelledby="incident-title">
        <h2 id="incident-title">Incidents and maintenance</h2>
        <p>
          No public incident feed or subscription service is connected in this local foundation.
          This statement is not an uptime claim.
        </p>
      </section>
      <section aria-labelledby="authority-title">
        <h2 id="authority-title">Broker authority remains separate</h2>
        <p>
          Public status never confirms that a broker accepted, cancelled or filled an order. The
          connected broker and reconciled portal record remain authoritative for account activity.
        </p>
        <p><a routerLink="/security">Review security boundaries</a></p>
      </section>
    </article>
  `,
})
export class StatusPage {}
