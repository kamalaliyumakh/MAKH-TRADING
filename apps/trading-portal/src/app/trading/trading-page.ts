import { CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TradingService } from './trading.service';

@Component({
  selector: 'makh-trading-page',
  imports: [CurrencyPipe, ReactiveFormsModule],
  templateUrl: './trading-page.html',
  styleUrl: './trading-page.scss',
})
export class TradingPage implements OnInit {
  readonly trading = inject(TradingService);
  readonly ticket = new FormGroup({
    symbol: new FormControl('SYNB', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/^[A-Z]{1,5}$/)],
    }),
    side: new FormControl<'Buy' | 'Sell'>('Buy', { nonNullable: true }),
    quantity: new FormControl(100, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(500000)],
    }),
    limitPrice: new FormControl(5.25, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(3), Validators.max(7)],
    }),
    stopPrice: new FormControl<number | null>(4.75, [Validators.min(0.01)]),
  });

  ngOnInit(): void {
    this.trading.loadContext();
  }

  review(): void {
    if (this.ticket.invalid) return;
    this.trading.preview(this.ticket.getRawValue());
  }

  clearConfirmation(): void {
    this.trading.confirmation.set(null);
  }
}
