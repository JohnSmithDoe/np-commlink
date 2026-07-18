import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonDatetime,
  DatetimeCustomEvent,
} from '@ionic/angular/standalone';
import { TranslateModule } from '@ngx-translate/core';
import dayjs, { Dayjs } from 'dayjs';
import { Store } from '@ngrx/store';
import {
  OfficeTimeActions,
  dayjsToString,
  daysToHolidaysHighlightsInputTransform,
} from '../../data';
import { DateTimeHighlight } from '../../model';

@Component({
  selector: 'app-dash-freedays-edit',
  templateUrl: './dash-freedays-edit.component.html',
  styleUrls: ['./dash-freedays-edit.component.scss'],
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    TranslateModule,
    IonDatetime,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashFreedaysEditComponent {
  readonly today = dayjsToString(dayjs());
  readonly #store = inject(Store);

  readonly title = input<string | undefined>();
  readonly freedays = input<Array<string>, Array<Dayjs> | undefined | null>(
    [],
    {
      transform: (value) =>
        (value ?? []).map((s) => dayjsToString(s)).filter(Boolean),
    }
  );

  readonly holidays = input<DateTimeHighlight[], Dayjs[] | null | undefined>(
    [],
    { transform: daysToHolidaysHighlightsInputTransform }
  );

  updateFreeDatesFromCalender(ev: DatetimeCustomEvent) {
    const dates = Array.isArray(ev.detail.value)
      ? ev.detail.value
      : [ev.detail.value];

    this.#store.dispatch(OfficeTimeActions.setFreedays(dates));
  }
}
