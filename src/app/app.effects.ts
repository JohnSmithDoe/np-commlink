import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs';
import { IAppState } from './@shared/types';
import { matchesItemExactly } from './@shared/util/app.utils';
import { DatabaseService } from './@shared/util/database.service';
import { addTrackingItemFromSearch } from './tracking/data/item-list.effects';

import { updatedSearchQuery } from './@shared/data/item-list/item-list.utils';
import { TrackingActions } from './tracking/data/tracking.actions';
import { NotificationsActions } from './@shared/data/notifications/notifications.actions';

@Injectable({ providedIn: 'root' })
export class AppEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #database = inject(DatabaseService);

  addItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.addItemFromSearch),
      withLatestFrom(this.#store),
      map(([, state]: [unknown, IAppState]) => addTrackingItemFromSearch(state))
    );
  });
  addOrUpdateItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.addOrUpdateItem),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const localState = state.tracking;
        return matchesItemExactly(action.item, localState.items)
          ? TrackingActions.updateItem(action.item)
          : TrackingActions.addItem(action.item);
      })
    );
  });

  clearSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.addItem),
      map(() => TrackingActions.updateSearch(''))
    );
  });
  updateSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.updateItem),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const searchQuery = state.tracking.searchQuery;
        return TrackingActions.updateSearch(
          updatedSearchQuery(action.item, searchQuery)
        );
      })
    );
  });

  saveOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        // updateTracking is intentionally excluded: it fires every second
        // while an item runs, and the live counter is recomputed from
        // startTime + breakInSeconds on next load. Persisting on toggle /
        // reset / save-and-reset is enough.
        ofType(
          TrackingActions.addItem,
          TrackingActions.removeItem,
          TrackingActions.updateItem,
          TrackingActions.toggleTrackingItem,
          TrackingActions.resetTracking,
          TrackingActions.saveAndResetTracking,
          TrackingActions.resetAllTracking,
          TrackingActions.removeDataItem
        ),
        withLatestFrom(this.#store, (action, state: IAppState) => ({
          action,
          state,
        })),
        tap(({ state }) => {
          void this.#database.save('tracking', state.tracking);
        })
      );
    },
    { dispatch: false }
  );

  saveNotificationsOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        ofType(
          NotificationsActions.addNotification,
          NotificationsActions.upsertNotification,
          NotificationsActions.updateNotificationBody,
          NotificationsActions.markDone,
          NotificationsActions.markNew,
          NotificationsActions.removeNotification,
          NotificationsActions.clearDone,
          NotificationsActions.toggleDoneSection,
          NotificationsActions.markPageViewed
        ),
        withLatestFrom(this.#store, (action, state: IAppState) => ({
          action,
          state,
        })),
        tap(({ state }) => {
          void this.#database.save('notifications', state.notifications);
        })
      );
    },
    { dispatch: false }
  );

  // The grocery + tasks slices persist via their own lazy save effects
  // (GrocerySaveEffects / TasksSaveEffects, registered on their routes —
  // lazy-modules Phase E). Trackplay + cash likewise (Phase D). What remains
  // eager here is tracking + notifications only (both eager contexts).
}
