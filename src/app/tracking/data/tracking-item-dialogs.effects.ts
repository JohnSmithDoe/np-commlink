import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, withLatestFrom } from 'rxjs';
import { ItemDialogsActions } from '../../@shared/data/item-dialogs/item-dialogs.actions';
import { createTrackingItem } from '../util/tracking.factory';
import { TrackingActions } from './tracking.actions';
import { selectTrackingState } from './tracking.selector';

/**
 * Tracking's dialog OPEN-command producer (mirrors `TasksItemDialogsEffects`).
 * Since the dialog refactor the item draft is owned by `edit-tracking-item-dialog`,
 * so this only opens the create dialog on the shared `itemDialogs` slice, seeded
 * with a fresh tracking item. `showCreateDialogWithSearch$` guards on
 * `listId === '_tracking'` so it ignores the grocery/tasks dialogs (shared
 * actions, non-torn-down injectors). Tracking has no categories, hence no
 * category-rename bridge.
 */
@Injectable({ providedIn: 'root' })
export class TrackingItemDialogsEffects {
  #actions$ = inject(Actions);
  #store = inject(Store);

  showCreateDialogWithSearch$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(ItemDialogsActions.showCreateDialogWithSearch),
      filter(({ listId }) => listId === '_tracking'),
      withLatestFrom(this.#store.select(selectTrackingState)),
      map(([, tracking]) => {
        const item = createTrackingItem(tracking.searchQuery ?? '');
        return ItemDialogsActions.showEditDialog(item, '_tracking');
      })
    );
  });

  showCreateByTicket$ = createEffect(() => {
    return this.#actions$.pipe(
      ofType(TrackingActions.showCreateByTicket),
      map(() =>
        ItemDialogsActions.showEditDialog(
          createTrackingItem('new ticket'),
          '_tracking'
        )
      )
    );
  });
}
