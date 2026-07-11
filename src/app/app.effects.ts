import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  from,
  map,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { IAppState } from './@shared/types';
import { matchesItemExactly } from './@shared/util/app.utils';
import { DatabaseService } from './@shared/util/database.service';
import { UiService } from './@shared/util/ui.service';
import { marker } from '@colsen1991/ngx-translate-extract-marker';
import { addTrackingItemFromSearch } from './tracking/data/item-list.effects';

import { updatedSearchQuery } from './@shared/data/item-list/item-list.utils';
import { applicationActions } from './@shared/data/application.actions';
import { trackingActions } from './tracking/data/tracking.actions';
import { notificationsActions } from './notifications/data/notifications.actions';

@Injectable({ providedIn: 'root' })
export class AppEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #database = inject(DatabaseService);
  #ui = inject(UiService);

  initializeApplication$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(applicationActions.load),
      // switchMap (not combineLatestWith) so each load triggers a fresh
      // read of storage rather than re-emitting a cached promise value.
      switchMap(() =>
        from(this.#database.create()).pipe(
          map((data) => applicationActions.loadedSuccessfully(data)),
          // Storage init can fail (IndexedDB blocked, quota, Safari private
          // mode). Surface a toast and fall back to empty slices so the
          // reducers' initialState takes over and the app stays usable.
          catchError(() => {
            void this.#ui.showToast(
              this.#ui.translate.instant(marker('toast.storage.unavailable')),
              'warning'
            );
            return of(
              applicationActions.loadedSuccessfully({
                tracking: null,
                settings: null,
                officeTime: null,
                notifications: null,
              })
            );
          })
        )
      )
    );
  });

  addItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(trackingActions.addItemFromSearch),
      withLatestFrom(this.#store),
      map(([, state]: [unknown, IAppState]) => addTrackingItemFromSearch(state))
    );
  });
  addOrUpdateItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(trackingActions.addOrUpdateItem),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const localState = state.tracking;
        return matchesItemExactly(action.item, localState.items)
          ? trackingActions.updateItem(action.item)
          : trackingActions.addItem(action.item);
      })
    );
  });

  clearSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(trackingActions.addItem),
      map(() => trackingActions.updateSearch(''))
    );
  });
  updateSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(trackingActions.updateItem),
      withLatestFrom(this.#store, (action, state: IAppState) => ({
        action,
        state,
      })),
      map(({ action, state }) => {
        const searchQuery = state.tracking.searchQuery;
        return trackingActions.updateSearch(
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
          trackingActions.addItem,
          trackingActions.removeItem,
          trackingActions.updateItem,
          trackingActions.toggleTrackingItem,
          trackingActions.resetTracking,
          trackingActions.saveAndResetTracking,
          trackingActions.resetAllTracking,
          trackingActions.removeDataItem
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
          notificationsActions.addNotification,
          notificationsActions.upsertNotification,
          notificationsActions.updateNotificationBody,
          notificationsActions.markDone,
          notificationsActions.markNew,
          notificationsActions.removeNotification,
          notificationsActions.clearDone,
          notificationsActions.toggleDoneSection,
          notificationsActions.markPageViewed
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
}
