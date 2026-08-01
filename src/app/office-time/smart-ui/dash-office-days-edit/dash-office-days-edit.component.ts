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
import { LanguageService } from '../../../@shared/util/theme/language.service';
import { OfficeTimeFacade } from '../../data';
import {
  dayjsFromString,
  dayjsToString,
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
  readonly officedays = input<Array<Dayjs> | undefined | null>();
  readonly holidays = input<DateTimeHighlight[], Dayjs[] | null | undefined>(
    [],
    { transform: holidayHighlights }
  );
  readonly freedays = input<DateTimeHighlight[], Dayjs[] | null | undefined>(
    [],
    { transform: freedayHighlights }
  );
  readonly holidaysAndFreedays = computed(() => {
    return [...this.holidays(), ...this.freedays()];
  });
  readonly officedates = computed(
    () => this.officedays()?.map((day) => dayjsToString(day)) ?? []
  );

  updateOfficeDates(event: DatetimeCustomEvent) {
    const dateStrings = Array.isArray(event.detail.value)
      ? event.detail.value
      : [event.detail.value];
    const dates = dateStrings
      .filter((date): date is string => !!date)
      .map((date) => dayjsFromString(date))
      .filter((day): day is Dayjs => day !== null);
    this.#facade.setOfficedays(dates);
  }
}
