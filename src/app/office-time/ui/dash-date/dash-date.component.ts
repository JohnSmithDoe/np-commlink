import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { localizedLongDate } from '../../../@shared/util/formatting/date-format.utils';
import { currentTime$ } from '../../../@shared/util/clock';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';

dayjs.extend(weekOfYear);

@Component({
  selector: 'app-dash-date',
  templateUrl: './dash-date.component.html',
  styleUrls: ['./dash-date.component.scss'],
  imports: [
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashDateComponent {
  readonly title = input<string | undefined>();

  readonly #now = toSignal(currentTime$, { initialValue: dayjs() });

  readonly #day = computed(() => this.#now().format('YYYY-MM-DD'));

  readonly data = computed(() => {
    const day = dayjs(this.#day());
    return {
      date: localizedLongDate(day),
      day: day.format('dddd'),
      week: day.week(),
    };
  });

  readonly time = computed(() => this.#now().format('HH:mm:ss'));
}
