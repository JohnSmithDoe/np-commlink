import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  filter,
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
import { ApplicationActions } from './@shared/data/application.actions';
import { TrackingActions } from './tracking/data/tracking.actions';
import { NotificationsActions } from './notifications/data/notifications.actions';

@Injectable({ providedIn: 'root' })
export class AppEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);
  #database = inject(DatabaseService);
  #ui = inject(UiService);

  initializeApplication$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ApplicationActions.load),
      // switchMap (not combineLatestWith) so each load triggers a fresh
      // read of storage rather than re-emitting a cached promise value.
      switchMap(() =>
        from(this.#database.create()).pipe(
          map((data) => ApplicationActions.loadedSuccessfully(data)),
          // Storage init can fail (IndexedDB blocked, quota, Safari private
          // mode). Surface a toast and fall back to empty slices so the
          // reducers' initialState takes over and the app stays usable.
          catchError(() => {
            void this.#ui.showToast(
              this.#ui.translate.instant(marker('toast.storage.unavailable')),
              'warning'
            );
            return of(
              ApplicationActions.loadedSuccessfully({
                tracking: null,
                settings: null,
                officeTime: null,
                notifications: null,
                globals: null,
                shopping: null,
                storage: null,
                tasks: null,
                listSettings: null,
                cash: null,
                trackplay: null,
              })
            );
          })
        )
      )
    );
  });

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

  // Persist the grocery slices whenever one of their domains dispatches. The
  // action-source prefix (`[Globals]`/`[Shopping]`/…) identifies which slice to
  // write; the list-settings slice persists via its own effect. quickadd and
  // itemDialogs are ephemeral UI state and are deliberately not stored.
  saveGroceryOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        filter((action: { type: string }) =>
          /^\[(Globals|Shopping|Storage|Tasks|Trackplay)\]/.test(action.type)
        ),
        withLatestFrom(this.#store, (action, state: IAppState) => ({
          action,
          state,
        })),
        tap(({ action, state }) => {
          if (action.type.startsWith('[Globals]')) {
            void this.#database.save('globals', state.globals);
          } else if (action.type.startsWith('[Shopping]')) {
            void this.#database.save('shopping', state.shopping);
          } else if (action.type.startsWith('[Storage]')) {
            void this.#database.save('storage', state.storage);
          } else if (action.type.startsWith('[Tasks]')) {
            void this.#database.save('tasks', state.tasks);
          } else if (action.type.startsWith('[Trackplay]')) {
            void this.#database.save('trackplay', state.trackplay);
          }
        })
      );
    },
    { dispatch: false }
  );

  // Persist the cash ledger slice on any [Cash] action. Cash is a purpose-built
  // ledger (not a grocery list), so it gets its own effect rather than joining
  // saveGroceryOnChange$.
  saveCashOnChange$ = createEffect(
    () => {
      return this.#actions$.pipe(
        filter((action: { type: string }) => /^\[Cash\]/.test(action.type)),
        withLatestFrom(this.#store, (_action, state: IAppState) => state),
        tap((state) => {
          void this.#database.save('cash', state.cash);
        })
      );
    },
    { dispatch: false }
  );
}
