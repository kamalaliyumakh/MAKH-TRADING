import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'MAKH Trading Platform — Risk-Controlled Trading Workflow',
    data: {
      description:
        'Evidence-led stock discovery, risk checks, broker-state monitoring and a self-directed paper-first trading workflow.',
      robots: 'index,follow',
    },
    loadComponent: () => import('./home-page').then((module) => module.HomePage),
  },
  {
    path: 'platform',
    title: 'Platform — MAKH Trading',
    data: {
      description: 'Explore the MAKH discovery-to-review workflow and its safety boundaries.',
      robots: 'index,follow',
    },
    loadComponent: () => import('./platform-page').then((module) => module.PlatformPage),
  },
  {
    path: 'security',
    title: 'Security — MAKH Trading',
    data: {
      description: 'Review MAKH identity, authorization, risk, order and audit security controls.',
      robots: 'index,follow',
    },
    loadComponent: () => import('./security-page').then((module) => module.SecurityPage),
  },
  {
    path: 'status',
    title: 'Service Status — MAKH Trading',
    data: {
      description:
        'View the stated availability of MAKH public, data, evidence and broker components.',
      robots: 'index,follow',
    },
    loadComponent: () => import('./status-page').then((module) => module.StatusPage),
  },
  {
    path: 'about',
    title: 'About — MAKH Trading',
    data: {
      description:
        'Learn the MAKH mission, intended audience and self-directed operating boundaries.',
      robots: 'index,follow',
    },
    loadComponent: () => import('./about-page').then((module) => module.AboutPage),
  },
  {
    path: 'legal/risk',
    title: 'Trading Risk Disclosures — MAKH Trading',
    data: {
      description:
        'Read provisional low-priced-stock, liquidity, execution, market-data and technology risk disclosures.',
      robots: 'index,follow',
    },
    loadComponent: () => import('./risk-page').then((module) => module.RiskPage),
  },
  {
    path: 'privacy',
    title: 'Privacy Notice — MAKH Trading',
    data: {
      description:
        'Read the provisional MAKH data categories, purposes, provider, retention and privacy-rights notice.',
      robots: 'index,follow',
    },
    loadComponent: () => import('./privacy-page').then((module) => module.PrivacyPage),
  },
  {
    path: 'request-access',
    title: 'Request Access — MAKH Trading',
    data: {
      description: 'Submit a minimal local-preview expression of interest in MAKH access.',
      robots: 'noindex,nofollow',
    },
    loadComponent: () => import('./request-access-page').then((module) => module.RequestAccessPage),
  },
  {
    path: 'sign-in',
    title: 'Sign In — MAKH Trading',
    data: {
      description: 'Continue to the future approved MAKH identity provider securely.',
      robots: 'noindex,nofollow',
    },
    loadComponent: () => import('./sign-in-page').then((module) => module.SignInPage),
  },
  { path: '**', redirectTo: '' },
];
