/* ─── why ─────────────────────────────────────────────────────────
 * The group's name arrives as an input rather than a key of its own:
 * the same seven buttons mean "on which days do I take this" to a pill
 * and "on which days does this come round" to a task, and @shared owns
 * neither wording.
 * ───────────────────────────────────────────────────────────────── */
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { ISO_WEEKDAYS, IsoWeekday } from '../../../model/app.types';
import { localizedWeekday } from '../../../util/formatting/date-format.utils';

@Component({
  selector: 'app-weekday-picker',
  templateUrl: './weekday-picker.component.html',
  styleUrls: ['./weekday-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton],
})
export class WeekdayPickerComponent {
  readonly weekdays = input.required<readonly IsoWeekday[]>();
  readonly groupLabel = input<string>();
  readonly toggled = output<IsoWeekday>();

  readonly days = ISO_WEEKDAYS;

  label(day: IsoWeekday): string {
    return localizedWeekday(day, 'short');
  }

  fullLabel(day: IsoWeekday): string {
    return localizedWeekday(day, 'long');
  }

  isOn(day: IsoWeekday): boolean {
    return this.weekdays().includes(day);
  }
}
