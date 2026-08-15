import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import {
  DatetimeCustomEvent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonDatetime,
} from '@ionic/angular/standalone';
import { Dayjs } from 'dayjs';
import { LanguageService } from '../../../@shared/data/theme/language.service';
import { OfficeTimeFacade } from '../../data';
import {
  datetimeValues,
  holidayHighlights,
} from '../../util/office-time.utils';
import { DateTimeHighlight } from '../../model/office-time.types';

@Component({
  selector: 'app-dash-freedays-edit',
  templateUrl: './dash-freedays-edit.component.html',
  styleUrls: ['./dash-freedays-edit.component.scss'],
  imports: [IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonDatetime],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashFreedaysEditComponent {
  readonly #facade = inject(OfficeTimeFacade);
  readonly locale = inject(LanguageService).locale;

  readonly title = input<string | undefined>();
  readonly freedays = input<string[]>([]);

  readonly holidays = input<DateTimeHighlight[], Dayjs[] | null | undefined>(
    [],
    { transform: holidayHighlights }
  );

  updateFreeDatesFromCalender(event: DatetimeCustomEvent) {
    this.#facade.setFreedays(datetimeValues(event.detail.value));
  }
}
