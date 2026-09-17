import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { ISO_MONTHS, IsoMonth } from '../../../model/app.types';
import { localizedMonth } from '../../../util/formatting/date-format.utils';

@Component({
  selector: 'app-month-picker',
  templateUrl: './month-picker.component.html',
  styleUrls: ['./month-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton],
})
export class MonthPickerComponent {
  readonly months = input.required<readonly IsoMonth[]>();
  readonly groupLabel = input<string>();
  readonly toggled = output<IsoMonth>();

  readonly all = ISO_MONTHS;

  label(month: IsoMonth): string {
    return localizedMonth(month, 'short');
  }

  fullLabel(month: IsoMonth): string {
    return localizedMonth(month, 'long');
  }

  isOn(month: IsoMonth): boolean {
    return this.months().includes(month);
  }
}
