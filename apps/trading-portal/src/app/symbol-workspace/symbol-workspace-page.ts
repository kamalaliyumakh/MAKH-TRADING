import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SymbolWorkspaceService, SymbolWorkspaceView } from './symbol-workspace.service';
import { SymbolWorkspaceRealtimeCoordinator } from './symbol-workspace-realtime.coordinator';

@Component({
  selector: 'makh-symbol-workspace-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './symbol-workspace-page.html',
  styleUrl: './symbol-workspace-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbolWorkspacePage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly workspaceService = inject(SymbolWorkspaceService);
  private readonly realtime = inject(SymbolWorkspaceRealtimeCoordinator);
  readonly workspace = this.workspaceService.workspace;
  readonly state = this.workspaceService.state;
  readonly message = this.workspaceService.message;

  ngOnInit(): void {
    void this.realtime.start(this.route.snapshot.paramMap.get('symbol') ?? '');
  }

  ngOnDestroy(): void {
    void this.realtime.stop();
  }

  chartPoints(workspace: SymbolWorkspaceView): string {
    const values = workspace.pricePoints.map((point) => point.price);
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const span = maximum - minimum || 1;
    return values
      .map((price, index) => {
        const x = 10 + (index * 580) / (values.length - 1);
        const y = 170 - ((price - minimum) / span) * 140;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  chartArea(workspace: SymbolWorkspaceView): string {
    return `10,170 ${this.chartPoints(workspace)} 590,170`;
  }

  chartEndY(workspace: SymbolWorkspaceView): string {
    return this.chartPoints(workspace).split(' ').at(-1)?.split(',').at(1) ?? '170';
  }
}
