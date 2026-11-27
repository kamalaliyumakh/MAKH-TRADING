import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AdministrationService } from './administration.service';

@Component({
  selector: 'makh-administration-page',
  imports: [DatePipe],
  templateUrl: './administration-page.html',
  styleUrl: './administration-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrationPage {
  readonly admin = inject(AdministrationService).snapshot;
}
