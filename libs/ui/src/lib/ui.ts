import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'makh-foundation-status',
  imports: [],
  template: `
    <aside class="foundation-status" role="status">
      <strong>{{ label() }}</strong>
      <span>{{ detail() }}</span>
    </aside>
  `,
  styles: `
    :host {
      display: block;
    }
    .foundation-status {
      display: grid;
      gap: var(--makh-space-1);
      padding: var(--makh-space-4);
      border: 1px solid var(--makh-color-neutral-100);
      border-radius: var(--makh-radius-md);
      background: var(--makh-color-info-surface);
    }
    span {
      color: var(--makh-color-neutral-700);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoundationStatus {
  readonly label = input.required<string>();
  readonly detail = input.required<string>();
}
