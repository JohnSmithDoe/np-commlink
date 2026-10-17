/* ─── why ─────────────────────────────────────────────────────────
 * The group's name arrives as an input rather than a key of its own:
 * the same seven buttons mean "on which days do I take this" to a pill
 * and "on which days does this come round" to a task, and @shared owns
 * neither wording.
 * ───────────────────────────────────────────────────────────────── */
import { Component, computed, input, output } from '@angular/core';
import { ISO_WEEKDAYS, IsoWeekday } from '../../../model/app.types';
import { localizedWeekday } from '../../../util/formatting/date-format.utils';
import {
  ChipOption,
  OptionChipsComponent,
} from '../option-chips/option-chips.component';

const weekdayOptions = (): ChipOption<IsoWeekday>[] =>
  ISO_WEEKDAYS.map((day) => ({
    key: String(day),
    value: day,
    label: localizedWeekday(day, 'short'),
    a11yLabel: localizedWeekday(day, 'long'),
  }));

@Component({
  selector: 'app-weekday-picker',
  templateUrl: './weekday-picker.component.html',
  styleUrl: './weekday-picker.component.scss',
  imports: [OptionChipsComponent],
})
export class WeekdayPickerComponent {
  readonly weekdays = input.required<readonly IsoWeekday[]>();
  readonly groupLabel = input<string>();
  readonly toggled = output<IsoWeekday>();

  protected readonly options = weekdayOptions();

  protected readonly selected = computed(() => this.weekdays().map(String));
}
