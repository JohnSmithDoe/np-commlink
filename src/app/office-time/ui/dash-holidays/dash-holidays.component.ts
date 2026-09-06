import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonList,
} from '@ionic/angular/standalone';
import { Dayjs } from 'dayjs';
import { HolidayMap } from '../../model/office-time.types';
import { dayjsFromString } from '../../util/office-time.utils';

@Component({
  selector: 'app-dash-holidays',
  templateUrl: './dash-holidays.component.html',
  styleUrls: ['./dash-holidays.component.scss'],
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonList,
    IonItem,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashHolidaysComponent {
  readonly title = input<string | undefined>();
  readonly holidays = input<
    { name: string; date: Dayjs }[],
    HolidayMap | undefined | null
  >([], {
    transform(holidays?: HolidayMap | null) {
      return Object.entries(holidays ?? {}).flatMap(([name, key]) => {
        const date = dayjsFromString(key);
        return date ? [{ name, date }] : [];
      });
    },
  });
}
