import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import {
  DataItem,
  TrackingItem,
  TrackingViewId,
} from '../model/tracking.types';
import { createDemoSessions } from '../util/demo-sessions.factory';
import { dailySeries, groupSessionsByView } from '../util/sessions.utils';
import { TodayService } from './today.service';
import { TrackingActions } from './tracking.actions';
import {
  selectAllTrackingSessions,
  selectArchivedSessions,
  selectLiveChartSessions,
  selectTrackingDataViewId,
  selectTrackingTime,
} from './tracking.selector';

@Injectable({ providedIn: 'root' })
export class TrackingFacade {
  readonly #store = inject(Store);
  readonly #today = inject(TodayService).today;

  readonly total = this.#store.selectSignal(selectTrackingTime);
  readonly viewMode = this.#store.selectSignal(selectTrackingDataViewId);
  readonly allSessions = this.#store.selectSignal(selectAllTrackingSessions);

  readonly #archived = this.#store.selectSignal(selectArchivedSessions);
  readonly #liveForChart = this.#store.selectSignal(selectLiveChartSessions);

  readonly sessionsByView = computed(() =>
    groupSessionsByView(this.#archived(), this.viewMode(), this.#today())
  );
  readonly sessionsByDayAndName = computed(() =>
    dailySeries(this.#archived(), this.#liveForChart(), this.#today())
  );

  toggleTracking(item: TrackingItem): void {
    this.#store.dispatch(
      TrackingActions.toggleTrackingItem(item, dayjs().format())
    );
  }

  resetItem(item: TrackingItem): void {
    this.#store.dispatch(TrackingActions.resetTracking(item));
  }

  resetAll(): void {
    this.#store.dispatch(TrackingActions.resetAllTracking());
  }

  saveAndReset(): void {
    this.#store.dispatch(TrackingActions.saveAndResetTracking());
  }

  applyNotificationCommand(command: string, targetId: string): void {
    this.#store.dispatch(
      TrackingActions.applyNotificationCommand(command, targetId)
    );
  }

  seedDemoSessions(): void {
    this.#store.dispatch(
      TrackingActions.seedDemoSessions(createDemoSessions())
    );
  }

  shareCsv(): void {
    this.#store.dispatch(TrackingActions.shareData());
  }

  removeDataItem(item: DataItem): void {
    this.#store.dispatch(TrackingActions.removeDataItem(item));
  }

  changeDataView(viewId: TrackingViewId): void {
    this.#store.dispatch(TrackingActions.changeDataView(viewId));
  }
}
