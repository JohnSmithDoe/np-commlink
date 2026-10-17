import { Component, computed, input, output } from '@angular/core';
import { ISO_MONTHS, IsoMonth } from '../../../model/app.types';
import { localizedMonth } from '../../../util/formatting/date-format.utils';
import {
  ChipOption,
  OptionChipsComponent,
} from '../option-chips/option-chips.component';

const monthOptions = (): ChipOption<IsoMonth>[] => {
  return ISO_MONTHS.map((month) => {
    return {
      key: String(month),
      value: month,
      label: localizedMonth(month, 'short'),
      a11yLabel: localizedMonth(month, 'long'),
    };
  });
};

@Component({
  selector: 'app-month-picker',
  templateUrl: './month-picker.component.html',
  styleUrl: './month-picker.component.scss',
  imports: [OptionChipsComponent],
})
export class MonthPickerComponent {
  readonly months = input.required<readonly IsoMonth[]>();
  readonly groupLabel = input<string>();
  readonly toggled = output<IsoMonth>();

  protected readonly options = monthOptions();

  protected readonly selected = computed(() => this.months().map(String));
}
