import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs';
import { IAppState } from '../../@shared/types';
import { matchesItemExactly } from '../../@shared/util/app.utils';
import { updatedSearchQuery } from '../../@shared/util/item-list/item-list.utils';
import { TrackingActions } from './tracking.actions';
import { addTrackingItemFromSearch } from './item-list.effects';

// Tracking's own item-flow orchestration (add-from-search + search sync).
// Relocated verbatim from the eager shell `AppEffects` into the lazy tracking
// providers (lazy-modules §4): it only reacts to `[Tracking]` actions and reads
// `state.tracking`, so it belongs with the (now lazy) tracking slice.
@Injectable({ providedIn: 'root' })
export class TrackingSearchEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

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
}
