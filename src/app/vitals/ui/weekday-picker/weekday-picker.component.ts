import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { IsoWeekday } from '../../../@shared/model/app.types';
import { EVERY_DAY } from '../../util/vitals.factory';
import { WEEKDAY_FULL_LABEL, WEEKDAY_LABEL } from '../../util/pill.utils';

@Component({
  selector: 'app-weekday-picker',
  templateUrl: './weekday-picker.component.html',
  styleUrls: ['./weekday-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonButton, TranslatePipe],
})
export class WeekdayPickerComponent {
  readonly weekdays = input.required<readonly IsoWeekday[]>();
  readonly toggled = output<IsoWeekday>();

  readonly days = EVERY_DAY;
  readonly labels = WEEKDAY_LABEL;
  readonly fullLabels = WEEKDAY_FULL_LABEL;

  isOn(day: IsoWeekday): boolean {
    return this.weekdays().includes(day);
  }
}
