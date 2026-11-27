import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ContainmentAction, RiskConsoleService } from './risk-console.service';

@Component({
  selector: 'makh-risk-console-page',
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './risk-console-page.html',
  styleUrl: './risk-console-page.scss',
})
export class RiskConsolePage implements OnInit {
  readonly risk = inject(RiskConsoleService);
  readonly selectedAction = signal<ContainmentAction | null>(null);
  readonly reason = signal('');
  ngOnInit(): void {
    this.risk.load();
  }
  review(action: ContainmentAction): void {
    this.selectedAction.set(action);
    this.reason.set('');
  }
  requestPreview(action: ContainmentAction): void {
    this.risk.preview(action, this.reason());
  }
  clear(): void {
    this.selectedAction.set(null);
    this.reason.set('');
  }
}
