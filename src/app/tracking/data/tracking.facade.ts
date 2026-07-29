import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import dayjs from 'dayjs';
import { IDataItem, ITrackingItem } from '../model/tracking.types';
import { createDemoSessions } from '../util/demo-sessions.factory';
import { TrackingActions } from './actions/tracking.actions';
import {
  selectAllTrackingSessions,
  selectSessionsByDayAndName,
  selectTrackingData,
  selectTrackingDataViewId,
  selectTrackingTime,
} from './selectors/tracking.selector';

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

  // ── Queries ──────────────────────────────────────────────────────────────
  readonly total = this.#store.selectSignal(selectTrackingTime);
  readonly sessionsByView = this.#store.selectSignal(selectTrackingData);
  readonly viewMode = this.#store.selectSignal(selectTrackingDataViewId);
  readonly allSessions = this.#store.selectSignal(selectAllTrackingSessions);
  readonly sessionsByDayAndName = this.#store.selectSignal(
    selectSessionsByDayAndName
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

  changeDataView(viewId: string): void {
    this.#store.dispatch(TrackingActions.changeDataView(viewId));
  }
}
