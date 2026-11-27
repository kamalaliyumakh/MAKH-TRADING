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

export type OrderSide = 'Buy' | 'Sell';

export interface PaperOrderDraft {
  readonly symbol: string;
  readonly side: OrderSide;
  readonly quantity: number;
  readonly limitPrice: number;
  readonly stopPrice: number | null;
}

export interface PaperOrderConfirmation extends PaperOrderDraft {
  readonly requestId: string;
  readonly accountId: string;
  readonly estimatedNotional: number;
  readonly mode: 'PAPER';
  readonly authority: 'Synthetic review only';
  readonly entryLocked: boolean;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly evidenceSha256: string;
  readonly canSubmit: boolean;
  readonly createsTradingAuthority: boolean;
  readonly mutatesTradingState: boolean;
}

export interface PaperOrderRow {
  readonly id: string;
  readonly symbol: string;
  readonly side: OrderSide;
  readonly quantity: number;
  readonly filled: number;
  readonly limitPrice: number;
  readonly state: string;
  readonly updatedAt: string;
}

export interface PaperPositionRow {
  readonly symbol: string;
  readonly quantity: number;
  readonly averageCost: number;
  readonly mark: number;
  readonly realizedPnl: number;
  readonly unrealizedPnl: number;
  readonly protection: 'Protected' | 'Under-protected' | 'Over-protected' | 'Pending' | 'Unknown';
}

interface PaperTradingOverviewDto {
  readonly accountId: string;
  readonly asOf: string;
  readonly reconciliation: 'Matched' | 'Mismatch' | 'Unknown';
  readonly entryLocked: boolean;
  readonly orders: readonly PaperOrderRow[];
  readonly positions: readonly PaperPositionRow[];
  readonly evidenceSha256: string;
  readonly isAuthoritative: boolean;
  readonly canSubmit: boolean;
  readonly createsTradingAuthority: boolean;
}

@Injectable({ providedIn: 'root' })
export class TradingService {
  private static readonly maximumOverviewRows = 1_000;
  private static readonly orderStates = new Set([
    'Pending',
    'Accepted',
    'Partially filled',
    'Filled',
    'Cancelled',
    'Rejected',
    'Unknown',
  ]);
  private static readonly protectionStates = new Set([
    'Protected',
    'Under-protected',
    'Over-protected',
    'Pending',
    'Unknown',
  ]);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly accountId = signal<string | null>(null);
  readonly asOf = signal<string | null>(null);
  readonly contextLoading = signal(false);
  readonly contextError = signal<string | null>(null);
  readonly reconciliation = signal<'Matched' | 'Mismatch' | 'Unknown'>('Unknown');
  readonly orders = signal<readonly PaperOrderRow[]>([]);
  readonly positions = signal<readonly PaperPositionRow[]>([]);
  readonly confirmation = signal<PaperOrderConfirmation | null>(null);
  readonly reviewLoading = signal(false);
  readonly reviewError = signal<string | null>(null);

  loadContext(): void {
    this.failClosed(null);
    this.contextLoading.set(true);
    this.http
      .get<SessionDto>('/api/v1/session')
      .pipe(
        switchMap((session) => {
          if (!this.isSafeSession(session)) throw new Error('Invalid session.');
          this.accountId.set(session.accountId);
          return this.http.get<PaperTradingOverviewDto>(
            `/api/v1/trading/accounts/${encodeURIComponent(session.accountId)}/overview`,
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (overview) => {
          if (!this.isSafeOverview(overview, this.accountId())) {
            this.failClosed('Paper-trading overview evidence is invalid.');
            return;
          }
          this.reconciliation.set(overview.reconciliation);
          this.asOf.set(overview.asOf);
          this.orders.set(overview.orders);
          this.positions.set(overview.positions);
          this.contextLoading.set(false);
        },
        error: (error: unknown) =>
          this.failClosed(
            error instanceof Error && error.message === 'Invalid session.'
              ? 'Authenticated paper-account context is invalid.'
              : 'Authenticated paper-account context is unavailable.',
          ),
      });
  }

  preview(draft: PaperOrderDraft): void {
    if (!this.isSafeDraft(draft)) {
      this.rejectReview('Paper-order intent is invalid. No order was created.');
      return;
    }
    const accountId = this.accountId();
    if (accountId === null) {
      this.rejectReview('Authenticated paper-account context is required.');
      return;
    }
    const requestId = crypto.randomUUID();
    let sessionRevalidated = false;
    this.reviewLoading.set(true);
    this.reviewError.set(null);
    this.confirmation.set(null);
    this.http
      .get<SessionDto>('/api/v1/session')
      .pipe(
        switchMap((session) => {
          if (
            !this.isSafeSession(session) ||
            session.accountId.toLowerCase() !== accountId.toLowerCase()
          )
            throw new Error('Session changed.');
          sessionRevalidated = true;
          return this.http.get<{ token: string }>('/auth/csrf');
        }),
        switchMap(({ token }) =>
          this.http.post<PaperOrderConfirmation>(
            '/api/v1/trading/orders/review',
            { requestId, accountId, ...draft },
            { headers: new HttpHeaders({ 'X-CSRF-TOKEN': token }) },
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (review) => {
          if (!this.isSafeReview(review, requestId, accountId, draft)) {
            this.rejectReview('Paper-order review evidence is invalid. No order was created.');
            return;
          }
          this.confirmation.set(review);
          this.reviewLoading.set(false);
        },
        error: () => {
          if (!sessionRevalidated) {
            this.failClosed('Authenticated paper-account context changed or was revoked.');
            return;
          }
          this.rejectReview('Paper-order review is unavailable. No order was created.');
        },
      });
  }

  canSubmit(): boolean {
    return false;
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

  private isSafeDraft(value: PaperOrderDraft): boolean {
    return (
      /^[A-Z]{1,5}$/.test(value?.symbol) &&
      (value.side === 'Buy' || value.side === 'Sell') &&
      Number.isSafeInteger(value.quantity) &&
      value.quantity > 0 &&
      value.quantity <= 500_000 &&
      Number.isFinite(value.limitPrice) &&
      value.limitPrice >= 3 &&
      value.limitPrice <= 7 &&
      (value.stopPrice === null || (Number.isFinite(value.stopPrice) && value.stopPrice > 0))
    );
  }

  private isSafeOverview(value: PaperTradingOverviewDto, accountId: string | null): boolean {
    const asOf = Date.parse(value?.asOf);
    const age = Date.now() - asOf;
    const orderIds = new Set<string>();
    const positionSymbols = new Set<string>();
    return (
      accountId !== null &&
      value?.accountId?.toLowerCase() === accountId.toLowerCase() &&
      Number.isFinite(asOf) &&
      age >= -60_000 &&
      age <= 5 * 60_000 &&
      value.reconciliation === 'Mismatch' &&
      value.entryLocked === true &&
      Array.isArray(value.orders) &&
      value.orders.length <= TradingService.maximumOverviewRows &&
      value.orders.every((order) => {
        const updatedAt = Date.parse(order?.updatedAt);
        const safe =
          typeof order?.id === 'string' &&
          order.id.length > 0 &&
          !orderIds.has(order.id) &&
          /^[A-Z]{1,5}$/.test(order.symbol) &&
          (order.side === 'Buy' || order.side === 'Sell') &&
          Number.isSafeInteger(order.quantity) &&
          order.quantity > 0 &&
          order.quantity <= 500_000 &&
          Number.isSafeInteger(order.filled) &&
          order.filled >= 0 &&
          order.filled <= order.quantity &&
          Number.isFinite(order.limitPrice) &&
          order.limitPrice >= 3 &&
          order.limitPrice <= 7 &&
          TradingService.orderStates.has(order.state) &&
          Number.isFinite(updatedAt) &&
          updatedAt <= asOf + 60_000;
        orderIds.add(order?.id);
        return safe;
      }) &&
      Array.isArray(value.positions) &&
      value.positions.length <= TradingService.maximumOverviewRows &&
      value.positions.every((position) => {
        const expectedUnrealizedPnl = (position?.mark - position?.averageCost) * position?.quantity;
        const safe =
          /^[A-Z]{1,5}$/.test(position?.symbol) &&
          !positionSymbols.has(position.symbol) &&
          Number.isSafeInteger(position.quantity) &&
          position.quantity >= 0 &&
          Number.isFinite(position.averageCost) &&
          position.averageCost >= 0 &&
          Number.isFinite(position.mark) &&
          position.mark > 0 &&
          Number.isFinite(position.realizedPnl) &&
          Number.isFinite(position.unrealizedPnl) &&
          Math.abs(position.unrealizedPnl - expectedUnrealizedPnl) <= 0.01 &&
          TradingService.protectionStates.has(position.protection);
        positionSymbols.add(position?.symbol);
        return safe;
      }) &&
      /^[a-f0-9]{64}$/i.test(value.evidenceSha256) &&
      value.isAuthoritative === false &&
      value.canSubmit === false &&
      value.createsTradingAuthority === false
    );
  }

  private isSafeReview(
    value: PaperOrderConfirmation,
    requestId: string,
    accountId: string,
    draft: PaperOrderDraft,
  ): boolean {
    const createdAt = Date.parse(value?.createdAt);
    const expiresAt = Date.parse(value?.expiresAt);
    const now = Date.now();
    return (
      value?.requestId === requestId &&
      value.accountId?.toLowerCase() === accountId.toLowerCase() &&
      value.symbol === draft.symbol &&
      value.side === draft.side &&
      value.quantity === draft.quantity &&
      value.limitPrice === draft.limitPrice &&
      value.stopPrice === draft.stopPrice &&
      value.estimatedNotional === draft.quantity * draft.limitPrice &&
      value.mode === 'PAPER' &&
      value.authority === 'Synthetic review only' &&
      value.entryLocked === true &&
      Number.isFinite(createdAt) &&
      Number.isFinite(expiresAt) &&
      createdAt <= now + 60_000 &&
      now < expiresAt &&
      expiresAt - createdAt === 2 * 60_000 &&
      /^[a-f0-9]{64}$/i.test(value.evidenceSha256) &&
      value.canSubmit === false &&
      value.createsTradingAuthority === false &&
      value.mutatesTradingState === false
    );
  }

  private rejectReview(message: string): void {
    this.reviewLoading.set(false);
    this.confirmation.set(null);
    this.reviewError.set(message);
  }

  private failClosed(message: string | null): void {
    this.accountId.set(null);
    this.asOf.set(null);
    this.reconciliation.set('Unknown');
    this.orders.set([]);
    this.positions.set([]);
    this.confirmation.set(null);
    this.reviewLoading.set(false);
    this.reviewError.set(null);
    this.contextLoading.set(false);
    this.contextError.set(message);
  }
}
