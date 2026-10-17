import { Component, computed, inject, signal } from '@angular/core';
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
} from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { addIcons } from 'ionicons';
import { chevronBackOutline, chevronForwardOutline } from 'ionicons/icons';
import dayjs, { Dayjs } from 'dayjs';
import { TodayService } from '../../../@shared/data/services/today.service';
import { TrackingFacade } from '../../data';
import { TrackingItem } from '../../model/tracking.types';
import { TrackingTimePipe } from '../../util/tracking-time.pipe';
import { formatSecondsAsClock } from '../../util/tracking.utils';
import { TrackingStateBadgeComponent } from '../../ui/tracking-state-badge/tracking-state-badge.component';
import { EmptyStateComponent } from '../../../@shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-daily-sessions',
  templateUrl: './daily-sessions.component.html',
  styleUrls: ['./daily-sessions.component.scss'],
  imports: [
    EmptyStateComponent,
    DatePipe,
    TrackingStateBadgeComponent,
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
  readonly #facade = inject(TrackingFacade);
  readonly #allSessions = this.#facade.allSessions;
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
    return {
      count: items.length,
      duration: formatSecondsAsClock(seconds),
    };
  });

  constructor() {
    addIcons({ chevronBackOutline, chevronForwardOutline });
  }

  edit(session: TrackingItem) {
    this.#facade.showSessionDialog(session);
  }

  prevDay() {
    this.selectedDate.set(this.selectedDate().subtract(1, 'day'));
  }

  nextDay() {
    if (this.isToday()) return;
    this.selectedDate.set(this.selectedDate().add(1, 'day'));
  }
}
