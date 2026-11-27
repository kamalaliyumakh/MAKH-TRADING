import { Routes } from '@angular/router';
import { DashboardPage } from './dashboard/dashboard-page';
import { ScannerPage } from './scanner/scanner-page';
import { SymbolWorkspacePage } from './symbol-workspace/symbol-workspace-page';
import { TradingPage } from './trading/trading-page';
import { RiskConsolePage } from './risk-console/risk-console-page';
import { JournalPage } from './journal/journal-page';
import { ReportsPage } from './reports/reports-page';
import { AdministrationPage } from './administration/administration-page';
import { localUatAuthGuard } from './auth/auth.guard';
import { LoginPage } from './auth/login-page';
import { RegisterPage } from './auth/register-page';
import { VerifyEmailPage } from './auth/verify-email-page';
import { ForgotPasswordPage } from './auth/forgot-password-page';
import { ResetPasswordPage } from './auth/reset-password-page';
import { TwoFactorPage } from './auth/two-factor-page';

export const routes: Routes = [
  { path: 'login', component: LoginPage, title: 'Sign In — MAKH Trading' },
  { path: 'register', component: RegisterPage, title: 'Register — MAKH Trading' },
  { path: 'verify-email', component: VerifyEmailPage, title: 'Verify Email — MAKH Trading' },
  {
    path: 'forgot-password',
    component: ForgotPasswordPage,
    title: 'Forgot Password — MAKH Trading',
  },
  {
    path: 'reset-password',
    component: ResetPasswordPage,
    title: 'Reset Password — MAKH Trading',
  },
  {
    path: 'two-factor',
    component: TwoFactorPage,
    title: 'Two-Factor Authentication — MAKH Trading',
  },
  {
    path: 'app',
    component: DashboardPage,
    canActivate: [localUatAuthGuard],
    title: 'Trading Dashboard — MAKH Trading',
  },
  {
    path: 'app/scanner',
    component: ScannerPage,
    canActivate: [localUatAuthGuard],
    title: 'Candidate Scanner — MAKH Trading',
  },
  {
    path: 'app/trading',
    component: TradingPage,
    canActivate: [localUatAuthGuard],
    title: 'Paper Trading — MAKH Trading',
  },
  {
    path: 'app/risk',
    component: RiskConsolePage,
    canActivate: [localUatAuthGuard],
    title: 'Risk Console — MAKH Trading',
  },
  {
    path: 'app/journal',
    component: JournalPage,
    canActivate: [localUatAuthGuard],
    title: 'Trading Journal — MAKH Trading',
  },
  {
    path: 'app/reports',
    component: ReportsPage,
    canActivate: [localUatAuthGuard],
    title: 'Reports — MAKH Trading',
  },
  {
    path: 'app/admin',
    component: AdministrationPage,
    canActivate: [localUatAuthGuard],
    title: 'Administration — MAKH Trading',
  },
  {
    path: 'app/symbols/:symbol',
    component: SymbolWorkspacePage,
    canActivate: [localUatAuthGuard],
    title: 'Symbol Workspace — MAKH Trading',
  },
  { path: '', pathMatch: 'full', redirectTo: 'app' },
  { path: '**', redirectTo: 'login' },
];
