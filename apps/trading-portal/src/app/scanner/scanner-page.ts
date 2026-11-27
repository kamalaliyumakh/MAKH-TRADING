import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ScannerCandidateView } from './scanner-snapshot.service';
import { ScannerRealtimeService } from './scanner-realtime.service';
import { ScannerRealtimeCoordinator } from './scanner-realtime.coordinator';

type CandidateFilter = 'Qualified' | 'All' | 'Excluded';

@Component({
  selector: 'makh-scanner-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './scanner-page.html',
  styleUrl: './scanner-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScannerPage implements OnInit, OnDestroy {
  private readonly realtime = inject(ScannerRealtimeService);
  private readonly coordinator = inject(ScannerRealtimeCoordinator);
  readonly run = this.realtime.run;
  readonly realtimeState = this.realtime.state;
  readonly lastSequence = this.realtime.lastSequence;
  readonly recoveryReason = this.realtime.recoveryReason;
  readonly correctionReason = this.realtime.correctionReason;
  readonly availability = this.realtime.availability;
  readonly streamGuidance = computed(() => {
    switch (this.realtimeState()) {
      case 'Reconnecting':
        return 'Connection lost. Existing values are retained as stale evidence; do not act on them.';
      case 'Recovering':
        return 'Live updates are paused while an authoritative snapshot is recovered.';
      case 'Stale':
        return 'Recovery failed. Scanner evidence is stale and qualification must not be used.';
      default:
        return 'Authoritative sequence is current for this local evidence view.';
    }
  });
  readonly filter = signal<CandidateFilter>('Qualified');
  readonly rows = computed(() => {
    const filter = this.filter();
    return this.run().candidates.filter(
      (candidate) => filter === 'All' || candidate.state === filter,
    );
  });
  readonly qualifiedCount = computed(
    () => this.run().candidates.filter((candidate) => candidate.state === 'Qualified').length,
  );
  readonly funnel = computed(() => {
    const candidates = this.run().candidates;
    return [
      { label: 'Universe', count: candidates.length, tone: 'neutral' },
      {
        label: 'Price $3–$7',
        count: candidates.filter((item) => item.price != null && item.price >= 3 && item.price <= 7)
          .length,
        tone: 'blue',
      },
      {
        label: 'RVOL ≥ 3×',
        count: candidates.filter((item) => item.relativeVolume != null && item.relativeVolume >= 3)
          .length,
        tone: 'violet',
      },
      {
        label: 'Float ≤ 500k',
        count: candidates.filter((item) => item.publicFloat != null && item.publicFloat <= 500_000)
          .length,
        tone: 'blue',
      },
      {
        label: 'Gain 100%–600%',
        count: candidates.filter(
          (item) => item.gainPercent != null && item.gainPercent >= 100 && item.gainPercent <= 600,
        ).length,
        tone: 'violet',
      },
      { label: 'Qualified', count: this.qualifiedCount(), tone: 'teal' },
    ];
  });

  ngOnInit(): void {
    void this.coordinator.start();
  }

  ngOnDestroy(): void {
    void this.coordinator.stop();
  }

  barWidth(value: number | null, maximum: number): string {
    return `${Math.max(0, Math.min(((value ?? 0) / maximum) * 100, 100))}%`;
  }

  setFilter(value: string): void {
    if (value === 'Qualified' || value === 'All' || value === 'Excluded') this.filter.set(value);
  }

  trackCandidate(_: number, candidate: ScannerCandidateView): string {
    return candidate.securityId;
  }
}
