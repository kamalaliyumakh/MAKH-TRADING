import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { legalDocuments } from './legal-documents';

@Component({
  selector: 'makh-privacy-page',
  imports: [RouterLink],
  template: `
    <article class="public-page legal-page">
      <header class="page-hero">
        <p class="page-eyebrow">Privacy</p>
        <h1>Privacy notice</h1>
        <p class="page-lede">
          This product-design draft explains how MAKH expects to handle personal and account-related
          information. An approved notice with the legal entity, controller details and applicable
          rights will replace it before public launch.
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

      <nav class="contents" aria-label="Privacy notice contents">
        <strong>On this page</strong><a href="#data">Data categories</a
        ><a href="#purposes">Purposes</a><a href="#sharing">Providers and transfers</a
        ><a href="#retention">Retention</a><a href="#rights">Choices and rights</a
        ><a href="#analytics">Analytics and cookies</a
        ><a href="#security-privacy">Security and contact</a>
      </nav>

      <section id="data">
        <h2>Data we may process</h2>
        <p>
          Depending on approved functionality, MAKH may process identity and contact details,
          consent records, session and security events, connected-account references, trading
          activity needed to provide the service, preferences, support communications and product
          diagnostics.
        </p>
        <p>
          <strong>Do not provide broker passwords.</strong> Request-access and public support
          channels must not collect account numbers, government identifiers, passwords, tokens or
          confidential trading instructions.
        </p>
      </section>
      <section id="purposes">
        <h2>Why information may be used</h2>
        <p>
          Potential purposes include authentication and authorization, providing market and trading
          workflows, enforcing risk controls, reconciling broker state, protecting the service,
          meeting approved legal obligations and improving permitted product functionality. A
          documented lawful basis and data inventory remain required for each purpose.
        </p>
      </section>
      <section id="sharing">
        <h2>Providers and international processing</h2>
        <p>
          Approved identity, hosting, market-data, evidence, broker, communications and security
          providers may process limited information where necessary and contractually permitted.
          Provider roles, destinations, safeguards and onward-transfer controls are not yet approved
          and will be disclosed before launch.
        </p>
      </section>
      <section id="retention">
        <h2>Retention and records</h2>
        <p>
          Retention depends on record type, approved legal obligations, security needs and provider
          licences. Trading, risk, consent and audit evidence may require different periods from
          ordinary telemetry. No provisional planning period should be treated as legally approved.
        </p>
      </section>
      <section id="rights">
        <h2>Your choices and rights</h2>
        <p>
          Depending on the applicable jurisdiction and legal basis, individuals may have rights
          relating to access, correction, deletion, restriction, objection, portability, consent
          withdrawal or complaint. Some trading, security or audit evidence may need to be
          preserved. Verified request and appeal procedures remain pending.
        </p>
      </section>
      <section id="analytics">
        <h2>Analytics and cookies</h2>
        <p>
          Necessary storage may support security and basic operation. Nonessential analytics will
          remain disabled until an approved consent basis and preference control exist. Analytics
          must not capture broker credentials, account values, order content, identity-provider
          codes or authenticated portal content.
        </p>
      </section>
      <section id="security-privacy">
        <h2>Security, controller and contact</h2>
        <p>
          MAKH is designed around minimization, least privilege, encryption, logging redaction and
          non-production masking. No security measure eliminates all risk.
        </p>
        <aside class="draft-notice">
          <strong>Privacy completion required.</strong> The legal entity/controller, address,
          privacy contact, lawful bases, processor roles, retention schedule, cross-border
          safeguards, complaint authority and request procedure remain pending qualified review.
        </aside>
      </section>

      <section class="source-note" aria-labelledby="privacy-resource-title">
        <h2 id="privacy-resource-title">Privacy-law baseline</h2>
        <p>
          The current discovery baseline includes the
          <a href="https://ndpc.gov.ng/download/nigeria-data-protection-act-2023"
            >Nigeria Data Protection Act 2023</a
          >. Applicable jurisdictions and final obligations remain unconfirmed.
        </p>
      </section>
      <nav class="page-actions" aria-label="Privacy page actions">
        <a class="primary-link" routerLink="/request-access">Request-access preview</a
        ><a routerLink="/security">Review security</a>
      </nav>
      <p class="consent-boundary">
        No privacy request, cookie preference or consent is transmitted by this local draft.
        Approved controls will be implemented only after the responsible entity and legal basis are
        confirmed.
      </p>
    </article>
  `,
})
export class PrivacyPage {
  protected readonly document = legalDocuments.privacy;
}
