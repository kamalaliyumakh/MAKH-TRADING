import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ReportsService } from './reports.service';

@Component({
  selector: 'makh-reports-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: './reports-page.html',
  styleUrl: './reports-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportsPage {
  readonly report = inject(ReportsService).snapshot;
  readonly adherenceTotal = computed(
    () =>
      this.report.adherence.passed + this.report.adherence.breached + this.report.adherence.unknown,
  );
  readonly adherenceRate = computed(
    () => (this.adherenceTotal() === 0 ? 0 : (this.report.adherence.passed / this.adherenceTotal()) * 100),
  );

  pnlPoints(): string {
    const values = this.report.pnlTrend;
    if (values.length === 0 || values.some((value) => !Number.isFinite(value))) return '';
    if (values.length === 1) return `0,65`;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min;
    return values
      .map(
        (value, index) =>
          `${(index / (values.length - 1)) * 560},${span === 0 ? 65 : 130 - ((value - min) / span) * 100}`,
      )
      .join(' ');
  }

  strategyWidth(value: number): number {
    return Number.isFinite(value) ? Math.min((Math.abs(value) / 30) * 100, 100) : 0;
  }
}
