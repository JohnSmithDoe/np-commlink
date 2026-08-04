import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  IonBadge,
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBack, chevronForward } from 'ionicons/icons';
import dayjs, { Dayjs } from 'dayjs';
import { TodayService, TrackingFacade } from '../../data';
import { TrackingTimePipe } from '../../util/tracking-time.pipe';

@Component({
  selector: 'app-daily-sessions',
  templateUrl: './daily-sessions.component.html',
  styleUrls: ['./daily-sessions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    IonBadge,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonListHeader,
    IonNote,
    TrackingTimePipe,
    TranslatePipe,
  ],
})
export class DailySessionsComponent {
  readonly #allSessions = inject(TrackingFacade).allSessions;
  readonly #today = inject(TodayService).today;
  readonly selectedDate = signal<Dayjs>(dayjs().startOf('day'));

  readonly isToday = computed(() =>
    this.selectedDate().isSame(this.#today(), 'day')
  );
  readonly selectedDateIso = computed(() => this.selectedDate().toISOString());

  readonly sessions = computed(() => {
    const day = this.selectedDate();
    return this.#allSessions()
      .filter((s) => dayjs(s.startTime).isSame(day, 'day'))
      .toSorted((a, b) => dayjs(a.startTime).diff(dayjs(b.startTime)));
  });

  readonly totals = computed(() => {
    const items = this.sessions();
    const seconds = items.reduce(
      (sum, s) => sum + (s.trackedTimeInSeconds ?? 0),
      0
    );
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return {
      count: items.length,
      duration: hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`,
    };
  });

  constructor() {
    addIcons({ chevronBack, chevronForward });
  }

  prevDay() {
    this.selectedDate.set(this.selectedDate().subtract(1, 'day'));
  }

  nextDay() {
    if (this.isToday()) return;
    this.selectedDate.set(this.selectedDate().add(1, 'day'));
  }
}
