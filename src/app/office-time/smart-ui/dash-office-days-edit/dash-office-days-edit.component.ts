import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
  freedayHighlights,
  holidayHighlights,
} from '../../util/office-time.utils';
import { DateTimeHighlight } from '../../model/office-time.types';

@Component({
  selector: 'app-dash-office-days-edit',
  templateUrl: './dash-office-days-edit.component.html',
  styleUrls: ['./dash-office-days-edit.component.scss'],
  imports: [IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonDatetime],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashOfficeDaysEditComponent {
  readonly #facade = inject(OfficeTimeFacade);
  readonly locale = inject(LanguageService).locale;
  readonly title = input<string | undefined>();
  readonly officedays = input<string[]>([]);
  readonly holidays = input<DateTimeHighlight[], Dayjs[] | null | undefined>(
    [],
    { transform: holidayHighlights }
  );
  readonly freedays = input<
    DateTimeHighlight[],
    readonly string[] | null | undefined
  >([], { transform: freedayHighlights });
  readonly holidaysAndFreedays = computed(() => {
    return [...this.holidays(), ...this.freedays()];
  });

  updateOfficeDates(event: DatetimeCustomEvent) {
    this.#facade.setOfficedays(datetimeValues(event.detail.value));
  }
}
