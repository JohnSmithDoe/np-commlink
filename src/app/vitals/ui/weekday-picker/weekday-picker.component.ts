import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { IonButton } from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { IsoWeekday } from '../../../@shared/model/app.types';
import { localizedWeekday } from '../../../@shared/util/formatting/date-format.utils';
import { EVERY_DAY } from '../../util/vitals.factory';

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
