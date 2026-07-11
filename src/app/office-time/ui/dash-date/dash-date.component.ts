import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
} from '@ionic/angular/standalone';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { TranslateModule } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, map, startWith } from 'rxjs';

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
    TranslateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashDateComponent {
  readonly title = input<string | undefined>();

  readonly data = {
    date: dayjs().format('DD MMMM YYYY'),
    day: dayjs().format('dddd'),
    week: dayjs().week(),
    month: dayjs().format('MMMM'),
    year: dayjs().format('YYYY'),
    weekday: dayjs().format('dddd'),
  };
  readonly time = toSignal(
    interval(1000).pipe(
      startWith(0),
      map(() => dayjs().format('HH:mm:ss'))
    ),
    { requireSync: true }
  );
}
