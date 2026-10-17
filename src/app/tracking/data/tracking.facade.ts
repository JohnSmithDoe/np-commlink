import { computed, inject, Service } from '@angular/core';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import {
  DataItem,
  TRACKING_LIST_ID,
  TRACKING_SESSIONS_LIST_ID,
  TrackingItem,
  TrackingViewId,
} from '../model/tracking.types';
import { createDemoSessions } from '../util/demo-sessions.factory';
import { dailySeries, groupSessionsByView } from '../util/sessions.utils';
import { TodayService } from '../../@shared/data/services/today.service';
import { ItemDialogService } from '../../@shared/data/item-lists/item-dialog.service';
import { TrackingActions } from './tracking.actions';
import {
  selectAllTrackingSessions,
  selectArchivedSessions,
  selectLiveChartSessions,
  selectTrackingDataViewId,
  selectTrackingTime,
} from './tracking.selector';

@Service()
export class TrackingFacade {
  readonly #store = inject(Store);
  readonly #today = inject(TodayService).today;
  readonly #dialogs = inject(ItemDialogService);

  readonly total = this.#store.selectSignal(selectTrackingTime);
  readonly viewMode = this.#store.selectSignal(selectTrackingDataViewId);
  readonly allSessions = this.#store.selectSignal(selectAllTrackingSessions);

  readonly archivedSessions = this.#store.selectSignal(selectArchivedSessions);
  readonly #liveForChart = this.#store.selectSignal(selectLiveChartSessions);

  readonly sessionsByView = computed(() =>
    groupSessionsByView(this.archivedSessions(), this.viewMode(), this.#today())
  );
  readonly sessionsByDayAndName = computed(() =>
    dailySeries(this.archivedSessions(), this.#liveForChart(), this.#today())
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

  showSessionDialog(session: TrackingItem): void {
    const archived = this.archivedSessions().some(
      (stored) => stored.id === session.id
    );
    this.#dialogs.open({
      item: session,
      listId: archived ? TRACKING_SESSIONS_LIST_ID : TRACKING_LIST_ID,
      editMode: 'update',
    });
  }

  updateSession(session: TrackingItem): void {
    this.#store.dispatch(TrackingActions.updateSession(session));
  }

  removeDataItem(item: DataItem): void {
    this.#store.dispatch(TrackingActions.removeDataItem(item));
  }

  changeDataView(viewId: TrackingViewId): void {
    this.#store.dispatch(TrackingActions.changeDataView(viewId));
  }
}
