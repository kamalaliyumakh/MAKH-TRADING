import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { DashboardRealtimeCoordinator } from './dashboard-realtime.coordinator';

@Component({
  selector: 'makh-dashboard-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './dashboard-page.html',
  styleUrl: './dashboard-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPage implements OnInit, OnDestroy {
  private readonly dashboard = inject(DashboardService);
  private readonly realtime = inject(DashboardRealtimeCoordinator);
  readonly snapshot = this.dashboard.snapshot;
  readonly state = this.dashboard.state;
  readonly message = this.dashboard.message;

  ngOnInit(): void {
    void this.realtime.start();
  }

  ngOnDestroy(): void {
    void this.realtime.stop();
  }
}
