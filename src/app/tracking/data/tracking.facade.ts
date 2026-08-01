import { computed, inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import {
  IDataItem,
  ITrackingItem,
  TTrackingViewId,
} from '../model/tracking.types';
import { createDemoSessions } from '../util/demo-sessions.factory';
import { dailySeries, groupSessionsByView } from '../util/sessions.utils';
import { TodayService } from '../util/today.service';
import { TrackingActions } from './tracking.actions';
import {
  selectAllTrackingSessions,
  selectArchivedSessions,
  selectLiveChartSessions,
  selectTrackingDataViewId,
  selectTrackingTime,
} from './tracking.selector';

/**
 * The `tracking` domain facade — the timer and the session archive it produces.
 *
 * It serves the tracker page's clock affordances (start/pause, reset, archive),
 * the stats page at `/data` and the two panels that read the archive (the
 * sessions chart, the daily-sessions list). Editing the *list of activities* is
 * the other half of the domain and lives on {@link TrackingListPageFacade},
 * which is bound to the shared `LIST_FACADE` token.
 */
@Injectable({ providedIn: 'root' })
export class TrackingFacade {
  readonly #store = inject(Store);
  readonly #today = inject(TodayService).today;

  // ── Queries ──────────────────────────────────────────────────────────────
  readonly total = this.#store.selectSignal(selectTrackingTime);
  readonly viewMode = this.#store.selectSignal(selectTrackingDataViewId);
  readonly allSessions = this.#store.selectSignal(selectAllTrackingSessions);

  readonly #archived = this.#store.selectSignal(selectArchivedSessions);
  readonly #liveForChart = this.#store.selectSignal(selectLiveChartSessions);

  /**
   * The two views that depend on what day it is, composed here rather than in a
   * selector.
   *
   * Both were `createSelector`s whose projectors called `dayjs()` — a dependency
   * memoization cannot see, so each froze at whatever "today" meant when the
   * session array last changed, and an app left open past midnight went on
   * calling yesterday "Heute". As `computed`s over {@link TodayService} the day is
   * a declared dependency like any other, so the roll-over recomputes them and
   * nothing else does.
   */
  readonly sessionsByView = computed(() =>
    groupSessionsByView(this.#archived(), this.viewMode(), this.#today())
  );
  readonly sessionsByDayAndName = computed(() =>
    dailySeries(this.#archived(), this.#liveForChart(), this.#today())
  );

  // ── Timer commands ───────────────────────────────────────────────────────
  toggleTracking(item: ITrackingItem): void {
    this.#store.dispatch(
      TrackingActions.toggleTrackingItem(item, dayjs().format())
    );
  }

  resetItem(item: ITrackingItem): void {
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

  // The dev affordance generates its sessions here so the reducer only ever
  // merges what the action carries.
  seedDemoSessions(): void {
    this.#store.dispatch(
      TrackingActions.seedDemoSessions(createDemoSessions())
    );
  }

  // ── Session-archive commands ─────────────────────────────────────────────
  shareCsv(): void {
    this.#store.dispatch(TrackingActions.shareData());
  }

  removeDataItem(item: IDataItem): void {
    this.#store.dispatch(TrackingActions.removeDataItem(item));
  }

  changeDataView(viewId: TTrackingViewId): void {
    this.#store.dispatch(TrackingActions.changeDataView(viewId));
  }
}
