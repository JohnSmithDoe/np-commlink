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
import { localizedLongDate } from '../../../@shared/util/date-format.utils';
import { TranslatePipe } from '@ngx-translate/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  defer,
  EMPTY,
  fromEvent,
  interval,
  map,
  startWith,
  switchMap,
} from 'rxjs';

dayjs.extend(weekOfYear);

const isPageVisible = () => document.visibilityState === 'visible';

// `defer` so the initial visibility is read when the card subscribes, not when
// this module happens to be loaded.
const pageVisibility$ = defer(() =>
  fromEvent(document, 'visibilitychange').pipe(
    map(isPageVisible),
    startWith(isPageVisible())
  )
);

// One ticking source for the whole card: a clock that only ticks while its tab is
// on screen, so a backgrounded card costs nothing and still shows the current
// day the moment it comes back.
const currentTime$ = pageVisibility$.pipe(
  switchMap((visible) => (visible ? interval(1000).pipe(startWith(0)) : EMPTY)),
  map(() => dayjs())
);

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

  // A `computed` dedups by value, so keying the calendar fields on the day
  // *string* recomputes them once at midnight rather than once a second — which
  // is also what makes the date roll over at all: it used to be snapshotted at
  // construction and stayed on yesterday for the rest of the session.
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
