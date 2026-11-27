import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

interface SessionDto {
  readonly subject: string;
  readonly roles: readonly string[];
  readonly accountMode: string;
  readonly accountId: string;
}

export interface RiskLimit {
  readonly code: string;
  readonly label: string;
  readonly used: number;
  readonly limit: number;
  readonly remaining: number;
  readonly exceeded: boolean;
  readonly unit: string;
}
interface RiskPauseDto {
  readonly pauseId: string;
  readonly scope: number;
  readonly scopeReference: string;
  readonly effectiveFrom: string;
  readonly reason: string;
  readonly evidenceSha256: string;
}
interface RiskBreachDto {
  readonly breachId: string;
  readonly severity: number;
  readonly rule: string;
  readonly state: string;
  readonly detectedAt: string;
  readonly evidenceSha256: string;
}
interface RiskOverviewDto {
  readonly accountId: string;
  readonly policyVersion: string;
  readonly asOf: string;
  readonly entryLocked: boolean;
  readonly reconciliationHealthy: boolean;
  readonly limits: readonly RiskLimit[];
  readonly activePauses: readonly RiskPauseDto[];
  readonly openBreaches: readonly RiskBreachDto[];
  readonly canMutateRisk: boolean;
  readonly createsTradingAuthority: boolean;
  readonly evidenceSha256: string;
}
export interface RiskBreach {
  readonly id: string;
  readonly severity: 'Critical' | 'High';
  readonly rule: string;
  readonly state: string;
  readonly detectedAt: string;
}
export type ContainmentAction = 'Block' | 'Cancel' | 'Liquidate';
export interface ContainmentPreview {
  readonly commandId: string;
  readonly accountId: string;
  readonly action: number;
  readonly policyVersion: string;
  readonly entryLocked: boolean;
  readonly reconciliationRequired: boolean;
  readonly finalConfirmationEnabled: boolean;
  readonly reason: string;
  readonly correlationId: string;
  readonly createdAt: string;
  readonly impact: {
    readonly openOrdersAffected: number;
    readonly positionsAffected: number;
    readonly estimatedGrossNotional: number;
    readonly currency: string;
    readonly dataAsOf: string;
    readonly source: string;
    readonly warnings: readonly string[];
    readonly evidenceSha256: string;
    readonly isAuthoritative: boolean;
    readonly canExecute: boolean;
  };
  readonly evidenceSha256: string;
  readonly createsTradingAuthority: boolean;
  readonly mutatesTradingState: boolean;
}

@Injectable({ providedIn: 'root' })
export class RiskConsoleService {
  private static readonly maximumOverviewRows = 1_000;
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly policyVersion = signal('Unavailable');
  readonly asOf = signal('Not loaded');
  readonly entryBlocked = signal(true);
  readonly reconciliationHealthy = signal(false);
  readonly limits = signal<readonly RiskLimit[]>([]);
  readonly breaches = signal<readonly RiskBreach[]>([]);
  readonly pauses = signal<readonly string[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = signal<string | null>(null);
  readonly containmentPreview = signal<ContainmentPreview | null>(null);
  readonly accountId = signal<string | null>(null);

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.accountId.set(null);
    this.containmentPreview.set(null);
    this.http
      .get<SessionDto>('/api/v1/session')
      .pipe(
        switchMap((session) => {
          if (!this.isSafeSession(session)) {
            throw new Error('Invalid authenticated session context.');
          }
          this.accountId.set(session.accountId);
          return this.http.get<RiskOverviewDto>(
            `/api/v1/risk/accounts/${encodeURIComponent(session.accountId)}/overview`,
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (overview) => {
          if (!this.isSafeOverview(overview, this.accountId())) {
            this.failClosed('Risk overview evidence is invalid. Entry remains blocked.');
            return;
          }
          this.policyVersion.set(overview.policyVersion);
          this.asOf.set(new Date(overview.asOf).toLocaleString());
          this.entryBlocked.set(overview.entryLocked);
          this.reconciliationHealthy.set(overview.reconciliationHealthy);
          this.limits.set(overview.limits);
          this.pauses.set(
            overview.activePauses.map(
              (pause) =>
                `${pause.scope === 0 ? 'Account' : pause.scopeReference} pause · active · ${pause.reason}`,
            ),
          );
          this.breaches.set(
            overview.openBreaches.map((breach) => ({
              id: breach.breachId,
              severity: breach.severity === 0 ? 'Critical' : 'High',
              rule: breach.rule,
              state: breach.state,
              detectedAt: new Date(breach.detectedAt).toLocaleString(),
            })),
          );
          this.loading.set(false);
        },
        error: () => {
          this.failClosed('Authenticated risk context is unavailable. Entry remains blocked.');
        },
      });
  }

  canMutateRisk(): boolean {
    return false;
  }

  preview(action: ContainmentAction, reason: string): void {
    const normalizedReason = reason.trim();
    const policyVersion = this.policyVersion();
    const accountId = this.accountId();
    if (
      normalizedReason.length < 10 ||
      normalizedReason.length > 500 ||
      /token|secret/i.test(normalizedReason) ||
      policyVersion === 'Unavailable' ||
      accountId === null
    ) {
      this.rejectPreview(
        'A reason of at least 10 characters and authenticated account/policy context are required.',
      );
      return;
    }

    const actionCode = { Block: 0, Cancel: 1, Liquidate: 2 }[action];
    if (!Number.isInteger(actionCode)) {
      this.rejectPreview('Containment action is invalid. No action has run.');
      return;
    }
    const commandId = crypto.randomUUID();
    const correlationId = crypto.randomUUID();
    let sessionRevalidated = false;
    this.previewLoading.set(true);
    this.previewError.set(null);
    this.containmentPreview.set(null);
    this.http
      .get<SessionDto>('/api/v1/session')
      .pipe(
        switchMap((session) => {
          if (
            !this.isSafeSession(session) ||
            session.accountId.toLowerCase() !== accountId.toLowerCase()
          ) {
            throw new Error('Authenticated account context changed.');
          }
          sessionRevalidated = true;
          return this.http.get<{ token: string }>('/auth/csrf');
        }),
        switchMap(({ token }) =>
          this.http.post<ContainmentPreview>(
            '/api/v1/risk/containment/preview',
            {
              commandId,
              accountId,
              action: actionCode,
              expectedPolicyVersion: policyVersion,
              reason: normalizedReason,
              correlationId,
            },
            { headers: new HttpHeaders({ 'X-CSRF-TOKEN': token }) },
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (preview) => {
          if (
            !this.isSafePreview(
              preview,
              commandId,
              accountId,
              actionCode,
              policyVersion,
              normalizedReason,
              correlationId,
            )
          ) {
            this.rejectPreview('Containment preview evidence is invalid. No action has run.');
            return;
          }
          this.containmentPreview.set(preview);
          this.previewLoading.set(false);
        },
        error: () => {
          if (!sessionRevalidated) {
            this.failClosed(
              'Authenticated risk context changed or was revoked. Entry remains blocked.',
            );
            return;
          }
          this.rejectPreview('Containment preview is unavailable. No action has run.');
        },
      });
  }

  private failClosed(message: string): void {
    this.policyVersion.set('Unavailable');
    this.asOf.set('Unavailable');
    this.entryBlocked.set(true);
    this.reconciliationHealthy.set(false);
    this.limits.set([]);
    this.pauses.set([]);
    this.breaches.set([]);
    this.accountId.set(null);
    this.containmentPreview.set(null);
    this.previewError.set(null);
    this.loading.set(false);
    this.loadError.set(message);
  }

  private isSafeSession(value: SessionDto): boolean {
    return (
      typeof value?.subject === 'string' &&
      value.subject.length > 0 &&
      Array.isArray(value.roles) &&
      value.accountMode === 'paper' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.accountId)
    );
  }

  private isSafeOverview(value: RiskOverviewDto, accountId: string | null): boolean {
    const asOf = Date.parse(value?.asOf);
    const ageMilliseconds = Date.now() - asOf;
    const limitCodes = new Set<string>();
    const pauseIds = new Set<string>();
    const breachIds = new Set<string>();
    return (
      accountId !== null &&
      value?.accountId?.toLowerCase() === accountId.toLowerCase() &&
      typeof value.policyVersion === 'string' &&
      value.policyVersion.length > 0 &&
      Number.isFinite(asOf) &&
      ageMilliseconds >= -60_000 &&
      ageMilliseconds <= 5 * 60_000 &&
      value.entryLocked === true &&
      value.reconciliationHealthy === false &&
      Array.isArray(value.limits) &&
      value.limits.length <= RiskConsoleService.maximumOverviewRows &&
      value.limits.every((limit) => {
        const safe = this.isSafeLimit(limit) && !limitCodes.has(limit.code);
        limitCodes.add(limit?.code);
        return safe;
      }) &&
      Array.isArray(value.activePauses) &&
      value.activePauses.length <= RiskConsoleService.maximumOverviewRows &&
      value.activePauses.every((pause) => {
        const effectiveFrom = Date.parse(pause?.effectiveFrom);
        const safe =
          typeof pause?.pauseId === 'string' &&
          pause.pauseId.length > 0 &&
          !pauseIds.has(pause.pauseId) &&
          (pause.scope === 0 || pause.scope === 1) &&
          typeof pause.scopeReference === 'string' &&
          pause.scopeReference.length > 0 &&
          typeof pause.reason === 'string' &&
          pause.reason.length > 0 &&
          Number.isFinite(effectiveFrom) &&
          effectiveFrom <= asOf &&
          /^[a-f0-9]{64}$/i.test(pause.evidenceSha256);
        pauseIds.add(pause?.pauseId);
        return safe;
      }) &&
      Array.isArray(value.openBreaches) &&
      value.openBreaches.length <= RiskConsoleService.maximumOverviewRows &&
      value.openBreaches.every((breach) => {
        const safe =
          typeof breach?.breachId === 'string' &&
          breach.breachId.length > 0 &&
          !breachIds.has(breach.breachId) &&
          (breach.severity === 0 || breach.severity === 1) &&
          typeof breach.rule === 'string' &&
          breach.rule.length > 0 &&
          typeof breach.state === 'string' &&
          breach.state.length > 0 &&
          /^[a-f0-9]{64}$/i.test(breach.evidenceSha256) &&
          Number.isFinite(Date.parse(breach.detectedAt)) &&
          Date.parse(breach.detectedAt) <= asOf;
        breachIds.add(breach?.breachId);
        return safe;
      }) &&
      /^[a-f0-9]{64}$/i.test(value.evidenceSha256) &&
      value.canMutateRisk === false &&
      value.createsTradingAuthority === false
    );
  }

  private isSafeLimit(value: RiskLimit): boolean {
    return (
      typeof value?.code === 'string' &&
      value.code.length > 0 &&
      typeof value.label === 'string' &&
      value.label.length > 0 &&
      Number.isFinite(value.used) &&
      value.used >= 0 &&
      Number.isFinite(value.limit) &&
      value.limit > 0 &&
      Number.isFinite(value.remaining) &&
      value.remaining === Math.max(0, value.limit - value.used) &&
      value.exceeded === value.used > value.limit &&
      typeof value.unit === 'string' &&
      value.unit.length > 0
    );
  }

  private isSafePreview(
    value: ContainmentPreview,
    commandId: string,
    accountId: string,
    action: number,
    policyVersion: string,
    reason: string,
    correlationId: string,
  ): boolean {
    const createdAt = Date.parse(value?.createdAt);
    const dataAsOf = Date.parse(value?.impact?.dataAsOf);
    const now = Date.now();
    return (
      value?.commandId === commandId &&
      value.accountId?.toLowerCase() === accountId.toLowerCase() &&
      value.action === action &&
      value.policyVersion === policyVersion &&
      value.entryLocked === true &&
      value.reconciliationRequired === (action !== 0) &&
      value.finalConfirmationEnabled === false &&
      value.reason === reason &&
      value.correlationId === correlationId &&
      Number.isFinite(createdAt) &&
      createdAt <= now + 60_000 &&
      now - createdAt <= 5 * 60_000 &&
      value.createsTradingAuthority === false &&
      value.mutatesTradingState === false &&
      value.impact?.isAuthoritative === false &&
      value.impact.canExecute === false &&
      Number.isSafeInteger(value.impact.openOrdersAffected) &&
      value.impact.openOrdersAffected >= 0 &&
      Number.isSafeInteger(value.impact.positionsAffected) &&
      value.impact.positionsAffected >= 0 &&
      Number.isFinite(value.impact.estimatedGrossNotional) &&
      value.impact.estimatedGrossNotional >= 0 &&
      value.impact.currency === 'USD' &&
      Number.isFinite(dataAsOf) &&
      dataAsOf <= createdAt &&
      createdAt - dataAsOf <= 5 * 60_000 &&
      value.impact.source === 'synthetic-read-model' &&
      Array.isArray(value.impact.warnings) &&
      value.impact.warnings.length <= 20 &&
      value.impact.warnings.every(
        (warning) => typeof warning === 'string' && warning.length > 0 && warning.length <= 500,
      ) &&
      /^[a-f0-9]{64}$/i.test(value.impact.evidenceSha256) &&
      /^[a-f0-9]{64}$/i.test(value.evidenceSha256)
    );
  }

  private rejectPreview(message: string): void {
    this.entryBlocked.set(true);
    this.previewLoading.set(false);
    this.containmentPreview.set(null);
    this.previewError.set(message);
  }
}
