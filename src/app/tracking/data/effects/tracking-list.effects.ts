import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, withLatestFrom } from 'rxjs';
import { matchesItemExactly } from '../../../@shared/util/app.utils';
import { updatedSearchQuery } from '../../../@shared/util/list/list.utils';
import { createTrackingItem } from '../../util/tracking.factory';
import { TrackingActions } from '../tracking.actions';
import { selectTrackingState } from '../tracking.selector';

// Tracking's own item-flow orchestration (add-from-search + add-or-update +
// search sync). Mirrors `TasksListEffects` in the sealed tasks domain: it only
// reacts to `[Tracking]` actions and reads the tracking slice, so it rides with
// the lazy tracking providers. Tracking is category-less, so it carries none of
// the category-mode/quick-add effects the grocery/tasks engines do.
@Injectable({ providedIn: 'root' })
export class TrackingListEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

  addItemFromSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.addItemFromSearch),
      withLatestFrom(this.#store.select(selectTrackingState), (_, tracking) => {
        const item = createTrackingItem(tracking.searchQuery ?? '');
        const found = matchesItemExactly(item, tracking.items);
        return found
          ? TrackingActions.addItemFailure(found)
          : TrackingActions.addItem(item);
      })
    );
  });

  addOrUpdateItem$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.addOrUpdateItem),
      withLatestFrom(
        this.#store.select(selectTrackingState),
        (action, tracking) =>
          matchesItemExactly(action.item, tracking.items)
            ? TrackingActions.updateItem(action.item)
            : TrackingActions.addItem(action.item)
      )
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
      withLatestFrom(
        this.#store.select(selectTrackingState),
        (action, tracking) =>
          TrackingActions.updateSearch(
            action.item
              ? updatedSearchQuery(action.item, tracking.searchQuery)
              : tracking.searchQuery
          )
      )
    );
  });
}
