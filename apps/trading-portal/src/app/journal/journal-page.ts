import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { JournalService } from './journal.service';

@Component({
  selector: 'makh-journal-page',
  imports: [DatePipe, DecimalPipe],
  templateUrl: './journal-page.html',
  styleUrl: './journal-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JournalPage implements OnInit {
  private readonly journal = inject(JournalService);
  readonly snapshot = this.journal.snapshot;
  readonly state = this.journal.state;
  readonly message = this.journal.message;
  readonly summary = computed(() => {
    const entries = this.snapshot()?.entries ?? [];
    const reviewed = entries.filter((entry) => entry.resultPercent !== null);
    const wins = reviewed.filter((entry) => (entry.resultPercent ?? 0) > 0).length;
    const average =
      reviewed.length === 0
        ? 0
        : reviewed.reduce((total, entry) => total + (entry.resultPercent ?? 0), 0) /
          reviewed.length;
    return {
      total: entries.length,
      reviewed: reviewed.length,
      reviewRate: entries.length === 0 ? 0 : (reviewed.length / entries.length) * 100,
      winRate: reviewed.length === 0 ? 0 : (wins / reviewed.length) * 100,
      average,
    };
  });

  ngOnInit(): void {
    void this.journal.load();
  }

  resultWidth(result: number | null): number {
    return result === null ? 0 : Math.min(Math.abs(result) * 18, 100);
  }
}
